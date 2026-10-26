"""Audio processing, ML classification, and Mobile Environmental Evaluation routes for NoiseWatch."""

import io
import os
from uuid import uuid4
from datetime import datetime, timezone
import numpy as np
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Query, status
from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional
import scipy.io.wavfile as wavfile
from app.ml.classifier import classifier, AudioFeatureExtractor
from app.ml.train_model import train_and_save_model, AcousticFeaturePipeline
from app.services.zone_service import detect_zone_from_gps, ZONE_STATUTORY_LIMITS, get_current_time_period

router = APIRouter(prefix="/api/audio", tags=["Audio & Machine Learning"])


class AudioFeaturesInput(BaseModel):
    rms_energy: float = Field(..., ge=0)
    zero_crossing_rate: float = Field(..., ge=0)
    spectral_centroid: float = Field(..., ge=0)
    spectral_bandwidth: float = Field(..., ge=0)
    spectral_rolloff: float = Field(..., ge=0)
    duration_seconds: float = Field(1.0, ge=0.01)
    force_fallback: bool = Field(False, description="Force heuristic fallback model")


class AudioSamplePayload(BaseModel):
    samples: List[float] = Field(..., description="Array of normalized audio float samples (-1.0 to 1.0)")
    sample_rate: int = Field(22050, ge=8000, le=48000)
    force_fallback: bool = Field(False, description="Force heuristic fallback model")


class RetrainRequest(BaseModel):
    samples_per_class: int = Field(250, ge=50, le=1000, description="Synthetic samples per category")
    n_estimators: int = Field(150, ge=20, le=300, description="Number of Random Forest trees")


class MobileEvaluationPayload(BaseModel):
    samples: List[float] = Field(..., description="Array of audio samples from mobile microphone")
    sample_rate: int = Field(22050, ge=8000, le=48000)
    measured_db: float = Field(..., ge=20.0, le=140.0, description="Estimated dB(A) from phone microphone")
    latitude: float = Field(..., ge=-90.0, le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)
    zone_category: Optional[str] = Field(None, description="Optional manual zone override")
    address: Optional[str] = None
    duration_seconds: float = Field(3.0, ge=0.5, le=30.0)


@router.get("/model-info")
async def get_model_info():
    """Get metadata about active ML model, accuracy metrics, and acoustic feature importances."""
    return classifier.get_model_info()


@router.get("/detect-zone")
async def detect_zone(lat: float = Query(..., ge=-90, le=90), lon: float = Query(..., ge=-180, le=180)):
    """Detect environmental zone category and statutory thresholds from smartphone GPS coordinates."""
    return await detect_zone_from_gps(lat, lon)


@router.post("/extract-features")
async def extract_features(payload: AudioSamplePayload):
    """Extract acoustic features from audio samples (RMS, ZCR, spectral centroid, rolloff, band ratios)."""
    if not payload.samples:
        raise HTTPException(status_code=400, detail="Empty audio sample array")

    arr = np.array(payload.samples, dtype=np.float32)
    features = AudioFeatureExtractor.extract_basic_features(arr, payload.sample_rate)
    pipeline_vector = AcousticFeaturePipeline.extract_vector(arr, payload.sample_rate)
    advanced = AudioFeatureExtractor.extract_advanced_features(arr, payload.sample_rate)
    
    return {
        "features": features,
        "pipeline_features": pipeline_vector,
        "advanced_features": advanced,
        "sample_count": len(payload.samples),
        "sample_rate": payload.sample_rate,
    }


@router.post("/classify")
async def classify_audio(payload: AudioSamplePayload):
    """Classify sound event from raw audio samples using the trained Machine Learning model."""
    if not payload.samples:
        raise HTTPException(status_code=400, detail="Empty audio sample array")

    arr = np.array(payload.samples, dtype=np.float32)
    result = classifier.classify_audio(arr, payload.sample_rate, force_fallback=payload.force_fallback)
    features = AudioFeatureExtractor.extract_basic_features(arr, payload.sample_rate)

    return {
        "category": result.category,
        "confidence": result.confidence,
        "all_scores": result.all_scores,
        "model_version": result.model_version,
        "is_placeholder": result.is_placeholder,
        "notes": result.notes,
        "features": result.features or features,
        "timestamp": result.timestamp,
    }


