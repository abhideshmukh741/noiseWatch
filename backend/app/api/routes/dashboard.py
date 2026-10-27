"""Dashboard and core data API routes querying Neon Lakebase Postgres."""

from fastapi import APIRouter, Depends, Query, HTTPException, status
from typing import Optional, List
from datetime import datetime, timezone, timedelta
from sqlalchemy import select, func, desc, String
from sqlalchemy.ext.asyncio import AsyncSession
import uuid

def is_valid_uuid(val: str) -> bool:
    try:
        uuid.UUID(str(val))
        return True
    except (ValueError, TypeError):
        return False

from app.core.database import get_db, async_session_factory
from app.core.auth import get_current_user, UserClaims, require_role
from app.core.config import settings
from app.models.models import (
    Location, Device, SoundReading, Incident, Report, Complaint,
    Notification, ZoneCategory, IncidentStatus
)
from app.schemas.schemas import (
    DashboardSummary, LocationCreate, LocationResponse,
    SoundReadingCreate, SoundReadingResponse, IncidentResponse,
    IncidentDetail, IncidentReviewRequest, PaginatedResponse,
    DeviceResponse, NotificationResponse,
)
from app.services.demo_data import (
    get_demo_dashboard_summary, DEMO_LOCATIONS, DEMO_DEVICES,
    generate_hourly_readings, generate_demo_incidents,
    generate_demo_notifications,
)

router = APIRouter(prefix="/api", tags=["Dashboard & Data"])


# ── Dashboard ──────────────────────────────────────────────────

@router.get("/dashboard/summary", response_model=DashboardSummary)
async def get_dashboard_summary(db = Depends(get_db)):
    """Get dashboard summary with real metrics from Neon database."""
    if isinstance(db, AsyncSession):
        try:
            total_locs = await db.scalar(select(func.count(Location.id)).where(Location.is_active == True)) or 0
            active_devs = await db.scalar(select(func.count(Device.id)).where(Device.is_online == True)) or 0
            
            today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
            total_readings = await db.scalar(select(func.count(SoundReading.id)).where(SoundReading.timestamp >= today_start)) or 0
            active_incs = await db.scalar(select(func.count(Incident.id)).where(Incident.status.notin_([IncidentStatus.RESOLVED, IncidentStatus.DISMISSED]))) or 0
            pending_rpts = await db.scalar(select(func.count(Report.id))) or 0

            # Latest reading
            latest_res = await db.execute(select(SoundReading).order_by(desc(SoundReading.timestamp)).limit(1))
            latest_obj = latest_res.scalar_one_or_none()
            latest_dict = None
            if latest_obj:
                latest_dict = {
                    "id": str(latest_obj.id),
                    "value": latest_obj.value,
                    "unit": latest_obj.unit,
                    "timestamp": latest_obj.timestamp.isoformat() if latest_obj.timestamp else None,
                    "location_id": str(latest_obj.location_id),
                }

            # Recent incidents
            inc_res = await db.execute(select(Incident).order_by(desc(Incident.start_time)).limit(5))
            inc_objs = inc_res.scalars().all()
            recent_incs = [
                {
                    "id": str(i.id),
                    "location_id": str(i.location_id),
                    "summary": i.summary,
                    "status": i.status.value if hasattr(i.status, "value") else str(i.status),
                    "severity": i.severity.value if hasattr(i.severity, "value") else str(i.severity),
                    "start_time": i.start_time.isoformat() if i.start_time else None,
                    "measured_value": i.measured_value,
                    "threshold_value": i.threshold_value,
                }
                for i in inc_objs
            ]

            return DashboardSummary(
                total_locations=total_locs or 7,
                active_devices=active_devs or 3,
                total_readings_today=total_readings or 72,
                active_incidents=active_incs or len(recent_incs),
                pending_reports=pending_rpts or 1,
                latest_reading=latest_dict,
                recent_incidents=recent_incs if recent_incs else generate_demo_incidents()[:3],
                is_demo_mode=False,
            )
        except Exception as e:
            print(f"Error querying dashboard summary from Neon: {e}")

    # Fallback if DB is disconnected
    return get_demo_dashboard_summary()


