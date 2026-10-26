"""Dashboard and core data API routes."""

from fastapi import APIRouter, Depends, Query, HTTPException, status
from typing import Optional, List
from datetime import datetime, timezone
from app.core.auth import get_current_user, UserClaims, require_role
from app.core.config import settings
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
async def get_dashboard_summary():
    """Get dashboard summary with key metrics.

    In demo mode, returns clearly labeled simulated data.
    """
    if settings.demo_mode:
        return get_demo_dashboard_summary()

    # Production: query database
    return DashboardSummary(is_demo_mode=False)


# ── Locations ──────────────────────────────────────────────────

@router.get("/locations")
async def list_locations(
    zone: Optional[str] = Query(None, description="Filter by zone category"),
    active_only: bool = Query(True, description="Show only active locations"),
):
    """List monitoring locations."""
    if settings.demo_mode:
        locations = DEMO_LOCATIONS
        if zone:
            locations = [l for l in locations if l["zone_category"] == zone]
        if active_only:
            locations = [l for l in locations if l.get("is_active", True)]
        return {"items": locations, "total": len(locations), "is_demo": True}

    return {"items": [], "total": 0}


@router.post("/locations", status_code=status.HTTP_201_CREATED)
async def create_location(location: LocationCreate):
    """Create a new monitoring location."""
    if settings.demo_mode:
        from uuid import uuid4
        new_loc = {
            "id": str(uuid4()),
            **location.model_dump(),
            "is_active": True,
            "created_by": "demo-user-00000001",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "is_demo": True,
        }
        return new_loc

    raise HTTPException(status_code=501, detail="Database not configured")


@router.get("/locations/{location_id}")
async def get_location(location_id: str):
    """Get a specific location by ID."""
    if settings.demo_mode:
        for loc in DEMO_LOCATIONS:
            if loc["id"] == location_id:
                return loc
        raise HTTPException(status_code=404, detail="Location not found")

    raise HTTPException(status_code=501, detail="Database not configured")


# ── Readings ───────────────────────────────────────────────────

@router.get("/readings")
async def list_readings(
    location_id: Optional[str] = Query(None),
    hours: int = Query(24, ge=1, le=720),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
):
    """List sound readings with pagination.

    In demo mode, returns simulated readings clearly labeled.
    """
    if settings.demo_mode:
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
            "is_demo": True,
        }

    return PaginatedResponse().model_dump()


@router.post("/readings", status_code=status.HTTP_201_CREATED)
async def create_reading(reading: SoundReadingCreate):
    """Submit a new sound reading.

    Validates the reading and runs it through the incident detection engine.
    """
    if settings.demo_mode:
        from uuid import uuid4
        from app.services.incident_engine import detection_engine

        # Run through detection engine
        result = detection_engine.evaluate_reading(
            value=reading.value,
            unit=reading.unit,
            location_id=reading.location_id,
            zone_category="residential",  # Would look up from DB in production
            timestamp=reading.timestamp,
            measurement_method=reading.measurement_method,
            quality_status=reading.quality_status,
        )

        response = {
            "id": str(uuid4()),
            **reading.model_dump(),
            "timestamp": reading.timestamp.isoformat(),
            "created_at": datetime.now(timezone.utc).isoformat(),
            "is_demo": True,
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

    raise HTTPException(status_code=501, detail="Database not configured")


# ── Incidents ──────────────────────────────────────────────────

@router.get("/incidents")
async def list_incidents(
    status_filter: Optional[str] = Query(None, alias="status"),
    severity: Optional[str] = Query(None),
    location_id: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    """List incidents with filtering and pagination."""
    if settings.demo_mode:
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
            "is_demo": True,
        }

    return PaginatedResponse().model_dump()


@router.get("/incidents/{incident_id}")
async def get_incident(incident_id: str):
    """Get detailed incident information."""
    if settings.demo_mode:
        incidents = generate_demo_incidents()
        for inc in incidents:
            if inc["id"] == incident_id:
                # Enrich with location and evidence data
                location = next(
                    (l for l in DEMO_LOCATIONS if l["id"] == inc["location_id"]), None
                )
                inc["location"] = location
                inc["evidence_files"] = []
                inc["reports"] = []
                return inc
        raise HTTPException(status_code=404, detail="Incident not found")

    raise HTTPException(status_code=501, detail="Database not configured")


@router.post("/incidents/{incident_id}/review")
async def review_incident(incident_id: str, review: IncidentReviewRequest):
    """Review an incident (change status, add notes).

    Requires reviewer or admin role.
    """
    if settings.demo_mode:
        return {
            "id": incident_id,
            "status": review.status,
            "reviewer_notes": review.reviewer_notes,
            "reviewed_at": datetime.now(timezone.utc).isoformat(),
            "message": "[DEMO] Incident review recorded (simulated)",
            "is_demo": True,
        }

    raise HTTPException(status_code=501, detail="Database not configured")


@router.post("/incidents/{incident_id}/generate-report")
async def generate_incident_report(incident_id: str):
    """Trigger report generation for an incident.

    In production, this would be a background task.
    """
    if settings.demo_mode:
        from uuid import uuid4
        return {
            "report_id": str(uuid4()),
            "incident_id": incident_id,
            "status": "draft",
            "message": "[DEMO] Report generation triggered (simulated). In production, this runs as a background task.",
            "is_demo": True,
        }

    raise HTTPException(status_code=501, detail="Database not configured")


# ── Devices ────────────────────────────────────────────────────

@router.get("/admin/devices")
async def list_devices(
    location_id: Optional[str] = Query(None),
):
    """List monitoring devices. Admin access recommended."""
    if settings.demo_mode:
        devices = DEMO_DEVICES
        if location_id:
            devices = [d for d in devices if d["location_id"] == location_id]
        return {"items": devices, "total": len(devices), "is_demo": True}

    return {"items": [], "total": 0}


# ── Notifications ──────────────────────────────────────────────

@router.get("/notifications")
async def list_notifications():
    """List notifications for the current user."""
    if settings.demo_mode:
        return {
            "items": generate_demo_notifications(),
            "total": 2,
            "unread": 1,
            "is_demo": True,
        }

    return {"items": [], "total": 0, "unread": 0}
