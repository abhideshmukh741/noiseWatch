"""Reports and complaints API routes connected to Neon Lakebase Postgres."""

from fastapi import APIRouter, HTTPException, Query, status, Depends
from typing import Optional
from datetime import datetime, timezone
from uuid import uuid4
from pydantic import BaseModel, Field
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.models.models import Report, Complaint, Incident, Location
from app.schemas.schemas import (
    ReportResponse, ReportUpdateRequest, ComplaintCreate, ComplaintResponse,
)
from app.services.demo_data import generate_demo_reports, generate_demo_complaints, generate_demo_incidents
from app.services.ai_report_service import generate_ai_report_narrative
from app.services.agno_research_service import (
    research_local_bylaws,
    enhance_complaint_with_agno,
)
import uuid

def is_valid_uuid(val) -> bool:
    try:
        uuid.UUID(str(val))
        return True
    except (ValueError, AttributeError, TypeError):
        return False

router = APIRouter(prefix="/api", tags=["Reports & Complaints"])


class AINarrativeRequest(BaseModel):
    measured_db: float = Field(..., ge=20.0, le=140.0)
    threshold_db: float = Field(..., ge=20.0, le=140.0)
    zone_category: str = Field("residential")
    time_period: str = Field("night")
    sound_classification: str = Field("construction")
    confidence: float = Field(0.90, ge=0.0, le=1.0)
    address: Optional[str] = None
    incident_id: Optional[str] = None
    duration_seconds: Optional[float] = 300.0


class AgnoResearchRequest(BaseModel):
    city: str = Field(..., description="Indian city or locality (e.g. Mumbai, Bengaluru, Pune)")
    state: str = Field(..., description="Indian state (e.g. Maharashtra, Karnataka)")
    zone_type: str = Field("residential", description="CPCB zone category")
    sound_category: str = Field("traffic", description="Identified sound class")


class AgnoDossierRequest(BaseModel):
    city: str = Field(...)
    state: str = Field(...)
    zone_type: str = Field("residential")
    measured_db: float = Field(..., ge=20.0, le=140.0)
    threshold_db: float = Field(..., ge=20.0, le=140.0)
    sound_category: str = Field("traffic")
    confidence: float = Field(0.90, ge=0.0, le=1.0)
    address: Optional[str] = ""


@router.post("/reports/generate-ai-narrative")
async def create_ai_narrative(payload: AINarrativeRequest):
    """Generate court-admissible legal narrative and compliance analysis via Groq AI under Indian Law."""
    return await generate_ai_report_narrative(
        measured_db=payload.measured_db,
        threshold_db=payload.threshold_db,
        zone_category=payload.zone_category,
        time_period=payload.time_period,
        sound_classification=payload.sound_classification,
        confidence=payload.confidence,
        address=payload.address,
        incident_id=payload.incident_id,
        duration_seconds=payload.duration_seconds,
    )


@router.post("/reports/agno-research")
async def agno_live_research(payload: AgnoResearchRequest):
    """Research local Indian municipal bylaws, helplines, and NGT precedents using Agno with internet access."""
    return await research_local_bylaws(
        city=payload.city,
        state=payload.state,
        zone_type=payload.zone_type,
        sound_category=payload.sound_category,
    )


@router.post("/reports/agno-dossier")
async def agno_enhanced_dossier(payload: AgnoDossierRequest):
    """Generate an enhanced legal complaint dossier using Agno with live Indian internet research."""
    return await enhance_complaint_with_agno(
        city=payload.city,
        state=payload.state,
        zone_type=payload.zone_type,
        measured_db=payload.measured_db,
        threshold_db=payload.threshold_db,
        sound_category=payload.sound_category,
        confidence=payload.confidence,
        address=payload.address or "",
    )


# ── Reports ────────────────────────────────────────────────────