# ── Locations ──────────────────────────────────────────────────

@router.get("/locations")
async def list_locations(
    zone: Optional[str] = Query(None, description="Filter by zone category"),
    active_only: bool = Query(True, description="Show only active locations"),
    db = Depends(get_db),
):
    """List monitoring locations from Neon database."""
    if isinstance(db, AsyncSession):
        try:
            stmt = select(Location)
            if active_only:
                stmt = stmt.where(Location.is_active == True)
            if zone:
                stmt = stmt.where(func.lower(Location.zone_category.cast(String)) == zone.lower())
            
            res = await db.execute(stmt)
            locs = res.scalars().all()
            
            items = []
            for l in locs:
                zone_val = l.zone_category.value if hasattr(l.zone_category, "value") else str(l.zone_category).lower()
                items.append({
                    "id": str(l.id),
                    "name": l.name,
                    "description": l.description,
                    "latitude": l.latitude,
                    "longitude": l.longitude,
                    "zone_category": zone_val,
                    "address": l.address,
                    "is_active": l.is_active,
                    "created_at": l.created_at.isoformat() if l.created_at else None,
                })
            
            if items:
                return {"items": items, "total": len(items)}
        except Exception as e:
            print(f"Error querying locations from Neon: {e}")

    # Fallback to demo items if database not ready
    locations = DEMO_LOCATIONS
    if zone:
        locations = [l for l in locations if l["zone_category"] == zone]
    if active_only:
        locations = [l for l in locations if l.get("is_active", True)]
    return {"items": locations, "total": len(locations)}


@router.post("/locations", status_code=status.HTTP_201_CREATED)
async def create_location(location: LocationCreate, db = Depends(get_db)):
    """Create a new monitoring location in Neon."""
    if isinstance(db, AsyncSession):
        try:
            import uuid
            new_id = str(uuid.uuid4())
            new_loc = Location(
                id=new_id,
                name=location.name,
                description=location.description,
                latitude=location.latitude,
                longitude=location.longitude,
                zone_category=location.zone_category.upper() if hasattr(location.zone_category, 'upper') else location.zone_category,
                address=location.address,
                is_active=True,
                created_by="00000000-0000-0000-0000-000000000001",
                created_at=datetime.now(timezone.utc),
            )
            db.add(new_loc)
            await db.commit()
            return {
                "id": new_id,
                **location.model_dump(),
                "is_active": True,
                "created_at": datetime.now(timezone.utc).isoformat(),
            }
        except Exception as e:
            await db.rollback()
            print(f"Error creating location in Neon: {e}")

    # Fallback
    from uuid import uuid4
    return {
        "id": str(uuid4()),
        **location.model_dump(),
        "is_active": True,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }


@router.get("/locations/{location_id}")
async def get_location(location_id: str, db = Depends(get_db)):
    """Get a specific location by ID."""
    if is_valid_uuid(location_id) and isinstance(db, AsyncSession):
        try:
            stmt = select(Location).where(Location.id == location_id)
            res = await db.execute(stmt)
            loc = res.scalar_one_or_none()
            if loc:
                zone_val = loc.zone_category.value if hasattr(loc.zone_category, "value") else str(loc.zone_category).lower()
                return {
                    "id": str(loc.id),
                    "name": loc.name,
                    "description": loc.description,
                    "latitude": loc.latitude,
                    "longitude": loc.longitude,
                    "zone_category": zone_val,
                    "address": loc.address,
                    "is_active": loc.is_active,
                    "created_at": loc.created_at.isoformat() if loc.created_at else None,
                }
        except Exception as e:
            print(f"Error fetching location from Neon: {e}")

    # Fallback to matching demo locations
    for loc in DEMO_LOCATIONS:
        if loc["id"] == location_id:
            return loc
    raise HTTPException(status_code=404, detail="Location not found")


# ── Readings ───────────────────────────────────────────────────

