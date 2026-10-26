-- =============================================================================
-- NoiseWatch — Comprehensive Supabase PostgreSQL Schema & Migrations
-- Version: 1.0.0
-- Description: Production schema with Row Level Security (RLS), constraints,
--              indexes, audit logging, and regulatory threshold support.
-- =============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- 1. PROFILES & ROLES
-- =============================================================================
CREATE TYPE user_role AS ENUM ('user', 'reviewer', 'admin');

CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name VARCHAR(100) NOT NULL,
    role user_role NOT NULL DEFAULT 'user',
    organization VARCHAR(150),
    phone_number VARCHAR(30),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- =============================================================================
-- 2. LOCATIONS (MONITORING SITES)
-- =============================================================================
CREATE TYPE zone_category AS ENUM ('residential', 'commercial', 'industrial', 'silent');

CREATE TABLE IF NOT EXISTS locations (
    id VARCHAR(64) PRIMARY KEY DEFAULT ('loc-' || substr(md5(random()::text), 1, 12)),
    name VARCHAR(150) NOT NULL,
    description TEXT,
    latitude DOUBLE PRECISION NOT NULL CHECK (latitude BETWEEN -90 AND 90),
    longitude DOUBLE PRECISION NOT NULL CHECK (longitude BETWEEN -180 AND 180),
    zone_category zone_category NOT NULL DEFAULT 'residential',
    day_threshold_dba NUMERIC(5, 2) NOT NULL DEFAULT 55.00,
    night_threshold_dba NUMERIC(5, 2) NOT NULL DEFAULT 45.00,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_public BOOLEAN NOT NULL DEFAULT TRUE,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- =============================================================================
-- 3. DEVICES (SENSORS & METERS)
-- =============================================================================
CREATE TYPE device_type AS ENUM ('calibrated_meter', 'iot_sensor', 'browser_mic', 'mobile_app');
CREATE TYPE calibration_status AS ENUM ('valid', 'expired', 'uncalibrated', 'pending');

CREATE TABLE IF NOT EXISTS devices (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    location_id VARCHAR(64) REFERENCES locations(id) ON DELETE SET NULL,
    device_type device_type NOT NULL DEFAULT 'browser_mic',
    model VARCHAR(100),
    serial_number VARCHAR(100),
    calibration_status calibration_status NOT NULL DEFAULT 'uncalibrated',
    calibration_certificate VARCHAR(150),
    calibration_date DATE,
    calibration_expiry DATE,
    is_online BOOLEAN NOT NULL DEFAULT TRUE,
    last_seen_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- =============================================================================
-- 4. SOUND READINGS (IMMUTABLE LOG)
-- =============================================================================
CREATE TYPE measurement_method AS ENUM (
    'calibrated_class1', 
    'calibrated_class2', 
    'iot_sensor_estimated', 
    'browser_microphone_uncalibrated', 
    'simulated_demo'
);
CREATE TYPE quality_status AS ENUM ('verified', 'uncalibrated', 'questionable', 'noisy', 'demo');

CREATE TABLE IF NOT EXISTS sound_readings (
    id BIGSERIAL PRIMARY KEY,
    device_id VARCHAR(64) REFERENCES devices(id) ON DELETE SET NULL,
    location_id VARCHAR(64) NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    metric_name VARCHAR(50) NOT NULL DEFAULT 'LAeq',
    value NUMERIC(6, 2) NOT NULL CHECK (value >= 0),
    unit VARCHAR(20) NOT NULL DEFAULT 'dB(A)',
    measurement_method measurement_method NOT NULL,
    quality_status quality_status NOT NULL DEFAULT 'uncalibrated',
    frequency_weighting VARCHAR(10) DEFAULT 'A',
    time_weighting VARCHAR(10) DEFAULT 'Fast',
    duration_seconds INT NOT NULL DEFAULT 1,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Readings hypertable partition / index optimization
CREATE INDEX IF NOT EXISTS idx_sound_readings_loc_ts 
    ON sound_readings (location_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_sound_readings_device 
    ON sound_readings (device_id, timestamp DESC);

-- =============================================================================
-- 5. INCIDENTS
-- =============================================================================
CREATE TYPE incident_status AS ENUM (
    'normal',
    'potential_exceedance',
    'under_review',
    'verified',
    'dismissed',
    'report_generated',
    'submitted',
    'resolved'
);
CREATE TYPE incident_severity AS ENUM ('low', 'medium', 'high', 'critical');

CREATE TABLE IF NOT EXISTS incidents (
    id VARCHAR(64) PRIMARY KEY DEFAULT ('inc-' || substr(md5(random()::text), 1, 12)),
    location_id VARCHAR(64) NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
    device_id VARCHAR(64) REFERENCES devices(id) ON DELETE SET NULL,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    status incident_status NOT NULL DEFAULT 'potential_exceedance',
    severity incident_severity NOT NULL DEFAULT 'medium',
    rule_version VARCHAR(20) NOT NULL DEFAULT 'v1.2.0',
    threshold_value NUMERIC(6, 2) NOT NULL,
    measured_value NUMERIC(6, 2) NOT NULL,
    peak_value NUMERIC(6, 2),
    duration_seconds INT NOT NULL,
    measurement_method measurement_method NOT NULL,
    confidence NUMERIC(4, 3) NOT NULL DEFAULT 0.850,
    sound_classification VARCHAR(100),
    summary TEXT NOT NULL,
    reviewer_notes TEXT,
    reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_incidents_status_time ON incidents(status, start_time DESC);
CREATE INDEX IF NOT EXISTS idx_incidents_location ON incidents(location_id);

-- =============================================================================
-- 6. EVIDENCE FILES
-- =============================================================================
CREATE TABLE IF NOT EXISTS evidence_files (
    id VARCHAR(64) PRIMARY KEY DEFAULT ('evid-' || substr(md5(random()::text), 1, 12)),
    incident_id VARCHAR(64) NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
    storage_path VARCHAR(255) NOT NULL,
    file_type VARCHAR(50) NOT NULL, -- 'audio/wav', 'image/png', 'application/json'
    file_size_bytes BIGINT,
    checksum VARCHAR(64) NOT NULL, -- SHA-256 for chain of custody
    is_encrypted BOOLEAN NOT NULL DEFAULT TRUE,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- =============================================================================
-- 7. REPORTS
-- =============================================================================
CREATE TYPE report_status AS ENUM ('draft', 'reviewed', 'approved', 'archived');

CREATE TABLE IF NOT EXISTS reports (
    id VARCHAR(64) PRIMARY KEY DEFAULT ('rpt-' || substr(md5(random()::text), 1, 12)),
    incident_id VARCHAR(64) NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
    version VARCHAR(20) NOT NULL DEFAULT '1.0',
    status report_status NOT NULL DEFAULT 'draft',
    title VARCHAR(200) NOT NULL,
    narrative TEXT,
    limitations TEXT,
    regulatory_reference VARCHAR(255),
    storage_path VARCHAR(255),
    generated_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    generated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    approved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    report_metadata JSONB DEFAULT '{}'::jsonb
);

-- =============================================================================
-- 8. COMPLAINTS
-- =============================================================================
CREATE TYPE complaint_status AS ENUM ('draft', 'pending', 'submitted', 'acknowledged', 'under_investigation', 'resolved', 'failed');
CREATE TYPE submission_method AS ENUM ('api_direct', 'email_dispatch', 'portal_upload', 'manual_export');

CREATE TABLE IF NOT EXISTS complaints (
    id VARCHAR(64) PRIMARY KEY DEFAULT ('cmp-' || substr(md5(random()::text), 1, 12)),
    incident_id VARCHAR(64) NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
    report_id VARCHAR(64) REFERENCES reports(id) ON DELETE SET NULL,
    destination_authority VARCHAR(150) NOT NULL,
    authority_endpoint VARCHAR(255),
    submission_method submission_method NOT NULL DEFAULT 'manual_export',
    external_reference VARCHAR(100),
    status complaint_status NOT NULL DEFAULT 'draft',
    submitted_at TIMESTAMPTZ,
    last_checked_at TIMESTAMPTZ,
    error_summary TEXT,
    retry_count INT NOT NULL DEFAULT 0,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- =============================================================================
-- 9. NOTIFICATIONS
-- =============================================================================
CREATE TYPE notification_channel AS ENUM ('in_app', 'email', 'sms', 'webhook');
CREATE TYPE notification_status AS ENUM ('unread', 'read', 'delivered', 'failed');

CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(64) PRIMARY KEY DEFAULT ('notif-' || substr(md5(random()::text), 1, 12)),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    incident_id VARCHAR(64) REFERENCES incidents(id) ON DELETE SET NULL,
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    channel notification_channel NOT NULL DEFAULT 'in_app',
    status notification_status NOT NULL DEFAULT 'unread',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    delivered_at TIMESTAMPTZ
);

-- =============================================================================
-- 10. AUDIT LOGS (IMMUTABLE LOG OF COMPLIANCE ACTIONS)
-- =============================================================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGSERIAL PRIMARY KEY,
    actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    entity_type VARCHAR(50) NOT NULL, -- 'incident', 'report', 'complaint', 'threshold'
    entity_id VARCHAR(64) NOT NULL,
    action VARCHAR(50) NOT NULL, -- 'create', 'review', 'approve', 'submit', 'reject'
    timestamp TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    ip_address VARCHAR(45),
    user_agent TEXT,
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_id);

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE sound_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Profiles: Users read their own, Admins read all
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view and manage all profiles" ON profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

-- Locations: Public locations are readable by all authenticated users
CREATE POLICY "Public locations viewable by all" ON locations
    FOR SELECT USING (is_public = TRUE);

CREATE POLICY "Reviewers & admins can manage locations" ON locations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('reviewer', 'admin')
        )
    );

-- Sound Readings: Viewable by authenticated users for authorized locations
CREATE POLICY "Readings viewable by authenticated users" ON sound_readings
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Devices can insert readings" ON sound_readings
    FOR INSERT WITH CHECK (TRUE);

-- Incidents: Reviewers and Admins have full access; regular users see authorized incidents
CREATE POLICY "Incidents viewable by authenticated users" ON incidents
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Reviewers & admins can update incidents" ON incidents
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('reviewer', 'admin')
        )
    );

-- Reports: Creators and Reviewers/Admins
CREATE POLICY "Reports viewable by authenticated users" ON reports
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Reviewers can approve and edit reports" ON reports
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('reviewer', 'admin')
        )
    );

-- Audit logs: Read-only for admins; insert-only system policy
CREATE POLICY "Admins can view audit logs" ON audit_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

CREATE POLICY "System can insert audit logs" ON audit_logs
    FOR INSERT WITH CHECK (TRUE);