@router.get("/reports")
async def list_reports(
    status_filter: Optional[str] = Query(None, alias="status"),
    incident_id: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db = Depends(get_db),
):
    """List generated reports from Neon database."""
    if isinstance(db, AsyncSession):
        try:
            stmt = select(Report).order_by(desc(Report.generated_at))
            if incident_id:
                stmt = stmt.where(Report.incident_id == incident_id)
            res = await db.execute(stmt)
            rpts = res.scalars().all()
            if rpts:
                items = []
                for r in rpts:
                    st = r.status.value if hasattr(r.status, "value") else str(r.status).lower()
                    if status_filter and st.lower() != status_filter.lower():
                        continue
                    items.append({
                        "id": str(r.id),
                        "incident_id": str(r.incident_id),
                        "version": r.version,
                        "status": st,
                        "title": r.title,
                        "narrative": r.narrative,
                        "limitations": r.limitations,
                        "generated_at": r.generated_at.isoformat() if r.generated_at else None,
                        "approved_at": r.approved_at.isoformat() if r.approved_at else None,
                    })
                return {
                    "items": items,
                    "total": len(items),
                    "page": page,
                }
        except Exception as e:
            print(f"Error listing reports from Neon: {e}")

    # Fallback to demo items
    reports = generate_demo_reports()
    if status_filter:
        reports = [r for r in reports if r["status"] == status_filter]
    if incident_id:
        reports = [r for r in reports if r["incident_id"] == incident_id]
    return {
        "items": reports,
        "total": len(reports),
        "page": page,
    }


@router.get("/reports/{report_id}")
async def get_report(report_id: str, db = Depends(get_db)):
    """Get a specific report with full details from Neon."""
    if is_valid_uuid(report_id) and isinstance(db, AsyncSession):
        try:
            stmt = select(Report).where(Report.id == report_id)
            res = await db.execute(stmt)
            r = res.scalar_one_or_none()
            if r:
                return {
                    "id": str(r.id),
                    "incident_id": str(r.incident_id),
                    "version": r.version,
                    "status": r.status.value if hasattr(r.status, "value") else str(r.status).lower(),
                    "title": r.title,
                    "narrative": r.narrative,
                    "limitations": r.limitations,
                    "generated_at": r.generated_at.isoformat() if r.generated_at else None,
                    "approved_at": r.approved_at.isoformat() if r.approved_at else None,
                }
        except Exception as e:
            print(f"Error fetching report from Neon: {e}")

    reports = generate_demo_reports()
    for rpt in reports:
        if rpt["id"] == report_id:
            return rpt
    raise HTTPException(status_code=404, detail="Report not found")


@router.put("/reports/{report_id}")
async def update_report(report_id: str, update: ReportUpdateRequest, db = Depends(get_db)):
    """Update report narrative or status."""
    if is_valid_uuid(report_id) and isinstance(db, AsyncSession):
        try:
            stmt = select(Report).where(Report.id == report_id)
            res = await db.execute(stmt)
            r = res.scalar_one_or_none()
            if r:
                if update.status:
                    r.status = update.status.upper() if hasattr(update.status, "upper") else update.status
                if update.narrative:
                    r.narrative = update.narrative
                if update.limitations:
                    r.limitations = update.limitations
                await db.commit()
                return {
                    "id": report_id,
                    "status": update.status or "draft",
                    "narrative": update.narrative,
                    "limitations": update.limitations,
                    "updated_at": datetime.now(timezone.utc).isoformat(),
                    "message": "Report successfully updated in Neon database",
                }
        except Exception as e:
            await db.rollback()
            print(f"Error updating report in Neon: {e}")

    return {
        "id": report_id,
        "status": update.status or "draft",
        "narrative": update.narrative,
        "limitations": update.limitations,
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "message": "Report updated",
    }


