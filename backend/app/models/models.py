"""SQLAlchemy ORM models for NoiseWatch database."""

import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Float, Integer, Boolean, DateTime, Text,
    ForeignKey, Index, Enum as SQLEnum, JSON, CheckConstraint
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base
import enum


def utcnow():
    return datetime.now(timezone.utc)


def gen_uuid():
    return str(uuid.uuid4())


# ── Enums ──────────────────────────────────────────────────────

class UserRole(str, enum.Enum):
    USER = "user"
    REVIEWER = "reviewer"
    ADMIN = "admin"


class DeviceType(str, enum.Enum):
    BROWSER_MIC = "browser_microphone"
    CALIBRATED_METER = "calibrated_meter"
    IOT_SENSOR = "iot_sensor"
    EXTERNAL_API = "external_api"


class CalibrationStatus(str, enum.Enum):
    NOT_CALIBRATED = "not_calibrated"
    CALIBRATED = "calibrated"
    EXPIRED = "expired"
    UNKNOWN = "unknown"


class MeasurementMethod(str, enum.Enum):
    UNCALIBRATED_ESTIMATE = "uncalibrated_estimate"
    CALIBRATED_MEASUREMENT = "calibrated_measurement"
    SIMULATED_DEMO = "simulated_demo"
    EXTERNAL_IMPORT = "external_import"


class QualityStatus(str, enum.Enum):
    GOOD = "good"
    DEGRADED = "degraded"
    POOR = "poor"
    UNKNOWN = "unknown"


class IncidentStatus(str, enum.Enum):
    NORMAL = "normal"
    POTENTIAL_EXCEEDANCE = "potential_exceedance"
    UNDER_REVIEW = "under_review"
    VERIFIED = "verified"
    DISMISSED = "dismissed"
    REPORT_GENERATED = "report_generated"
    SUBMITTED = "submitted"
    RESOLVED = "resolved"


