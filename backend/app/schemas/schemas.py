"""Pydantic schemas for request/response validation."""

from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, EmailStr
from enum import Enum


# ── Enums (mirror DB enums for API contracts) ──────────────────

class UserRoleEnum(str, Enum):
    USER = "user"
    REVIEWER = "reviewer"
    ADMIN = "admin"

class DeviceTypeEnum(str, Enum):
    BROWSER_MIC = "browser_microphone"
    CALIBRATED_METER = "calibrated_meter"
    IOT_SENSOR = "iot_sensor"
    EXTERNAL_API = "external_api"

class MeasurementMethodEnum(str, Enum):
    UNCALIBRATED_ESTIMATE = "uncalibrated_estimate"
    CALIBRATED_MEASUREMENT = "calibrated_measurement"
    SIMULATED_DEMO = "simulated_demo"
    EXTERNAL_IMPORT = "external_import"

class IncidentStatusEnum(str, Enum):
    NORMAL = "normal"
    POTENTIAL_EXCEEDANCE = "potential_exceedance"
    UNDER_REVIEW = "under_review"
    VERIFIED = "verified"
    DISMISSED = "dismissed"
    REPORT_GENERATED = "report_generated"
    SUBMITTED = "submitted"
    RESOLVED = "resolved"

class SeverityEnum(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class ZoneCategoryEnum(str, Enum):
    RESIDENTIAL = "residential"
    COMMERCIAL = "commercial"
    INDUSTRIAL = "industrial"
    SILENCE = "silence_zone"
    MIXED = "mixed_use"

class ReportStatusEnum(str, Enum):
    DRAFT = "draft"
    PENDING_REVIEW = "pending_review"
    APPROVED = "approved"
    REJECTED = "rejected"
    SUBMITTED = "submitted"

class ComplaintStatusEnum(str, Enum):
    DRAFT = "draft"
    PENDING = "pending"
    SUBMITTED = "submitted"
    ACKNOWLEDGED = "acknowledged"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    FAILED = "failed"


# ── Auth Schemas ───────────────────────────────────────────────

class LoginRequest(BaseModel):
    email: str = Field(..., max_length=255)
    password: str = Field(..., min_length=6)

class RegisterRequest(BaseModel):
    email: str = Field(..., max_length=255)
    password: str = Field(..., min_length=8)
    display_name: str = Field(..., min_length=2, max_length=100)

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    role: str
    display_name: str

class UserProfile(BaseModel):
    id: str
    email: str
    display_name: str
    role: UserRoleEnum
    avatar_url: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ── Location Schemas ───────────────────────────────────────────

class LocationCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=200)
    description: Optional[str] = None
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    zone_category: ZoneCategoryEnum = ZoneCategoryEnum.RESIDENTIAL
    address: Optional[str] = None

class LocationResponse(BaseModel):
    id: str
    name: str
    description: Optional[str]
    latitude: float
    longitude: float
    zone_category: ZoneCategoryEnum
    address: Optional[str]
    is_active: bool
    created_by: str
    created_at: datetime

    class Config:
        from_attributes = True

class LocationWithStats(LocationResponse):
    device_count: int = 0
    recent_reading: Optional[float] = None
    active_incidents: int = 0


# ── Device Schemas ─────────────────────────────────────────────

class DeviceResponse(BaseModel):
    id: str
    location_id: str
    name: str
    device_type: DeviceTypeEnum
    model_info: Optional[str]
    calibration_status: str
    calibration_date: Optional[datetime]
    calibration_expiry: Optional[datetime]
    is_online: bool
    last_seen_at: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True


# ── Sound Reading Schemas ──────────────────────────────────────

class SoundReadingCreate(BaseModel):
    device_id: str
    location_id: str
    timestamp: datetime
    metric_name: str = Field(..., max_length=50)
    value: float
    unit: str = Field(..., max_length=20)
    measurement_method: MeasurementMethodEnum
    quality_status: str = "unknown"
    duration_seconds: Optional[float] = None
    metadata: Optional[dict] = None

class SoundReadingResponse(BaseModel):
    id: str
    device_id: str
    location_id: str
    timestamp: datetime
    metric_name: str
    value: float
    unit: str
    measurement_method: MeasurementMethodEnum
    quality_status: str
    duration_seconds: Optional[float]
    created_at: datetime

    class Config:
        from_attributes = True


# ── Incident Schemas ───────────────────────────────────────────

class IncidentResponse(BaseModel):
    id: str
    location_id: str
    start_time: datetime
    end_time: Optional[datetime]
    status: IncidentStatusEnum
    severity: SeverityEnum
    rule_version: Optional[str]
    threshold_value: Optional[float]
    threshold_unit: Optional[str]
    measured_value: Optional[float]
    measurement_method: Optional[MeasurementMethodEnum]
    confidence: Optional[float]
    sound_category: Optional[str]
    summary: Optional[str]
    reviewer_notes: Optional[str]
    reviewed_by: Optional[str]
    reviewed_at: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True

class IncidentDetail(IncidentResponse):
    location: Optional[LocationResponse] = None
    evidence_files: List[dict] = []
    reports: List[dict] = []

class IncidentReviewRequest(BaseModel):
    status: IncidentStatusEnum
    reviewer_notes: Optional[str] = None


# ── Report Schemas ─────────────────────────────────────────────

class ReportResponse(BaseModel):
    id: str
    incident_id: str
    version: int
    status: ReportStatusEnum
    title: Optional[str]
    narrative: Optional[str]
    limitations: Optional[str]
    storage_path: Optional[str]
    generated_at: datetime
    approved_at: Optional[datetime]

    class Config:
        from_attributes = True

class ReportUpdateRequest(BaseModel):
    narrative: Optional[str] = None
    limitations: Optional[str] = None
    status: Optional[ReportStatusEnum] = None


# ── Complaint Schemas ──────────────────────────────────────────

class ComplaintCreate(BaseModel):
    incident_id: str
    report_id: Optional[str] = None
    destination_authority: Optional[str] = None
    submission_method: str = "manual_download"

class ComplaintResponse(BaseModel):
    id: str
    incident_id: str
    report_id: Optional[str]
    destination_authority: Optional[str]
    submission_method: Optional[str]
    external_reference: Optional[str]
    status: ComplaintStatusEnum
    submitted_at: Optional[datetime]
    last_checked_at: Optional[datetime]
    error_summary: Optional[str]
    retry_count: int
    created_at: datetime

    class Config:
        from_attributes = True


# ── Dashboard Schemas ──────────────────────────────────────────

class DashboardSummary(BaseModel):
    total_locations: int = 0
    active_devices: int = 0
    total_readings_today: int = 0
    active_incidents: int = 0
    pending_reports: int = 0
    latest_reading: Optional[dict] = None
    recent_incidents: List[dict] = []
    hourly_averages: List[dict] = []
    is_demo_mode: bool = False


# ── Pagination ─────────────────────────────────────────────────

class PaginatedResponse(BaseModel):
    items: List[dict] = []
    total: int = 0
    page: int = 1
    page_size: int = 20
    total_pages: int = 0


# ── Notification Schemas ───────────────────────────────────────

class NotificationResponse(BaseModel):
    id: str
    title: str
    message: str
    channel: str
    status: str
    created_at: datetime
    read_at: Optional[datetime]

    class Config:
        from_attributes = True
