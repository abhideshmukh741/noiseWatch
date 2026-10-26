"""Demo data generator for NoiseWatch.

All generated data is clearly marked as simulated/demo.
This module is used when DEMO_MODE=true and no real database is connected.
"""

import random
import math
from datetime import datetime, timedelta, timezone
from typing import List, Dict, Any
from uuid import uuid4


def _ts(hours_ago: float = 0) -> str:
    """Generate ISO timestamp relative to now."""
    dt = datetime.now(timezone.utc) - timedelta(hours=hours_ago)
    return dt.isoformat()


def _uuid() -> str:
    return str(uuid4())


# ── Fixed demo IDs for consistency ─────────────────────────────

DEMO_USER_ID = "demo-user-00000001"
DEMO_REVIEWER_ID = "demo-reviewer-00000001"
DEMO_ADMIN_ID = "demo-admin-00000001"

DEMO_LOCATIONS = [
    {
        "id": "loc-demo-001",
        "name": "Greenfield Residential Area",
        "description": "Quiet residential neighborhood near the park",
        "latitude": 19.0760,
        "longitude": 72.8777,
        "zone_category": "residential",
        "address": "Greenfield Colony, Sector 12",
        "is_active": True,
        "created_by": DEMO_USER_ID,
        "created_at": _ts(720),
    },
    {
        "id": "loc-demo-002",
        "name": "Industrial Zone — Warehouse District",
        "description": "Heavy machinery area, calibrated monitoring station",
        "latitude": 19.0330,
        "longitude": 72.8430,
        "zone_category": "industrial",
        "address": "MIDC Phase III, Block B",
        "is_active": True,
        "created_by": DEMO_USER_ID,
        "created_at": _ts(600),
    },
    {
        "id": "loc-demo-003",
        "name": "City Center Commercial Strip",
        "description": "Busy commercial area with restaurants and nightlife",
        "latitude": 19.0596,
        "longitude": 72.8295,
        "zone_category": "commercial",
        "address": "MG Road, Block 5",
        "is_active": True,
        "created_by": DEMO_USER_ID,
        "created_at": _ts(480),
    },
    {
        "id": "loc-demo-004",
        "name": "Hospital Silence Zone",
        "description": "Monitoring station near Central Hospital",
        "latitude": 19.0450,
        "longitude": 72.8350,
        "zone_category": "silence_zone",
        "address": "Near Central Hospital Gate 2",
        "is_active": True,
        "created_by": DEMO_REVIEWER_ID,
        "created_at": _ts(360),
    },
]

DEMO_DEVICES = [
    {
        "id": "dev-demo-001",
        "location_id": "loc-demo-001",
        "name": "Browser Prototype Sensor",
        "device_type": "browser_microphone",
        "model_info": "Chrome Web Audio API",
        "calibration_status": "not_calibrated",
        "is_online": True,
        "last_seen_at": _ts(0.1),
    },
    {
        "id": "dev-demo-002",
        "location_id": "loc-demo-002",
        "name": "SVAN 971 Sound Level Meter",
        "device_type": "calibrated_meter",
        "model_info": "SVAN 971 Class 1",
        "serial_number": "SN-2024-04521",
        "calibration_status": "calibrated",
        "calibration_date": _ts(2160),
        "calibration_expiry": _ts(-4320),  # future
        "is_online": True,
        "last_seen_at": _ts(0.05),
    },
    {
        "id": "dev-demo-003",
        "location_id": "loc-demo-003",
        "name": "IoT Noise Monitor Node",
        "device_type": "iot_sensor",
        "model_info": "NoiseSense v2.1",
        "calibration_status": "expired",
        "calibration_date": _ts(8760),
        "calibration_expiry": _ts(720),
        "is_online": False,
        "last_seen_at": _ts(48),
    },
    {
        "id": "dev-demo-004",
        "location_id": "loc-demo-004",
        "name": "CESVA SC420 Meter",
        "device_type": "calibrated_meter",
        "model_info": "CESVA SC420 Class 2",
        "serial_number": "SN-2023-09871",
        "calibration_status": "calibrated",
        "calibration_date": _ts(4320),
        "calibration_expiry": _ts(-2160),
        "is_online": True,
        "last_seen_at": _ts(0.02),
    },
]


