"""Reports and complaints API routes."""

from fastapi import APIRouter, HTTPException, Query, status
from typing import Optional
from datetime import datetime, timezone
from uuid import uuid4
from pydantic import BaseModel, Field
from app.core.config import settings
from app.schemas.schemas import (
    ReportResponse, ReportUpdateRequest, ComplaintCreate, ComplaintResponse,
)
from app.services.demo_data import generate_demo_reports, generate_demo_complaints
from app.services.ai_report_service import generate_ai_report_narrative

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


@router.post("/reports/generate-ai-narrative")
async def create_ai_narrative(payload: AINarrativeRequest):
    """Generate court-admissible legal narrative and compliance analysis via Groq AI."""
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



# ── Reports ────────────────────────────────────────────────────

@router.get("/reports")
async def list_reports(
    status_filter: Optional[str] = Query(None, alias="status"),
    incident_id: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    """List generated reports with filtering."""
    if settings.demo_mode:
        reports = generate_demo_reports()
        if status_filter:
            reports = [r for r in reports if r["status"] == status_filter]
        if incident_id:
            reports = [r for r in reports if r["incident_id"] == incident_id]
        return {
            "items": reports,
            "total": len(reports),
            "page": page,
            "is_demo": True,
        }

    return {"items": [], "total": 0}


@router.get("/reports/{report_id}")
async def get_report(report_id: str):
    """Get a specific report with full details."""
    if settings.demo_mode:
        reports = generate_demo_reports()
        for rpt in reports:
            if rpt["id"] == report_id:
                return rpt
        raise HTTPException(status_code=404, detail="Report not found")

    raise HTTPException(status_code=501, detail="Database not configured")


@router.put("/reports/{report_id}")
async def update_report(report_id: str, update: ReportUpdateRequest):
    """Update report narrative or status.

    Users may edit narrative fields without modifying the original sensor record.
    """
    if settings.demo_mode:
        return {
            "id": report_id,
            "status": update.status or "draft",
            "narrative": update.narrative,
            "limitations": update.limitations,
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "message": "[DEMO] Report updated (simulated)",
            "is_demo": True,
        }

    raise HTTPException(status_code=501, detail="Database not configured")


@router.get("/reports/{report_id}/download")
async def download_report(report_id: str):
    """Download a generated PDF report using ReportLab.
    
    Returns an official, publication-quality compliance PDF document.
    """
    from fastapi.responses import StreamingResponse
    from app.services.pdf_generator import generate_incident_pdf
    from app.services.demo_data import generate_demo_incidents, DEMO_LOCATIONS

    reports = generate_demo_reports()
    report = next((r for r in reports if r["id"] == report_id), None)
    if not report:
        report = {
            "id": report_id,
            "version": "1.0",
            "status": "reviewed",
            "title": f"Incident Compliance Assessment — {report_id}",
            "generated_at": datetime.now(timezone.utc).isoformat(),
        }

    incidents = generate_demo_incidents()
    incident = next((i for i in incidents if i["id"] == report.get("incident_id")), incidents[0] if incidents else {})
    location = next((l for l in DEMO_LOCATIONS if l["id"] == incident.get("location_id")), DEMO_LOCATIONS[0] if DEMO_LOCATIONS else {})

    try:
        pdf_buffer = generate_incident_pdf(report, incident, location)
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
async def create_complaint(complaint: ComplaintCreate):
    """Create a complaint draft linked to an incident and optional report.

    The complaint is created in 'draft' status and requires explicit
    approval before submission.
    """
    if settings.demo_mode:
        return {
            "id": str(uuid4()),
            "incident_id": complaint.incident_id,
            "report_id": complaint.report_id,
            "destination_authority": complaint.destination_authority,
            "submission_method": complaint.submission_method,
            "status": "draft",
            "submitted_at": None,
            "error_summary": None,
            "retry_count": 0,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "message": "[DEMO] Complaint draft created. In production, this would be stored and require approval before submission.",
            "is_demo": True,
        }

    raise HTTPException(status_code=501, detail="Database not configured")


@router.get("/complaints")
async def list_complaints(
    status_filter: Optional[str] = Query(None, alias="status"),
    page: int = Query(1, ge=1),
):
    """List complaint submissions."""
    if settings.demo_mode:
        complaints = generate_demo_complaints()
        if status_filter:
            complaints = [c for c in complaints if c["status"] == status_filter]
        return {
            "items": complaints,
            "total": len(complaints),
            "is_demo": True,
        }

    return {"items": [], "total": 0}


@router.get("/complaints/{complaint_id}")
async def get_complaint(complaint_id: str):
    """Get complaint details including submission status."""
    if settings.demo_mode:
        complaints = generate_demo_complaints()
        for cmp in complaints:
            if cmp["id"] == complaint_id:
                return cmp
        raise HTTPException(status_code=404, detail="Complaint not found")

    raise HTTPException(status_code=501, detail="Database not configured")


@router.post("/complaints/{complaint_id}/submit")
async def submit_complaint(complaint_id: str):
    """Submit a complaint to the destination authority.

    IMPORTANT: This does NOT bypass any CAPTCHA, OTP, or access controls.
    If no official API is configured, provides download guidance instead.
    """
    if settings.demo_mode:
        return {
            "complaint_id": complaint_id,
            "status": "draft",
            "message": (
                "[DEMO] No official complaint API is configured. "
                "In production, download the PDF report and submit through "
                "the appropriate official channel for your jurisdiction. "
                "NoiseWatch does not auto-submit complaints without explicit "
                "authorization and API integration."
            ),
            "download_available": True,
            "is_demo": True,
        }

    # Production: Check for configured complaint integration
    return {
        "complaint_id": complaint_id,
        "status": "pending",
        "message": "Complaint submission queued. Check back for status updates.",
    }