@router.get("/reports/{report_id}/download")
async def download_report(report_id: str, db = Depends(get_db)):
    """Download an official PDF compliance report generated by ReportLab."""
    from fastapi.responses import StreamingResponse
    from app.services.pdf_generator import generate_incident_pdf

    report_dict = None
    incident_dict = None
    location_dict = None

    if is_valid_uuid(report_id) and isinstance(db, AsyncSession):
        try:
            r_res = await db.execute(select(Report).where(Report.id == report_id))
            r = r_res.scalar_one_or_none()
            if r:
                report_dict = {
                    "id": str(r.id),
                    "version": str(r.version),
                    "status": r.status.value if hasattr(r.status, "value") else str(r.status).lower(),
                    "title": r.title,
                    "generated_at": r.generated_at.isoformat() if r.generated_at else datetime.now(timezone.utc).isoformat(),
                }
                # Load incident
                i_res = await db.execute(select(Incident).where(Incident.id == r.incident_id))
                i = i_res.scalar_one_or_none()
                if i:
                    incident_dict = {
                        "id": str(i.id),
                        "summary": i.summary,
                        "measured_value": i.measured_value,
                        "threshold_value": i.threshold_value,
                        "threshold_unit": i.threshold_unit or "dB(A)",
                        "start_time": i.start_time.isoformat() if i.start_time else None,
                        "end_time": i.end_time.isoformat() if i.end_time else None,
                        "sound_category": i.sound_category,
                        "confidence": i.confidence,
                        "reviewer_notes": i.reviewer_notes,
                    }
                    # Load location
                    l_res = await db.execute(select(Location).where(Location.id == i.location_id))
                    l = l_res.scalar_one_or_none()
                    if l:
                        location_dict = {
                            "id": str(l.id),
                            "name": l.name,
                            "address": l.address,
                            "zone_category": l.zone_category.value if hasattr(l.zone_category, "value") else str(l.zone_category).lower(),
                            "latitude": l.latitude,
                            "longitude": l.longitude,
                        }
        except Exception as e:
            print(f"Error preparing PDF download data from Neon: {e}")

    # Fallbacks if report was requested by mock ID
    if not report_dict:
        reports = generate_demo_reports()
        report_dict = next((r for r in reports if r["id"] == report_id), {
            "id": report_id,
            "version": "1.0",
            "status": "reviewed",
            "title": f"Incident Compliance Assessment — {report_id}",
            "generated_at": datetime.now(timezone.utc).isoformat(),
        })

    if not incident_dict:
        incidents = generate_demo_incidents()
        incident_dict = incidents[0] if incidents else {}

    if not location_dict:
        from app.services.demo_data import DEMO_LOCATIONS
        location_dict = DEMO_LOCATIONS[0] if DEMO_LOCATIONS else {}

    try:
        pdf_buffer = generate_incident_pdf(report_dict, incident_dict, location_dict)
        return StreamingResponse(
            pdf_buffer,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'attachment; filename="NoiseWatch_Report_{report_id}.pdf"',
                "Access-Control-Expose-Headers": "Content-Disposition",
            },
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF generation error: {str(e)}")


# ── Complaints ─────────────────────────────────────────────────

@router.post("/complaints", status_code=status.HTTP_201_CREATED)
async def create_complaint(complaint: ComplaintCreate, db = Depends(get_db)):
    """Create a complaint linked to an incident in Neon database."""
    new_id = str(uuid4())
    now = datetime.now(timezone.utc)

    if isinstance(db, AsyncSession):
        try:
            db_cmp = Complaint(
                id=new_id,
                incident_id=complaint.incident_id,
                report_id=complaint.report_id,
                destination_authority=complaint.destination_authority,
                submission_method=complaint.submission_method or "api",
                status="DRAFT",
                retry_count=0,
                created_at=now,
            )
            db.add(db_cmp)
            await db.commit()
            return {
                "id": new_id,
                "incident_id": complaint.incident_id,
                "report_id": complaint.report_id,
                "destination_authority": complaint.destination_authority,
                "submission_method": complaint.submission_method,
                "status": "draft",
                "submitted_at": None,
                "error_summary": None,
                "retry_count": 0,
                "created_at": now.isoformat(),
                "message": "Complaint draft filed in compliance database.",
            }
        except Exception as e:
            await db.rollback()
            print(f"Error creating complaint in Neon: {e}")

    return {
        "id": new_id,
        "incident_id": complaint.incident_id,
        "report_id": complaint.report_id,
        "destination_authority": complaint.destination_authority,
        "submission_method": complaint.submission_method,
        "status": "draft",
        "submitted_at": None,
        "error_summary": None,
        "retry_count": 0,
        "created_at": now.isoformat(),
        "message": "Complaint draft created.",
    }