def generate_hourly_readings(hours: int = 24, location_id: str = "loc-demo-001") -> List[Dict[str, Any]]:
    """Generate simulated hourly noise readings with realistic patterns.

    All values are clearly marked as simulated demo data.
    These are NOT real measurements.
    """
    readings = []
    device_map = {
        "loc-demo-001": ("dev-demo-001", "relative_intensity", "relative", "uncalibrated_estimate"),
        "loc-demo-002": ("dev-demo-002", "LAeq", "dB(A)", "simulated_demo"),
        "loc-demo-003": ("dev-demo-003", "LAeq", "dB(A)", "simulated_demo"),
        "loc-demo-004": ("dev-demo-004", "LAeq", "dB(A)", "simulated_demo"),
    }

    device_id, metric, unit, method = device_map.get(
        location_id, ("dev-demo-001", "relative_intensity", "relative", "simulated_demo")
    )

    base_levels = {
        "loc-demo-001": 42,
        "loc-demo-002": 68,
        "loc-demo-003": 58,
        "loc-demo-004": 35,
    }
    base = base_levels.get(location_id, 45)

    for i in range(hours):
        hour_offset = hours - i
        dt = datetime.now(timezone.utc) - timedelta(hours=hour_offset)
        hour = dt.hour

        # Realistic diurnal pattern
        if 0 <= hour < 6:
            variation = -8 + random.uniform(-3, 3)
        elif 6 <= hour < 9:
            variation = 5 + random.uniform(-2, 4)  # Morning rush
        elif 9 <= hour < 12:
            variation = 3 + random.uniform(-2, 3)
        elif 12 <= hour < 14:
            variation = 6 + random.uniform(-2, 4)  # Lunch hour
        elif 14 <= hour < 17:
            variation = 2 + random.uniform(-2, 3)
        elif 17 <= hour < 20:
            variation = 8 + random.uniform(-2, 5)  # Evening rush
        elif 20 <= hour < 22:
            variation = 4 + random.uniform(-3, 3)
        else:
            variation = -5 + random.uniform(-3, 2)

        # Add occasional spikes (simulated events)
        spike = 0
        if random.random() < 0.08:
            spike = random.uniform(8, 20)

        value = round(base + variation + spike, 1)

        readings.append({
            "id": _uuid(),
            "device_id": device_id,
            "location_id": location_id,
            "timestamp": dt.isoformat(),
            "metric_name": metric,
            "value": value,
            "unit": unit,
            "measurement_method": method,
            "quality_status": "unknown" if method == "uncalibrated_estimate" else "good",
            "duration_seconds": 3600,
            "is_demo": True,
        })

    return readings


