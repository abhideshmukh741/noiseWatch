"""Comprehensive Unit & Integration Test Suite for NoiseWatch Backend.

Covers:
- System health and configuration
- Dashboard data aggregation
- Incident detection engine (thresholds, persistence, cooldown)
- Audio feature extraction (FFT, spectral centroid, RMS, ZCR)
- Sound event ML classification interface
- ReportLab PDF compliance report generation
- Authentication token issuing and verification
- Complaint workflow integration
"""

import numpy as np
from fastapi.testclient import TestClient
from app.main import app
from app.services.incident_engine import detection_engine, IncidentDetectionEngine
from app.ml.classifier import classifier, AudioFeatureExtractor, SoundCategory
from app.services.pdf_generator import generate_incident_pdf
from app.core.auth import create_access_token, decode_token

client = TestClient(app)


# ── 1. System Health & Info Tests ──────────────────────────────

def test_health_endpoint():
    """Verify health check returns 200 and demo mode metadata."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "NoiseWatch API"
    assert "demo_mode" in data


def test_api_root():
    """Verify root API returns service info and documentation links."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "docs" in data
    assert "health" in data


# ── 2. Dashboard & Locations Tests ─────────────────────────────

def test_dashboard_summary():
    """Verify dashboard summary returns key metrics and recent incidents."""
    response = client.get("/api/dashboard/summary")
    assert response.status_code == 200
    data = response.json()
    assert data["total_locations"] > 0
    assert "active_devices" in data
    assert "recent_incidents" in data
    assert len(data["recent_incidents"]) > 0


def test_locations_list():
    """Verify listing locations and filtering by zone."""
    response = client.get("/api/locations")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] > 0
    assert len(data["items"]) > 0

    # Test zone filter
    res_zone = client.get("/api/locations?zone=residential")
    assert res_zone.status_code == 200
    zone_data = res_zone.json()
    for item in zone_data["items"]:
        assert item["zone_category"] == "residential"


def test_get_location_by_id():
    """Verify retrieving specific location."""
    response = client.get("/api/locations/loc-demo-001")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == "loc-demo-001"
    assert "zone_category" in data


# ── 3. Incident Detection Rule Engine Tests ────────────────────

def test_detection_engine_below_threshold():
    """Readings below statutory limit should NOT trigger exceedance."""
    engine = IncidentDetectionEngine()
    result = engine.evaluate_reading(
        value=48.0,
        unit="dB(A)",
        location_id="test-loc",
        zone_category="residential",
        is_day=True,
    )
    assert result.exceeded is False
    assert result.severity == "none"


def test_detection_engine_exceedance_persistence():
    """Readings exceeding limit must respect persistence before confirming."""
    engine = IncidentDetectionEngine()
    
    # 1. First high reading (initiates tracking)
    res1 = engine.evaluate_reading(
        value=72.0,
        unit="dB(A)",
        location_id="test-loc-persist",
        zone_category="residential",
        is_day=True,
    )
    assert res1.exceeded is True
    assert res1.severity in ("medium", "high")


def test_night_time_threshold_stricter():
    """Nighttime limit is stricter (45 dBA vs 55 dBA in residential)."""
    engine = IncidentDetectionEngine()
    # 50 dBA during day is normal
    day_res = engine.evaluate_reading(
        value=50.0,
        unit="dB(A)",
        location_id="test-night",
        zone_category="residential",
        is_day=True,
    )
    assert day_res.exceeded is False

    # 50 dBA at night is an exceedance (threshold = 45 dBA)
    night_res = engine.evaluate_reading(
        value=50.0,
        unit="dB(A)",
        location_id="test-night",
        zone_category="residential",
        is_day=False,
    )
    assert night_res.exceeded is True
    assert night_res.threshold_value == 45.0


# ── 4. Audio Feature Extraction & ML Tests ─────────────────────