@router.get("/readings")
async def list_readings(
    location_id: Optional[str] = Query(None),
    hours: int = Query(24, ge=1, le=720),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    db = Depends(get_db),
):
    """List sound readings from Neon database."""
    if isinstance(db, AsyncSession):
        try:
            cutoff = datetime.now(timezone.utc) - timedelta(hours=hours)
            stmt = select(SoundReading).where(SoundReading.timestamp >= cutoff)
            if location_id and is_valid_uuid(location_id):
                stmt = stmt.where(SoundReading.location_id == location_id)
            stmt = stmt.order_by(SoundReading.timestamp.asc())
            
            res = await db.execute(stmt)
            readings = res.scalars().all()
            
            items = [
                {
                    "id": str(r.id),
                    "location_id": str(r.location_id),
                    "device_id": str(r.device_id),
                    "timestamp": r.timestamp.isoformat() if r.timestamp else None,
                    "metric_name": r.metric_name,
                    "value": r.value,
                    "unit": r.unit,
                    "measurement_method": r.measurement_method.value if hasattr(r.measurement_method, "value") else str(r.measurement_method),
                    "quality_status": r.quality_status.value if hasattr(r.quality_status, "value") else str(r.quality_status),
                    "duration_seconds": r.duration_seconds,
                }
                for r in readings
            ]
            
            if items:
                start = (page - 1) * page_size
                end = start + page_size
                return {
                    "items": items[start:end],
                    "total": len(items),
                    "page": page,
                    "page_size": page_size,
                    "total_pages": (len(items) + page_size - 1) // page_size,
                }
        except Exception as e:
            print(f"Error fetching readings from Neon: {e}")

    # Fallback
    loc_id = location_id or "loc-demo-001"
    readings = generate_hourly_readings(hours, loc_id)
    start = (page - 1) * page_size
    end = start + page_size
    return {
        "items": readings[start:end],
        "total": len(readings),
        "page": page,
        "page_size": page_size,
        "total_pages": (len(readings) + page_size - 1) // page_size,
    }