def generate_demo_incidents() -> List[Dict[str, Any]]:
    """Generate sample incidents for demo mode.

    All incidents are synthetic and clearly marked.
    """
    return [
        {
            "id": "inc-demo-001",
            "location_id": "loc-demo-002",
            "start_time": _ts(6),
            "end_time": _ts(4.5),
            "status": "verified",
            "severity": "high",
            "rule_version": "v1.0-demo",
            "threshold_value": 75.0,
            "threshold_unit": "dB(A)",
            "measured_value": 84.2,
            "measurement_method": "simulated_demo",
            "confidence": 0.85,
            "sound_category": "machinery",
            "summary": "[DEMO] Sustained noise from industrial machinery exceeded the configured threshold for industrial zones during daytime hours. This is simulated data for demonstration purposes.",
            "reviewer_notes": "[DEMO] Verified by demo reviewer — simulated review process.",
            "reviewed_by": DEMO_REVIEWER_ID,
            "reviewed_at": _ts(3),
            "created_at": _ts(6),
            "is_demo": True,
        },
        {
            "id": "inc-demo-002",
            "location_id": "loc-demo-003",
            "start_time": _ts(18),
            "end_time": _ts(15),
            "status": "potential_exceedance",
            "severity": "medium",
            "rule_version": "v1.0-demo",
            "threshold_value": 65.0,
            "threshold_unit": "dB(A)",
            "measured_value": 72.8,
            "measurement_method": "simulated_demo",
            "confidence": 0.62,
            "sound_category": "music",
            "summary": "[DEMO] Late-night music from nearby venue. Potential exceedance detected by automated screening. Awaiting human review. This is simulated data.",
            "created_at": _ts(18),
            "is_demo": True,
        },
        {
            "id": "inc-demo-003",
            "location_id": "loc-demo-004",
            "start_time": _ts(2),
            "end_time": None,
            "status": "under_review",
            "severity": "critical",
            "rule_version": "v1.0-demo",
            "threshold_value": 50.0,
            "threshold_unit": "dB(A)",
            "measured_value": 68.5,
            "measurement_method": "simulated_demo",
            "confidence": 0.78,
            "sound_category": "construction",
            "summary": "[DEMO] Construction noise near hospital silence zone. Calibrated meter reported sustained levels above threshold. Under review. This is simulated data.",
            "created_at": _ts(2),
            "is_demo": True,
        },
        {
            "id": "inc-demo-004",
            "location_id": "loc-demo-001",
            "start_time": _ts(48),
            "end_time": _ts(46),
            "status": "dismissed",
            "severity": "low",
            "rule_version": "v1.0-demo",
            "threshold_value": 55.0,
            "threshold_unit": "dB(A)",
            "measured_value": 57.1,
            "measurement_method": "uncalibrated_estimate",
            "confidence": 0.35,
            "sound_category": "traffic",
            "summary": "[DEMO] Brief traffic noise spike from uncalibrated browser microphone. Dismissed — uncalibrated source, low confidence, short duration. This is simulated data.",
            "reviewer_notes": "[DEMO] Dismissed — uncalibrated reading, below actionable threshold.",
            "reviewed_by": DEMO_REVIEWER_ID,
            "reviewed_at": _ts(44),
            "created_at": _ts(48),
            "is_demo": True,
        },
    ]


def generate_demo_reports() -> List[Dict[str, Any]]:
    """Generate sample reports for demo mode."""
    return [
        {
            "id": "rpt-demo-001",
            "incident_id": "inc-demo-001",
            "version": 1,
            "status": "approved",
            "title": "[DEMO] Industrial Noise Exceedance Report — Warehouse District",
            "narrative": "Sustained machinery noise was detected at the Industrial Zone monitoring station. Simulated calibrated measurements indicated levels of 84.2 dB(A) LAeq over a 90-minute period, exceeding the 75 dB(A) daytime threshold for industrial zones. This is a demonstration report generated from simulated data.",
            "limitations": "This report was generated from SIMULATED demo data. No real measurements were taken. Do not use for any official purpose.",
            "generated_by": DEMO_USER_ID,
            "approved_by": DEMO_REVIEWER_ID,
            "storage_path": None,
            "generated_at": _ts(5),
            "approved_at": _ts(2.5),
            "is_demo": True,
        },
    ]


def generate_demo_complaints() -> List[Dict[str, Any]]:
    """Generate sample complaints for demo mode."""
    return [
        {
            "id": "cmp-demo-001",
            "incident_id": "inc-demo-001",
            "report_id": "rpt-demo-001",
            "destination_authority": "Municipal Environment Department (Demo)",
            "submission_method": "manual_download",
            "external_reference": None,
            "status": "draft",
            "submitted_at": None,
            "error_summary": None,
            "retry_count": 0,
            "created_at": _ts(2),
            "is_demo": True,
        },
    ]