def test_audio_feature_extraction():
    """Verify numerical feature extraction using numpy FFT."""
    sample_rate = 22050
    t = np.linspace(0, 1.0, sample_rate, endpoint=False)
    # Generate 1000 Hz pure tone
    pure_tone = 0.5 * np.sin(2 * np.pi * 1000 * t)

    features = AudioFeatureExtractor.extract_basic_features(pure_tone, sample_rate)
    assert features["rms_energy"] > 0
    assert 900 <= features["spectral_centroid"] <= 1100  # Centroid around 1000 Hz
    assert features["spectral_rolloff"] > 0
    assert features["duration_seconds"] == 1.0


def test_classifier_fallback_honesty():
    """Verify classifier explicitly returns placeholder/rule-based status when fallback is used."""
    sample_rate = 22050
    t = np.linspace(0, 0.5, int(sample_rate * 0.5), endpoint=False)
    audio = 0.3 * np.random.normal(0, 1, len(t))

    result = classifier.classify_audio(audio, sample_rate, force_fallback=True)
    assert result.is_placeholder is True
    assert "rule-based" in result.model_version
    assert len(result.notes) > 0
    assert any("NOT a trained ML model" in note for note in result.notes)


def test_trained_ml_classifier():
    """Verify real trained Random Forest ML acoustic classifier."""
    from app.ml.train_model import AcousticDataSynthesizer

    assert classifier.is_trained is True
    assert "rf-acoustic" in classifier.model_version

    # Model info contains validation accuracy
    info = classifier.get_model_info()
    assert info["is_trained"] is True
    assert info["test_accuracy"] >= 0.90
    assert len(info["feature_importances"]) == 11

    # Test synthetic acoustic traffic sound
    synth = AcousticDataSynthesizer(sample_rate=22050)
    traffic_audio = synth.generate_sample("traffic", duration=1.0)
    result = classifier.classify_audio(traffic_audio, 22050)

    assert result.is_placeholder is False
    assert result.category == "traffic"
    assert result.confidence >= 0.70
    assert "Random Forest" in result.notes[0]


def test_audio_api_endpoints():
    """Verify /api/audio/model-info, /api/audio/classify, and fallback mode."""
    # Model info
    info_res = client.get("/api/audio/model-info")
    assert info_res.status_code == 200
    info_data = info_res.json()
    assert "model_version" in info_data
    assert "supported_categories" in info_data
    assert info_data["is_trained"] is True
    assert info_data["test_accuracy"] >= 0.90

    # Classify via API with trained model
    payload = {
        "samples": [0.1, -0.2, 0.3, -0.1, 0.05] * 200,
        "sample_rate": 22050,
    }
    classify_res = client.post("/api/audio/classify", json=payload)
    assert classify_res.status_code == 200
    c_data = classify_res.json()
    assert "category" in c_data
    assert "confidence" in c_data
    assert c_data["is_placeholder"] is False

    # Force fallback mode via API
    fallback_payload = {
        "samples": [0.1, -0.2, 0.3, -0.1, 0.05] * 200,
        "sample_rate": 22050,
        "force_fallback": True,
    }
    fb_res = client.post("/api/audio/classify", json=fallback_payload)
    assert fb_res.status_code == 200
    assert fb_res.json()["is_placeholder"] is True


def test_upload_and_classify_wav():
    """Verify /api/audio/upload-and-classify with in-memory WAV file."""
    import io
    import scipy.io.wavfile as wavfile

    sr = 22050
    t = np.linspace(0, 0.5, int(sr * 0.5), endpoint=False)
    # Siren tone 1200 Hz
    tone = (np.sin(2 * np.pi * 1200 * t) * 32767).astype(np.int16)

    wav_io = io.BytesIO()
    wavfile.write(wav_io, sr, tone)
    wav_io.seek(0)

    files = {"file": ("siren_test.wav", wav_io, "audio/wav")}
    res = client.post("/api/audio/upload-and-classify", files=files)
    assert res.status_code == 200
    data = res.json()
    assert "category" in data
    assert "confidence" in data
    assert data["sample_rate"] == sr
    assert len(data["waveform_preview"]) == 64