class Severity(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class ReportStatus(str, enum.Enum):
    DRAFT = "draft"
    PENDING_REVIEW = "pending_review"
    APPROVED = "approved"
    REJECTED = "rejected"
    SUBMITTED = "submitted"


class ComplaintStatus(str, enum.Enum):
    DRAFT = "draft"
    PENDING = "pending"
    SUBMITTED = "submitted"
    ACKNOWLEDGED = "acknowledged"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    FAILED = "failed"


class NotificationChannel(str, enum.Enum):
    IN_APP = "in_app"
    EMAIL = "email"


class NotificationStatus(str, enum.Enum):
    PENDING = "pending"
    DELIVERED = "delivered"
    FAILED = "failed"
    READ = "read"


class ZoneCategory(str, enum.Enum):
    RESIDENTIAL = "residential"
    COMMERCIAL = "commercial"
    INDUSTRIAL = "industrial"
    SILENCE = "silence_zone"
    MIXED = "mixed_use"


# ── Models ─────────────────────────────────────────────────────

class Profile(Base):
    __tablename__ = "profiles"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    email = Column(String(255), unique=True, nullable=False, index=True)
    display_name = Column(String(100), nullable=False)
    role = Column(SQLEnum(UserRole), default=UserRole.USER, nullable=False)
    avatar_url = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    # Relationships
    locations = relationship("Location", back_populates="created_by_user")
    notifications = relationship("Notification", back_populates="user")
    audit_logs = relationship("AuditLog", back_populates="actor")


class Location(Base):
    __tablename__ = "locations"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    zone_category = Column(SQLEnum(ZoneCategory), default=ZoneCategory.RESIDENTIAL, nullable=False)
    address = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_by = Column(UUID(as_uuid=False), ForeignKey("profiles.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    # Relationships
    created_by_user = relationship("Profile", back_populates="locations")
    devices = relationship("Device", back_populates="location")
    readings = relationship("SoundReading", back_populates="location")
    incidents = relationship("Incident", back_populates="location")

    __table_args__ = (
        CheckConstraint("latitude >= -90 AND latitude <= 90", name="ck_latitude_range"),
        CheckConstraint("longitude >= -180 AND longitude <= 180", name="ck_longitude_range"),
    )


class Device(Base):
    __tablename__ = "devices"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    location_id = Column(UUID(as_uuid=False), ForeignKey("locations.id"), nullable=False)
    name = Column(String(200), nullable=False)
    device_type = Column(SQLEnum(DeviceType), nullable=False)
    model_info = Column(String(200), nullable=True)
    serial_number = Column(String(100), nullable=True)
    calibration_status = Column(
        SQLEnum(CalibrationStatus), default=CalibrationStatus.NOT_CALIBRATED, nullable=False
    )
    calibration_date = Column(DateTime(timezone=True), nullable=True)
    calibration_expiry = Column(DateTime(timezone=True), nullable=True)
    is_online = Column(Boolean, default=False, nullable=False)
    last_seen_at = Column(DateTime(timezone=True), nullable=True)
    metadata_ = Column("metadata", JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    # Relationships
    location = relationship("Location", back_populates="devices")
    readings = relationship("SoundReading", back_populates="device")


class SoundReading(Base):
    __tablename__ = "sound_readings"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    device_id = Column(UUID(as_uuid=False), ForeignKey("devices.id"), nullable=False)
    location_id = Column(UUID(as_uuid=False), ForeignKey("locations.id"), nullable=False)
    timestamp = Column(DateTime(timezone=True), nullable=False, index=True)
    metric_name = Column(String(50), nullable=False)  # e.g., "LAeq", "LCpeak", "relative_intensity"
    value = Column(Float, nullable=False)
    unit = Column(String(20), nullable=False)  # e.g., "dB(A)", "relative", "dB(C)"
    measurement_method = Column(SQLEnum(MeasurementMethod), nullable=False)
    quality_status = Column(SQLEnum(QualityStatus), default=QualityStatus.UNKNOWN, nullable=False)
    duration_seconds = Column(Float, nullable=True)
    metadata_ = Column("metadata", JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    # Relationships
    device = relationship("Device", back_populates="readings")
    location = relationship("Location", back_populates="readings")

    __table_args__ = (
        Index("ix_readings_location_time", "location_id", "timestamp"),
        Index("ix_readings_device_time", "device_id", "timestamp"),
    )


class Incident(Base):
    __tablename__ = "incidents"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    location_id = Column(UUID(as_uuid=False), ForeignKey("locations.id"), nullable=False)
    start_time = Column(DateTime(timezone=True), nullable=False)
    end_time = Column(DateTime(timezone=True), nullable=True)
    status = Column(
        SQLEnum(IncidentStatus), default=IncidentStatus.POTENTIAL_EXCEEDANCE, nullable=False
    )
    severity = Column(SQLEnum(Severity), default=Severity.LOW, nullable=False)
    rule_version = Column(String(50), nullable=True)
    threshold_value = Column(Float, nullable=True)
    threshold_unit = Column(String(20), nullable=True)
    measured_value = Column(Float, nullable=True)
    measurement_method = Column(SQLEnum(MeasurementMethod), nullable=True)
    confidence = Column(Float, nullable=True)
    sound_category = Column(String(100), nullable=True)  # ML classification
    summary = Column(Text, nullable=True)
    reviewer_notes = Column(Text, nullable=True)
    reviewed_by = Column(UUID(as_uuid=False), ForeignKey("profiles.id"), nullable=True)
    reviewed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    # Relationships
    location = relationship("Location", back_populates="incidents")
    evidence_files = relationship("EvidenceFile", back_populates="incident")
    reports = relationship("Report", back_populates="incident")
    complaints = relationship("Complaint", back_populates="incident")

    __table_args__ = (
        Index("ix_incidents_location_status", "location_id", "status"),
        Index("ix_incidents_start_time", "start_time"),
    )


class EvidenceFile(Base):
    __tablename__ = "evidence_files"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    incident_id = Column(UUID(as_uuid=False), ForeignKey("incidents.id"), nullable=False)
    storage_path = Column(String(500), nullable=False)
    file_type = Column(String(50), nullable=False)  # e.g., "audio/wav", "image/png"
    file_size_bytes = Column(Integer, nullable=True)
    checksum = Column(String(128), nullable=True)
    description = Column(Text, nullable=True)
    metadata_ = Column("metadata", JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    # Relationships
    incident = relationship("Incident", back_populates="evidence_files")


class Report(Base):
    __tablename__ = "reports"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    incident_id = Column(UUID(as_uuid=False), ForeignKey("incidents.id"), nullable=False)
    version = Column(Integer, default=1, nullable=False)
    status = Column(SQLEnum(ReportStatus), default=ReportStatus.DRAFT, nullable=False)
    title = Column(String(300), nullable=True)
    narrative = Column(Text, nullable=True)
    limitations = Column(Text, nullable=True)
    generated_by = Column(UUID(as_uuid=False), ForeignKey("profiles.id"), nullable=True)
    approved_by = Column(UUID(as_uuid=False), ForeignKey("profiles.id"), nullable=True)
    storage_path = Column(String(500), nullable=True)
    report_metadata = Column(JSON, nullable=True)
    generated_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    approved_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    incident = relationship("Incident", back_populates="reports")
    complaints = relationship("Complaint", back_populates="report")


class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    incident_id = Column(UUID(as_uuid=False), ForeignKey("incidents.id"), nullable=False)
    report_id = Column(UUID(as_uuid=False), ForeignKey("reports.id"), nullable=True)
    destination_authority = Column(String(300), nullable=True)
    submission_method = Column(String(100), nullable=True)  # "api", "email", "manual_download"
    external_reference = Column(String(200), nullable=True)
    status = Column(SQLEnum(ComplaintStatus), default=ComplaintStatus.DRAFT, nullable=False)
    submitted_at = Column(DateTime(timezone=True), nullable=True)
    last_checked_at = Column(DateTime(timezone=True), nullable=True)
    error_summary = Column(Text, nullable=True)
    retry_count = Column(Integer, default=0, nullable=False)
    metadata_ = Column("metadata", JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    # Relationships
    incident = relationship("Incident", back_populates="complaints")
    report = relationship("Report", back_populates="complaints")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    user_id = Column(UUID(as_uuid=False), ForeignKey("profiles.id"), nullable=False)
    incident_id = Column(UUID(as_uuid=False), ForeignKey("incidents.id"), nullable=True)
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    channel = Column(SQLEnum(NotificationChannel), default=NotificationChannel.IN_APP, nullable=False)
    status = Column(SQLEnum(NotificationStatus), default=NotificationStatus.PENDING, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)
    delivered_at = Column(DateTime(timezone=True), nullable=True)
    read_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    user = relationship("Profile", back_populates="notifications")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    actor_id = Column(UUID(as_uuid=False), ForeignKey("profiles.id"), nullable=False)
    entity_type = Column(String(50), nullable=False)  # e.g., "incident", "report", "complaint"
    entity_id = Column(UUID(as_uuid=False), nullable=False)
    action = Column(String(100), nullable=False)  # e.g., "created", "reviewed", "approved"
    details = Column(JSON, nullable=True)
    timestamp = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    # Relationships
    actor = relationship("Profile", back_populates="audit_logs")

    __table_args__ = (
        Index("ix_audit_entity", "entity_type", "entity_id"),
        Index("ix_audit_actor_time", "actor_id", "timestamp"),
    )


class ThresholdConfig(Base):
    """Versioned noise threshold configurations per zone category."""
    __tablename__ = "threshold_configs"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    zone_category = Column(SQLEnum(ZoneCategory), nullable=False)
    time_period = Column(String(20), nullable=False)  # "day" or "night"
    day_start_hour = Column(Integer, default=6, nullable=False)
    day_end_hour = Column(Integer, default=22, nullable=False)
    threshold_value = Column(Float, nullable=False)
    threshold_unit = Column(String(20), default="dB(A)", nullable=False)
    min_duration_seconds = Column(Integer, default=0, nullable=False)
    regulatory_source = Column(String(300), nullable=True)
    version = Column(String(20), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utcnow, nullable=False)

    __table_args__ = (
        Index("ix_threshold_zone_period", "zone_category", "time_period", "is_active"),
    )