def generate_demo_notifications() -> List[Dict[str, Any]]:
    """Generate sample notifications for demo mode."""
    return [
        {
            "id": "ntf-demo-001",
            "user_id": DEMO_USER_ID,
            "incident_id": "inc-demo-003",
            "title": "[DEMO] Critical: Noise exceedance near Hospital",
            "message": "Construction noise near the Hospital Silence Zone has exceeded the configured threshold. Please review the incident. (Demo notification)",
            "channel": "in_app",
            "status": "delivered",
            "created_at": _ts(2),
            "read_at": None,
        },
        {
            "id": "ntf-demo-002",
            "user_id": DEMO_USER_ID,
            "incident_id": "inc-demo-001",
            "title": "[DEMO] Report approved — Industrial Noise",
            "message": "The report for the industrial noise incident has been approved and is ready for download. (Demo notification)",
            "channel": "in_app",
            "status": "read",
            "created_at": _ts(3),
            "read_at": _ts(2.5),
        },
    ]


def get_demo_dashboard_summary() -> Dict[str, Any]:
    """Generate a complete demo dashboard summary."""
    readings = generate_hourly_readings(24, "loc-demo-001")
    latest = readings[-1] if readings else None
    incidents = generate_demo_incidents()

    hourly_avgs = []
    for r in readings[-24:]:
        hourly_avgs.append({
            "timestamp": r["timestamp"],
            "value": r["value"],
            "unit": r["unit"],
            "method": r["measurement_method"],
        })

    return {
        "total_locations": len(DEMO_LOCATIONS),
        "active_devices": sum(1 for d in DEMO_DEVICES if d.get("is_online")),
        "total_readings_today": len(readings),
        "active_incidents": sum(1 for i in incidents if i["status"] in ("potential_exceedance", "under_review")),
        "pending_reports": 0,
        "latest_reading": {
            "value": latest["value"] if latest else None,
            "unit": latest["unit"] if latest else None,
            "method": latest["measurement_method"] if latest else None,
            "timestamp": latest["timestamp"] if latest else None,
            "is_demo": True,
        },
        "recent_incidents": [
            {
                "id": i["id"],
                "location_id": i["location_id"],
                "status": i["status"],
                "severity": i["severity"],
                "summary": i["summary"],
                "start_time": i["start_time"],
                "measured_value": i["measured_value"],
                "threshold_value": i["threshold_value"],
                "is_demo": True,
            }
            for i in incidents[:5]
        ],
        "hourly_averages": hourly_avgs,
        "is_demo_mode": True,
    }


# ── Demo threshold configurations ─────────────────────────────

DEMO_THRESHOLDS = [
    {"zone": "residential", "period": "day", "threshold": 55, "unit": "dB(A)", "source": "Demo — Illustrative threshold only"},
    {"zone": "residential", "period": "night", "threshold": 45, "unit": "dB(A)", "source": "Demo — Illustrative threshold only"},
    {"zone": "commercial", "period": "day", "threshold": 65, "unit": "dB(A)", "source": "Demo — Illustrative threshold only"},
    {"zone": "commercial", "period": "night", "threshold": 55, "unit": "dB(A)", "source": "Demo — Illustrative threshold only"},
    {"zone": "industrial", "period": "day", "threshold": 75, "unit": "dB(A)", "source": "Demo — Illustrative threshold only"},
    {"zone": "industrial", "period": "night", "threshold": 70, "unit": "dB(A)", "source": "Demo — Illustrative threshold only"},
    {"zone": "silence_zone", "period": "day", "threshold": 50, "unit": "dB(A)", "source": "Demo — Illustrative threshold only"},
    {"zone": "silence_zone", "period": "night", "threshold": 40, "unit": "dB(A)", "source": "Demo — Illustrative threshold only"},
]