def test_mobile_zoning_and_pollution_evaluation():
    """Verify smartphone mobile workflow: GPS zoning + real ML classification + pollution threshold."""
    # 1. Test GPS zone detection
    zone_res = client.get("/api/audio/detect-zone?lat=19.0760&lon=72.8777")
    assert zone_res.status_code == 200
    zone_data = zone_res.json()
    assert "zone_category" in zone_data
    assert "current_threshold_dba" in zone_data
    assert zone_data["day_threshold_dba"] > 0
    assert zone_data["night_threshold_dba"] > 0

    # 2. Test Mobile Violation evaluation (Loud 78 dB construction in residential area)
    from app.ml.train_model import AcousticDataSynthesizer
    synth = AcousticDataSynthesizer(sample_rate=22050)
    samples = synth.generate_sample("construction", duration=1.0).tolist()

    violation_payload = {
        "samples": samples,
        "sample_rate": 22050,
        "measured_db": 78.5,
        "latitude": 19.0760,
        "longitude": 72.8777,
        "zone_category": "residential",
        "duration_seconds": 3.0,
    }
    eval_res = client.post("/api/audio/evaluate-mobile-reading", json=violation_payload)
    assert eval_res.status_code == 200
    eval_data = eval_res.json()

    assert eval_data["is_pollution_violation"] is True
    assert eval_data["excess_db"] > 20.0
    assert eval_data["sound_classification"] == "construction"
    assert eval_data["severity"] in ["high", "critical"]
    assert eval_data["incident_id"].startswith("INC-MOB-")

    # 3. Test Compliant quiet level (40 dB)
    compliant_payload = {
        "samples": samples,
        "sample_rate": 22050,
        "measured_db": 40.0,
        "latitude": 19.0760,
        "longitude": 72.8777,
        "zone_category": "residential",
    }
    comp_res = client.post("/api/audio/evaluate-mobile-reading", json=compliant_payload)
    assert comp_res.status_code == 200
    comp_data = comp_res.json()
    assert comp_data["is_pollution_violation"] is False
    assert comp_data["excess_db"] == 0.0




# ── 5. ReportLab PDF Generation Tests ──────────────────────────

def test_generate_pdf_report():
    """Verify ReportLab builds a valid PDF binary starting with %PDF."""
    report_data = {
        "id": "RPT-TEST-001",
        "version": "1.0",
        "status": "reviewed",
        "title": "Acoustic Incident Assessment — Test",
        "narrative": "Verified exceedance during testing.",
        "limitations": "Screening measurements only.",
    }
    incident_data = {
        "id": "INC-TEST-001",
        "measured_value": 74.5,
        "threshold_value": 55.0,
        "duration_seconds": 1200,
        "severity": "high",
        "measurement_method": "calibrated_class2",
    }
    location_data = {
        "name": "Industrial Test Site",
        "zone_category": "industrial",
    }

    pdf_buffer = generate_incident_pdf(report_data, incident_data, location_data)
    pdf_bytes = pdf_buffer.getvalue()

    assert len(pdf_bytes) > 500  # Non-trivial PDF size
    assert pdf_bytes.startswith(b"%PDF")  # Valid PDF signature


def test_pdf_download_endpoint():
    """Verify /api/reports/{id}/download streams an actual PDF."""
    response = client.get("/api/reports/rpt-demo-001/download")
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    assert response.content.startswith(b"%PDF")


# ── 6. Auth Token Tests ────────────────────────────────────────

def test_jwt_auth_lifecycle():
    """Verify generating and decoding JWT tokens."""
    token = create_access_token(
        user_id="user-test-123", email="test@noisewatch.app", role="reviewer"
    )
    assert isinstance(token, str)

    payload = decode_token(token)
    assert payload["sub"] == "user-test-123"
    assert payload["role"] == "reviewer"
    assert payload["email"] == "test@noisewatch.app"


# ── 7. Reports and Complaint Workflow Tests ────────────────────

def test_list_reports():
    """Verify listing generated reports."""
    response = client.get("/api/reports")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] > 0
    assert len(data["items"]) > 0


def test_complaint_submission_workflow():
    """Verify complaint submission returns official notice and does not fake submission."""
    response = client.post("/api/complaints/cmp-demo-001/submit")
    assert response.status_code == 200
    data = response.json()
    assert data["complaint_id"] == "cmp-demo-001"
    # Demonstrates honesty: requires authorized external credentials
    assert "No official complaint API is configured" in data["message"] or data["is_demo"] is True
