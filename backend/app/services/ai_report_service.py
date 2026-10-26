"""AI-Powered Environmental Compliance Report & Narrative Service for NoiseWatch.

Integrates Groq LLM (e.g. gpt-oss-120b) to generate court-admissible legal narratives,
statutory environmental analyses, health impact assessments, and formal municipal
complaint letters from acoustic measurements and ML classification results.
"""

from datetime import datetime, timezone
from typing import Dict, Any, Optional, List
import os
import json
import httpx
from app.core.config import settings


GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"


async def generate_ai_report_narrative(
    measured_db: float,
    threshold_db: float,
    zone_category: str,
    time_period: str,
    sound_classification: str,
    confidence: float,
    address: Optional[str] = None,
    incident_id: Optional[str] = None,
    duration_seconds: Optional[float] = 300,
) -> Dict[str, Any]:
    """Generate professional legal compliance narrative and recommendations using Groq AI.

    Falls back to structured rule-based narrative if Groq API is unreachable.
    """
    api_key = settings.groq_api_key or os.getenv("GROQ_API_KEY")
    model = settings.groq_model or "qwen/qwen3.8-27b"
    excess_db = round(max(0.0, measured_db - threshold_db), 1)

    system_prompt = (
        "You are an expert Indian Environmental Acoustic Intelligence and Environmental Law Analyst "
        "specializing exclusively in the laws of the Republic of India: "
        "1. The Noise Pollution (Regulation and Control) Rules, 2000 (under Environment Protection Act 1986). "
        "2. Central Pollution Control Board (CPCB) ambient air quality standards in respect of noise. "
        "3. Article 21 of the Constitution of India (Right to peaceful sleep and pollution-free life). "
        "4. Section 133 CrPC / Bharatiya Nagarik Suraksha Sanhita (BNSS) for public nuisance. "
        "Analyze the acoustic telemetry and return a structured JSON response with precise, "
        "court-admissible Indian legal reasoning, statutory citations, and an official complaint letter "
        "addressed to the Indian Competent Authority (Municipal Commissioner / Police Commissioner / SPCB)."
    )

    user_prompt = f"""
Analyze this environmental acoustic incident telemetry recorded in INDIA:
- Incident ID: {incident_id or 'INC-IND-MOB-01'}
- Measured Sound Pressure Level: {measured_db} dB(A) Leq
- CPCB Statutory Threshold Limit: {threshold_db} dB(A)
- Decibel Exceedance: +{excess_db} dB(A)
- CPCB Zone Category: {zone_category.upper()}
- Time of Occurrence: {time_period.upper()} Hours (Rule 5 Night Curfew applies 22:00 to 06:00)
- Acoustic Event ML Signature: {sound_classification.upper()} (Model Confidence: {round(confidence * 100, 1)}%)
- Location / Address: {address or 'Monitored Indian Municipal Coordinate'}
- Duration: {duration_seconds} seconds

Respond ONLY with valid JSON with the following exact keys:
{{
  "executive_summary": "2-3 concise sentences summarizing the technical exceedance, acoustic source, and regulatory breach under Indian Noise Rules 2000.",
  "statutory_analysis": "Detailed Indian legal reasoning citing Rule 3(1), Rule 5(1), and Environment (Protection) Act 1986 Section 15.",
  "health_impact": "Analysis of sleep architecture disruption, cardiovascular stress, and auditory strain referencing ICMR / CPCB guidelines.",
  "corrective_recommendations": [
    "Directive 1...",
    "Directive 2...",
    "Directive 3..."
  ],
  "formal_complaint_letter": "A complete, formal complaint letter formatted to the Commissioner of Police / Municipal Commissioner / Member Secretary SPCB citing this evidence and demanding action under Rule 8 and Sec 133 CrPC/BNSS."
}}
"""

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    body = {
        "model": model,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        "temperature": 0.2,
        "max_tokens": 1200,
        "response_format": {"type": "json_object"},
    }

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(GROQ_API_URL, headers=headers, json=body)
            if resp.status_code == 200:
                raw_content = resp.json()["choices"][0]["message"]["content"]
                parsed = json.loads(raw_content)
                parsed["ai_model"] = model
                parsed["generated_at"] = datetime.now(timezone.utc).isoformat()
                parsed["is_ai_generated"] = True
                return parsed
            else:
                print(f"Groq API returned error {resp.status_code}: {resp.text}")
    except Exception as e:
        print(f"Warning: Failed to reach Groq AI for report narrative: {e}")

    # High-quality fallback narrative if Groq API is unavailable
    return {
        "executive_summary": (
            f"Acoustic telemetry recorded an equivalent sound level of {measured_db} dB(A), "
            f"exceeding the prescribed statutory limit of {threshold_db} dB(A) by +{excess_db} dB(A) "
            f"in a designated {zone_category.upper()} zone during {time_period} hours. "
            f"Machine learning feature extraction identified the acoustic signature as {sound_classification.upper()} "
            f"with {round(confidence * 100, 1)}% probability."
        ),
        "statutory_analysis": (
            f"Pursuant to Rule 3(1) and Schedule of The Noise Pollution (Regulation and Control) Rules, 2000, "
            f"the maximum permissible ambient noise level for {zone_category} zones is {threshold_db} dB(A) "
            f"during {time_period} time. The measured exceedance of +{excess_db} dB constitutes a prima facie "
            f"statutory non-compliance warranting formal regulatory review."
        ),
        "health_impact": (
            "Sustained acoustic levels in excess of statutory baselines during this time window are recognized by "
            "the World Health Organization as contributing to acute physiological disturbance, cognitive strain, "
            "and nocturnal sleep architecture fragmentation."
        ),
        "corrective_recommendations": [
            f"Issue immediate notice of non-compliance to the responsible entity for the identified {sound_classification} source.",
            "Mandate deployment of localized acoustic shielding or operational curfew adherence.",
            "Deploy secondary calibrated Class 1 sound meter for continuous 24-hour verification monitoring.",
        ],
        "formal_complaint_letter": (
            f"To: The Competent Authority / Environmental Officer\n"
            f"Subject: Formal Noise Violation Complaint — {zone_category.capitalize()} Zone\n\n"
            f"Sir/Madam,\n"
            f"This dossier registers a verified acoustic exceedance of {measured_db} dB(A) "
            f"(Legal Limit: {threshold_db} dB(A)) recorded at {address or 'the specified location'} on {datetime.now().strftime('%Y-%m-%d %H:%M')}. "
            f"The acoustic signature corresponds to {sound_classification} noise. You are requested to initiate inspection under Rule 4 of the Noise Pollution Rules 2000."
        ),
        "ai_model": "rule_based_fallback",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "is_ai_generated": False,
    }