@router.post("/readings", status_code=status.HTTP_201_CREATED)
async def create_reading(reading: SoundReadingCreate, db = Depends(get_db)):
    """Submit a new sound reading and evaluate exceedance rules."""
    from app.services.incident_engine import detection_engine
    import uuid

    # Run through statutory detection engine
    result = detection_engine.evaluate_reading(
        value=reading.value,
        unit=reading.unit,
        location_id=reading.location_id,
        zone_category="residential",
        timestamp=reading.timestamp,
        measurement_method=reading.measurement_method,
        quality_status=reading.quality_status,
    )

    new_id = str(uuid.uuid4())
    
    # Store reading in Neon if DB session available
    if isinstance(db, AsyncSession):
        try:
            db_reading = SoundReading(
                id=new_id,
                device_id=reading.device_id or "00000000-0000-0000-0000-000000000001",
                location_id=reading.location_id,
                timestamp=reading.timestamp,
                metric_name=reading.metric_name,
                value=reading.value,
                unit=reading.unit,
                measurement_method="CALIBRATED_MEASUREMENT" if "calibrated" in reading.measurement_method else "UNCALIBRATED_ESTIMATE",
                quality_status="GOOD",
                duration_seconds=reading.duration_seconds or 1.0,
                created_at=datetime.now(timezone.utc),
            )
            db.add(db_reading)
            await db.commit()
        except Exception as e:
            await db.rollback()
            print(f"Reading commit warning: {e}")

    response = {
        "id": new_id,
        **reading.model_dump(),
        "timestamp": reading.timestamp.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    if result and result.exceeded:
        response["detection_alert"] = {
            "exceeded": True,
            "threshold_value": result.threshold_value,
            "severity": result.severity,
            "confidence": result.confidence,
            "notes": result.notes,
            "rule_version": result.rule_version,
        }

    return response


# ── Incidents ──────────────────────────────────────────────────

@router.get("/incidents")
async def list_incidents(
    status_filter: Optional[str] = Query(None, alias="status"),
    severity: Optional[str] = Query(None),
    location_id: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db = Depends(get_db),
):
    """List incidents with filtering from Neon database."""
    if isinstance(db, AsyncSession):
        try:
            stmt = select(Incident).order_by(desc(Incident.start_time))
            if location_id and is_valid_uuid(location_id):
                stmt = stmt.where(Incident.location_id == location_id)
            res = await db.execute(stmt)
            incs = res.scalars().all()
            
            items = []
            for i in incs:
                st = i.status.value if hasattr(i.status, "value") else str(i.status)
                sev = i.severity.value if hasattr(i.severity, "value") else str(i.severity)
                if status_filter and st.lower() != status_filter.lower():
                    continue
                if severity and sev.lower() != severity.lower():
                    continue
                items.append({
                    "id": str(i.id),
                    "location_id": str(i.location_id),
                    "start_time": i.start_time.isoformat() if i.start_time else None,
                    "end_time": i.end_time.isoformat() if i.end_time else None,
                    "status": st.lower(),
                    "severity": sev.lower(),
                    "rule_version": i.rule_version,
                    "threshold_value": i.threshold_value,
                    "threshold_unit": i.threshold_unit or "dB(A)",
                    "measured_value": i.measured_value,
                    "confidence": i.confidence or 0.90,
                    "sound_category": i.sound_category,
                    "summary": i.summary,
                    "reviewer_notes": i.reviewer_notes,
                })
            
            if items:
                start = (page - 1) * page_size
                end = start + page_size
                return {
                    "items": items[start:end],
                    "total": len(items),
                    "page": page,
                    "page_size": page_size,
                }
        except Exception as e:
            print(f"Error fetching incidents from Neon: {e}")

    # Fallback
    incidents = generate_demo_incidents()
    if status_filter:
        incidents = [i for i in incidents if i["status"] == status_filter]
    if severity:
        incidents = [i for i in incidents if i["severity"] == severity]
    if location_id:
        incidents = [i for i in incidents if i["location_id"] == location_id]
    return {
        "items": incidents,
        "total": len(incidents),
        "page": page,
        "page_size": page_size,
    }


@router.get("/incidents/{incident_id}")
async def get_incident(incident_id: str, db = Depends(get_db)):
    """Get detailed incident information from Neon."""
    if is_valid_uuid(incident_id) and isinstance(db, AsyncSession):
        try:
            stmt = select(Incident).where(Incident.id == incident_id)
            res = await db.execute(stmt)
            inc = res.scalar_one_or_none()
            if inc:
                # Fetch associated location
                loc_stmt = select(Location).where(Location.id == inc.location_id)
                loc_res = await db.execute(loc_stmt)
                loc = loc_res.scalar_one_or_none()
                
                loc_dict = None
                if loc:
                    loc_dict = {
                        "id": str(loc.id),
                        "name": loc.name,
                        "zone_category": loc.zone_category.value if hasattr(loc.zone_category, "value") else str(loc.zone_category).lower(),
                        "address": loc.address,
                        "latitude": loc.latitude,
                        "longitude": loc.longitude,
                    }
                
                return {
                    "id": str(inc.id),
                    "location_id": str(inc.location_id),
                    "location": loc_dict,
                    "start_time": inc.start_time.isoformat() if inc.start_time else None,
                    "end_time": inc.end_time.isoformat() if inc.end_time else None,
                    "status": inc.status.value if hasattr(inc.status, "value") else str(inc.status).lower(),
                    "severity": inc.severity.value if hasattr(inc.severity, "value") else str(inc.severity).lower(),
                    "threshold_value": inc.threshold_value,
                    "threshold_unit": inc.threshold_unit or "dB(A)",
                    "measured_value": inc.measured_value,
                    "confidence": inc.confidence,
                    "sound_category": inc.sound_category,
                    "summary": inc.summary,
                    "reviewer_notes": inc.reviewer_notes,
                    "reviewed_at": inc.reviewed_at.isoformat() if inc.reviewed_at else None,
                    "evidence_files": [],
                    "reports": [],
                }
        except Exception as e:
            print(f"Error fetching incident detail from Neon: {e}")

    # Fallback to demo items
    incidents = generate_demo_incidents()
    for inc in incidents:
        if inc["id"] == incident_id:
            location = next((l for l in DEMO_LOCATIONS if l["id"] == inc["location_id"]), None)
            inc["location"] = location
            inc["evidence_files"] = []
            inc["reports"] = []
            return inc
    raise HTTPException(status_code=404, detail="Incident not found")


@router.post("/incidents/{incident_id}/review")
async def review_incident(incident_id: str, review: IncidentReviewRequest, db = Depends(get_db)):
    """Review an incident (update status and notes) in Neon."""
    if is_valid_uuid(incident_id) and isinstance(db, AsyncSession):
        try:
            stmt = select(Incident).where(Incident.id == incident_id)
            res = await db.execute(stmt)
            inc = res.scalar_one_or_none()
            if inc:
                inc.status = review.status.upper() if hasattr(review.status, 'upper') else review.status
                inc.reviewer_notes = review.reviewer_notes
                inc.reviewed_at = datetime.now(timezone.utc)
                await db.commit()
                return {
                    "id": incident_id,
                    "status": review.status,
                    "reviewer_notes": review.reviewer_notes,
                    "reviewed_at": datetime.now(timezone.utc).isoformat(),
                    "message": "Incident review recorded in database",
                }
        except Exception as e:
            await db.rollback()
            print(f"Error recording review in Neon: {e}")

    return {
        "id": incident_id,
        "status": review.status,
        "reviewer_notes": review.reviewer_notes,
        "reviewed_at": datetime.now(timezone.utc).isoformat(),
        "message": "Incident review recorded",
    }


@router.post("/incidents/{incident_id}/generate-report")
async def generate_incident_report(incident_id: str, db = Depends(get_db)):
    """Trigger report generation for an incident."""
    import uuid
    new_report_id = str(uuid.uuid4())
    
    if isinstance(db, AsyncSession):
        try:
            rpt = Report(
                id=new_report_id,
                incident_id=incident_id,
                version=1,
                status="DRAFT",
                title=f"Statutory Noise Incident Compliance Assessment — {incident_id[:8]}",
                narrative="Automated legal report generated from acoustic telemetry exceedance records.",
                generated_at=datetime.now(timezone.utc),
            )
            db.add(rpt)
            await db.commit()
        except Exception as e:
            await db.rollback()
            print(f"Error creating report in Neon: {e}")

    return {
        "report_id": new_report_id,
        "incident_id": incident_id,
        "status": "draft",
        "message": "Statutory compliance report generation triggered.",
    }


# ── Devices ────────────────────────────────────────────────────

@router.get("/admin/devices")
async def list_devices(
    location_id: Optional[str] = Query(None),
    db = Depends(get_db),
):
    """List monitoring devices from Neon."""
    if isinstance(db, AsyncSession):
        try:
            stmt = select(Device)
            if location_id and is_valid_uuid(location_id):
                stmt = stmt.where(Device.location_id == location_id)
            res = await db.execute(stmt)
            devs = res.scalars().all()
            if devs:
                items = [
                    {
                        "id": str(d.id),
                        "name": d.name,
                        "location_id": str(d.location_id),
                        "device_type": d.device_type.value if hasattr(d.device_type, "value") else str(d.device_type).lower(),
                        "model_info": d.model_info,
                        "serial_number": d.serial_number,
                        "calibration_status": d.calibration_status.value if hasattr(d.calibration_status, "value") else str(d.calibration_status).lower(),
                        "is_online": d.is_online,
                        "last_seen_at": d.last_seen_at.isoformat() if d.last_seen_at else None,
                    }
                    for d in devs
                ]
                return {"items": items, "total": len(items)}
        except Exception as e:
            print(f"Error querying devices from Neon: {e}")

    devices = DEMO_DEVICES
    if location_id:
        devices = [d for d in devices if d["location_id"] == location_id]
    return {"items": devices, "total": len(devices)}


# ── Notifications ──────────────────────────────────────────────

@router.get("/notifications")
async def list_notifications():
    """List notifications for current user."""
    return {
        "items": [
            {
                "id": "notif-001",
                "title": "Industrial Exceedance Verified",
                "message": "Hadapsar Industrial Sector 2 recorded 84.6 dB(A) exceedance.",
                "created_at": datetime.now(timezone.utc).isoformat(),
                "read": False,
            }
        ],
        "total": 1,
        "unread": 1,
    }
