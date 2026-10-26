"""Direct Test Runner for NoiseWatch Test Suite."""

import sys
import os

# Ensure backend root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from tests import test_backend

def run_all():
    tests = [
        ("Health Endpoint", test_backend.test_health_endpoint),
        ("API Root Info", test_backend.test_api_root),
        ("Dashboard Summary", test_backend.test_dashboard_summary),
        ("Locations List & Filters", test_backend.test_locations_list),
        ("Get Location by ID", test_backend.test_get_location_by_id),
        ("Detection Engine Below Threshold", test_backend.test_detection_engine_below_threshold),
        ("Detection Engine Exceedance", test_backend.test_detection_engine_exceedance_persistence),
        ("Nighttime Threshold Stricter", test_backend.test_night_time_threshold_stricter),
        ("Audio Feature Extraction (FFT)", test_backend.test_audio_feature_extraction),
        ("Classifier Fallback & Honesty", test_backend.test_classifier_fallback_honesty),
        ("Trained ML Acoustic Classifier", test_backend.test_trained_ml_classifier),
        ("Audio API Endpoints", test_backend.test_audio_api_endpoints),
        ("WAV Audio Upload & Classification", test_backend.test_upload_and_classify_wav),
        ("Mobile GPS Zoning & Pollution Evaluation", test_backend.test_mobile_zoning_and_pollution_evaluation),
        ("ReportLab PDF Generation", test_backend.test_generate_pdf_report),
        ("PDF Download Stream", test_backend.test_pdf_download_endpoint),
        ("JWT Auth Lifecycle", test_backend.test_jwt_auth_lifecycle),
        ("List Reports", test_backend.test_list_reports),
        ("Complaint Submission Workflow", test_backend.test_complaint_submission_workflow),
    ]

    passed = 0
    failed = 0

    print("=" * 65)
    print("  NOISEWATCH BACKEND TEST SUITE RUNNER")
    print("=" * 65)

    for name, func in tests:
        try:
            func()
            print(f" [PASS] {name}")
            passed += 1
        except Exception as e:
            print(f" [FAIL] {name}: {e}")
            failed += 1

    print("=" * 65)
    print(f"  RESULTS: {passed} passed, {failed} failed out of {len(tests)} tests.")
    print("=" * 65)

    if failed > 0:
        sys.exit(1)

if __name__ == "__main__":
    run_all()