@router.post("/classify-features")
async def classify_features(payload: AudioFeaturesInput):
    """Classify sound event from pre-computed acoustic features."""
    data = payload.model_dump()
    force_fallback = data.pop("force_fallback", False)
    result = classifier.classify_features(data, force_fallback=force_fallback)
    return {
        "category": result.category,
        "confidence": result.confidence,
        "all_scores": result.all_scores,
        "model_version": result.model_version,
        "is_placeholder": result.is_placeholder,
        "notes": result.notes,
        "features": result.features,
        "timestamp": result.timestamp,
    }


@router.post("/retrain")
async def retrain_model(req: RetrainRequest = RetrainRequest()):
    """Trigger retraining of the Random Forest acoustic model."""
    try:
        metrics = train_and_save_model(
            samples_per_category=req.samples_per_class,
            n_estimators=req.n_estimators,
        )
        model_path = os.path.join(classifier.model_dir, "sound_classifier.joblib")
        classifier.load_trained_model(model_path)

        return {
            "status": "success",
            "message": "Model retrained and reloaded successfully.",
            "metrics": metrics,
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Model retraining failed: {str(e)}",
        )


@router.post("/upload-and-classify")
async def upload_and_classify_audio(file: UploadFile = File(...)):
    """Upload a real audio file (.wav format) for feature extraction and ML classification."""
    try:
        content = await file.read()
        if not content:
            raise HTTPException(status_code=400, detail="Uploaded file is empty")

        try:
            sample_rate, data = wavfile.read(io.BytesIO(content))
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to parse WAV audio file: {str(e)}. Please upload standard PCM WAV.")

        if data.ndim > 1:
            data = data.mean(axis=1)

        if np.issubdtype(data.dtype, np.integer):
            max_int = np.iinfo(data.dtype).max
            float_data = (data / max_int).astype(np.float32)
        else:
            float_data = data.astype(np.float32)

        max_samples = sample_rate * 10
        if len(float_data) > max_samples:
            float_data = float_data[:max_samples]

        result = classifier.classify_audio(float_data, sample_rate)

        step = max(1, len(float_data) // 64)
        waveform = [float(float_data[i]) for i in range(0, min(len(float_data), 64 * step), step)][:64]

        return {
            "filename": file.filename,
            "sample_rate": sample_rate,
            "duration_seconds": round(len(float_data) / sample_rate, 2),
            "category": result.category,
            "confidence": result.confidence,
            "all_scores": result.all_scores,
            "model_version": result.model_version,
            "is_placeholder": result.is_placeholder,
            "notes": result.notes,
            "features": result.features,
            "waveform_preview": waveform,
            "timestamp": result.timestamp,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Audio processing error: {str(e)}")


@router.post("/evaluate-mobile-reading")
async def evaluate_mobile_reading(payload: MobileEvaluationPayload):
    """Evaluate a mobile smartphone audio recording against location zoning and legal thresholds.
    
    Combines:
    1. Smartphone GPS location & OpenStreetMap Landuse zoning
    2. Real trained Random Forest ML acoustic classifier (identifying source)
    3. Statutory time-of-day threshold limits (Noise Pollution Rules 2000)
    4. Regulatory exemption screening (e.g. emergency vehicle siren exemption)
    """
    if not payload.samples:
        raise HTTPException(status_code=400, detail="Empty audio sample array")

    # 1. Resolve Zoning & Statutory Limits
    if payload.zone_category and payload.zone_category in ZONE_STATUTORY_LIMITS:
        zone_category = payload.zone_category
        zone_info = ZONE_STATUTORY_LIMITS[zone_category]
        time_period = get_current_time_period()
        threshold_dba = zone_info["day_threshold_dba"] if time_period == "day" else zone_info["night_threshold_dba"]
        address = payload.address or f"Coordinates: {round(payload.latitude, 4)}° N, {round(payload.longitude, 4)}° E"
    else:
        zone_data = await detect_zone_from_gps(payload.latitude, payload.longitude)
        zone_category = zone_data["zone_category"]
        zone_info = ZONE_STATUTORY_LIMITS[zone_category]
        time_period = zone_data["time_period"]
        threshold_dba = zone_data["current_threshold_dba"]
        address = payload.address or zone_data["address"]

    # 2. Run Trained Random Forest ML Acoustic Classifier
    arr = np.array(payload.samples, dtype=np.float32)
    ml_result = classifier.classify_audio(arr, payload.sample_rate)
    category = ml_result.category
    confidence = ml_result.confidence

    # 3. Compute Decibel Excess and Legal Verdict
    excess_dba = round(payload.measured_db - threshold_dba, 1)
    is_exceeded = excess_dba > 0.0

    # Exemption screening: Emergency sirens / alarms are public safety signals
    is_exempt = False
    exemption_reason = None
    if category == "alarm":
        is_exempt = True
        exemption_reason = "Public safety alert signal (Emergency sirens are legally exempted from curfew restrictions under Rule 5)."

    is_violation = is_exceeded and not is_exempt

    # Assess severity
    if not is_exceeded or is_exempt:
        severity = "none"
    elif excess_dba <= 5.0:
        severity = "low"
    elif excess_dba <= 15.0:
        severity = "medium"
    elif excess_dba <= 25.0:
        severity = "high"
    else:
        severity = "critical"

    # Legal summary text
    incident_id = f"INC-MOB-{uuid4().hex[:8].upper()}" if is_violation else None
    if is_exempt:
        verdict = "Statutory Exemption (Emergency Alarm)"
        legal_summary = f"Sound level reached {payload.measured_db} dB(A), but emergency alarm/siren acoustic signature is exempted for public safety."
    elif is_violation:
        verdict = f"Potential Statutory Violation (+{excess_dba} dB(A) Exceedance)"
        legal_summary = (
            f"Measured {payload.measured_db} dB(A) exceeds the legal {time_period} threshold ({threshold_dba} dB(A)) "
            f"for {zone_info['name']} by +{excess_dba} dB(A). Classified as '{category.upper()}' with {round(confidence*100, 1)}% confidence."
        )
    else:
        verdict = "Compliant (Within Statutory Limit)"
        legal_summary = f"Measured level ({payload.measured_db} dB(A)) is within the permissible {time_period} limit of {threshold_dba} dB(A) for {zone_info['name']}."

    notes = [
        f"Measurement captured via smartphone microphone (relative estimated energy).",
        f"Zone category: {zone_info['name']} ({zone_info['legal_reference']}).",
        f"Acoustic classification identified signature: {category.upper()} ({round(confidence*100, 1)}% probability).",
    ]
    if is_violation:
        notes.append("Algorithmic screening complete: citizen may download compliance dossier or file municipal complaint.")

    return {
        "incident_id": incident_id,
        "is_pollution_violation": is_violation,
        "is_exempt": is_exempt,
        "exemption_reason": exemption_reason,
        "severity": severity,
        "verdict": verdict,
        "legal_summary": legal_summary,
        "measured_db": payload.measured_db,
        "threshold_db": threshold_dba,
        "excess_db": max(0.0, excess_dba),
        "zone_category": zone_category,
        "zone_name": zone_info["name"],
        "time_period": time_period,
        "day_threshold_dba": zone_info["day_threshold_dba"],
        "night_threshold_dba": zone_info["night_threshold_dba"],
        "sound_classification": category,
        "confidence": confidence,
        "all_scores": ml_result.all_scores,
        "features": ml_result.features,
        "latitude": payload.latitude,
        "longitude": payload.longitude,
        "address": address,
        "notes": notes,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