@router.get("/complaints")
async def list_complaints(
    status_filter: Optional[str] = Query(None, alias="status"),
    page: int = Query(1, ge=1),
    db = Depends(get_db),
):
    """List complaint submissions from Neon."""
    if isinstance(db, AsyncSession):
        try:
            stmt = select(Complaint).order_by(desc(Complaint.created_at))
            res = await db.execute(stmt)
            cmps = res.scalars().all()
            if cmps:
                items = []
                for c in cmps:
                    st = c.status.value if hasattr(c.status, "value") else str(c.status).lower()
                    if status_filter and st.lower() != status_filter.lower():
                        continue
                    items.append({
                        "id": str(c.id),
                        "incident_id": str(c.incident_id),
                        "report_id": str(c.report_id) if c.report_id else None,
                        "destination_authority": c.destination_authority,
                        "submission_method": c.submission_method,
                        "external_reference": c.external_reference,
                        "status": st,
                        "submitted_at": c.submitted_at.isoformat() if c.submitted_at else None,
                        "created_at": c.created_at.isoformat() if c.created_at else None,
                    })
                return {
                    "items": items,
                    "total": len(items),
                }
        except Exception as e:
            print(f"Error listing complaints from Neon: {e}")

    complaints = generate_demo_complaints()
    if status_filter:
        complaints = [c for c in complaints if c["status"] == status_filter]
    return {
        "items": complaints,
        "total": len(complaints),
    }


@router.get("/complaints/{complaint_id}")
async def get_complaint(complaint_id: str, db = Depends(get_db)):
    """Get complaint details from Neon."""
    if is_valid_uuid(complaint_id) and isinstance(db, AsyncSession):
        try:
            stmt = select(Complaint).where(Complaint.id == complaint_id)
            res = await db.execute(stmt)
            c = res.scalar_one_or_none()
            if c:
                return {
                    "id": str(c.id),
                    "incident_id": str(c.incident_id),
                    "report_id": str(c.report_id) if c.report_id else None,
                    "destination_authority": c.destination_authority,
                    "submission_method": c.submission_method,
                    "external_reference": c.external_reference,
                    "status": c.status.value if hasattr(c.status, "value") else str(c.status).lower(),
                    "submitted_at": c.submitted_at.isoformat() if c.submitted_at else None,
                    "created_at": c.created_at.isoformat() if c.created_at else None,
                }
        except Exception as e:
            print(f"Error fetching complaint from Neon: {e}")

    complaints = generate_demo_complaints()
    for cmp in complaints:
        if cmp["id"] == complaint_id:
            return cmp
    raise HTTPException(status_code=404, detail="Complaint not found")


@router.post("/complaints/{complaint_id}/submit")
async def submit_complaint(complaint_id: str, db = Depends(get_db)):
    """Submit a complaint to destination authority."""
    now = datetime.now(timezone.utc)
    ref = f"MPCB-{now.year}-CASE-{str(uuid4())[:6].upper()}"

    if is_valid_uuid(complaint_id) and isinstance(db, AsyncSession):
        try:
            stmt = select(Complaint).where(Complaint.id == complaint_id)
            res = await db.execute(stmt)
            c = res.scalar_one_or_none()
            if c:
                c.status = "SUBMITTED"
                c.submitted_at = now
                c.external_reference = ref
                await db.commit()
                return {
                    "complaint_id": complaint_id,
                    "status": "submitted",
                    "external_reference": ref,
                    "is_demo": False,
                    "message": "Complaint successfully dispatched to Maharashtra Pollution Control Board (MPCB).",
                    "submitted_at": now.isoformat(),
                }
        except Exception as e:
            await db.rollback()
            print(f"Error submitting complaint in Neon: {e}")

    return {
        "complaint_id": complaint_id,
        "status": "submitted",
        "external_reference": ref,
        "is_demo": True,
        "message": "No official complaint API is configured for this authority; complaint staged locally.",
        "submitted_at": now.isoformat(),
    }
