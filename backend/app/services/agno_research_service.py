"""Agno-Powered Indian Environmental Legal Intelligence & Internet Research Service.

Customized exclusively for INDIA:
- Central Pollution Control Board (CPCB) & MoEFCC Standards
- The Noise Pollution (Regulation and Control) Rules, 2000
- Environment (Protection) Act, 1986 (Sec 15 penalties)
- Article 21 of Constitution of India (Right to peaceful sleep & environment)
- Police Emergency (112 / 100) and Municipal Corporation Grievance Portals
"""

import os
import re
import json
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
import httpx
from bs4 import BeautifulSoup

from agno.agent import Agent
from agno.models.groq import Groq
from app.core.config import settings

logger = logging.getLogger(__name__)

USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"

# Known Indian Municipal Corporations & Grievance Channels for major cities
INDIAN_MUNICIPAL_DIRECTORY = {
    "mumbai": {
        "corporation": "Brihanmumbai Municipal Corporation (BMC)",
        "helpline": "1916 / Dial 100 / 112 (Mumbai Police)",
        "spcb": "Maharashtra Pollution Control Board (MPCB)",
        "portal": "https://portal.mcgm.gov.in / Mumbai Police Citizen Portal",
    },
    "pune": {
        "corporation": "Pune Municipal Corporation (PMC)",
        "helpline": "1800 1030 222 / Dial 112",
        "spcb": "Maharashtra Pollution Control Board (MPCB)",
        "portal": "https://pmc.gov.in / PMC Care App",
    },
    "bengaluru": {
        "corporation": "Bruhat Bengaluru Mahanagara Palike (BBMP)",
        "helpline": "1533 / 080-22660000 / Dial 112",
        "spcb": "Karnataka State Pollution Control Board (KSPCB)",
        "portal": "https://bbmp.gov.in / Sahaaya Grievance App",
    },
    "delhi": {
        "corporation": "Municipal Corporation of Delhi (MCD)",
        "helpline": "155255 / Dial 112 / Green Delhi App Helpline",
        "spcb": "Delhi Pollution Control Committee (DPCC)",
        "portal": "https://mcdonline.nic.in / Green Delhi Citizen Portal",
    },
    "hyderabad": {
        "corporation": "Greater Hyderabad Municipal Corporation (GHMC)",
        "helpline": "040-21111111 / Dial 100 / 112",
        "spcb": "Telangana State Pollution Control Board (TGSPCB)",
        "portal": "https://www.ghmc.gov.in / MyGHMC App",
    },
    "chennai": {
        "corporation": "Greater Chennai Corporation (GCC)",
        "helpline": "1913 / Dial 112",
        "spcb": "Tamil Nadu Pollution Control Board (TNPCB)",
        "portal": "https://chennaicorporation.gov.in / Namma Chennai App",
    },
    "kolkata": {
        "corporation": "Kolkata Municipal Corporation (KMC)",
        "helpline": "1800 345 3375 / Dial 100 / 112",
        "spcb": "West Bengal Pollution Control Board (WBPCB)",
        "portal": "https://www.kmcgov.in / Paray Samadhan",
    },
    "ahmedabad": {
        "corporation": "Ahmedabad Municipal Corporation (AMC)",
        "helpline": "155303 / Dial 112",
        "spcb": "Gujarat Pollution Control Board (GPCB)",
        "portal": "https://ahmedabadcity.gov.in",
    },
}


def search_indian_environmental_regulations(query: str) -> str:
    """Search the internet for real-time Indian environmental regulations,

    municipal bylaws, State Pollution Control Board (SPCB) circulars,
    police helplines, and National Green Tribunal (NGT) orders.

    Args:
        query: Search query string (automatically scoped to India)
    """
    # Ensure query targets Indian regulatory and municipal context
    scoped_query = f"{query} India CPCB pollution rules"
    logger.info("Agno searching web for Indian context: %s", scoped_query)
    results = []

    # 1. DuckDuckGo Lite search
    try:
        with httpx.Client(timeout=6.0, follow_redirects=True) as client:
            resp = client.post(
                "https://lite.duckduckgo.com/lite/",
                data={"q": scoped_query},
                headers={"User-Agent": USER_AGENT},
            )
            if resp.status_code == 200:
                soup = BeautifulSoup(resp.text, "html.parser")
                rows = soup.find_all("tr")
                current_link = None
                current_title = None

                for tr in rows:
                    link_elem = tr.find("a", class_="result-link")
                    snippet_elem = tr.find("td", class_="result-snippet")

                    if link_elem:
                        current_link = link_elem.get("href")
                        current_title = link_elem.get_text(strip=True)
                    elif snippet_elem and current_link:
                        snippet_text = snippet_elem.get_text(strip=True)
                        results.append(
                            f"Title: {current_title}\nURL: {current_link}\nExcerpt: {snippet_text}"
                        )
                        current_link = None
                        current_title = None
                        if len(results) >= 4:
                            break
    except Exception as e:
        logger.warning("DuckDuckGo Lite search error: %s", e)

    # 2. DuckDuckGo Instant Answer API fallback
    if not results:
        try:
            with httpx.Client(timeout=5.0) as client:
                resp = client.get(
                    "https://api.duckduckgo.com/",
                    params={"q": scoped_query, "format": "json"},
                    headers={"User-Agent": USER_AGENT},
                )
                if resp.status_code == 200:
                    data = resp.json()
                    abstract = data.get("AbstractText")
                    abstract_url = data.get("AbstractURL")
                    if abstract:
                        results.append(
                            f"Title: {data.get('Heading', 'Summary')}\nURL: {abstract_url}\nExcerpt: {abstract}"
                        )
        except Exception as e:
            logger.warning("DuckDuckGo Instant Answer API error: %s", e)

    # 3. Wikipedia API fallback for Indian statutory acts
    if not results:
        try:
            with httpx.Client(timeout=5.0) as client:
                resp = client.get(
                    "https://en.wikipedia.org/w/api.php",
                    params={
                        "action": "query",
                        "list": "search",
                        "srsearch": f"Noise pollution India CPCB rules {query}",
                        "format": "json",
                    },
                    headers={"User-Agent": "NoiseWatchLegalBot/1.0 (contact@noisewatch.org)"},
                )
                if resp.status_code == 200:
                    search_items = resp.json().get("query", {}).get("search", [])
                    for item in search_items[:2]:
                        clean_snippet = re.sub(r"<[^>]+>", "", item.get("snippet", ""))
                        title = item.get("title")
                        url = f"https://en.wikipedia.org/wiki/{title.replace(' ', '_')}"
                        results.append(
                            f"Title: {title} (Wikipedia India)\nURL: {url}\nExcerpt: {clean_snippet}"
                        )
        except Exception as e:
            logger.warning("Wikipedia API fallback error: %s", e)

    if not results:
        return (
            "Statutory Indian Reference: Under Rule 3(1) of The Noise Pollution (Regulation and Control) Rules, 2000, "
            "promulgated by the Ministry of Environment, Forest and Climate Change (MoEFCC), Government of India, "
            "ambient air quality standards in respect of noise must not exceed prescribed day/night limits. "
            "Report non-compliance to local police via Emergency Response Support System (ERSS) 112 or PCR 100."
        )

    return "\n\n---\n\n".join(results)


def get_indian_cpcb_limits(zone_type: str = "residential") -> str:
    """Return the official statutory Day and Night decibel limits under Central Pollution Control Board (CPCB) India.

    Args:
        zone_type: One of 'residential', 'commercial', 'industrial', 'silence_zone'
    """
    schedule = {
        "silence_zone": (
            "Silence Zone (CPCB India):\n"
            "- Day Limit (06:00 to 22:00): 50 dB(A) Leq\n"
            "- Night Limit (22:00 to 06:00): 40 dB(A) Leq\n"
            "- Statutory Condition: Area comprising not less than 100 metres around hospitals, educational institutions, "
            "courts, and religious places. Use of vehicular horns, construction equipment, bursting of firecrackers, "
            "and sound amplifiers is strictly prohibited at all times (Rule 6)."
        ),
        "residential": (
            "Residential Zone (CPCB India):\n"
            "- Day Limit (06:00 to 22:00): 55 dB(A) Leq\n"
            "- Night Limit (22:00 to 06:00): 45 dB(A) Leq\n"
            "- Curfew: Complete ban on loudspeakers and public address systems between 10:00 PM and 06:00 AM under Rule 5(1). "
            "Blowing of horns prohibited at night except in emergency."
        ),
        "commercial": (
            "Commercial Zone (CPCB India):\n"
            "- Day Limit (06:00 to 22:00): 65 dB(A) Leq\n"
            "- Night Limit (22:00 to 06:00): 55 dB(A) Leq\n"
            "- Curfew: Ambient sound must be contained within commercial premises. DG sets must possess acoustic enclosures."
        ),
        "industrial": (
            "Industrial Zone (CPCB India):\n"
            "- Day Limit (06:00 to 22:00): 75 dB(A) Leq\n"
            "- Night Limit (22:00 to 06:00): 70 dB(A) Leq\n"
            "- Statutory Condition: Factory premises boundary noise must not bleed excessively into adjacent zones."
        ),
    }
    key = zone_type.lower().replace(" ", "_")
    return schedule.get(key, schedule["residential"])


def get_city_municipal_directory(city_name: str) -> str:
    """Lookup verified Indian municipal corporations, helplines, and portals."""
    city_lower = (city_name or "").lower().strip()
    for key, data in INDIAN_MUNICIPAL_DIRECTORY.items():
        if key in city_lower:
            return (
                f"Verified Directory for {city_name.upper()}, INDIA:\n"
                f"- Competent Municipal Body: {data['corporation']}\n"
                f"- Emergency/Grievance Helpline: {data['helpline']}\n"
                f"- Regulatory Authority: {data['spcb']}\n"
                f"- Citizen Portal: {data['portal']}"
            )
    return (
        f"General Indian Municipal Procedure for {city_name.title()}:\n"
        f"- Competent Local Body: Local Municipal Corporation / Nagar Nigam / Municipal Council\n"
        f"- Emergency Response: Dial 112 (National ERSS) or 100 (Police Control Room)\n"
        f"- State Authority: Respective State Pollution Control Board (SPCB)\n"
        f"- Public Nuisance Complaint: Under Section 133 CrPC / Bharatiya Nagarik Suraksha Sanhita (BNSS)"
    )


def create_indian_agno_agent() -> Agent:
    """Initialize an Agno Agent equipped with Groq LLM and Indian legal research tools."""
    api_key = settings.groq_api_key or os.getenv("GROQ_API_KEY")
    model = settings.groq_model or "qwen/qwen3.8-27b"

    agent = Agent(
        model=Groq(id=model, api_key=api_key),
        tools=[
            search_indian_environmental_regulations,
            get_indian_cpcb_limits,
            get_city_municipal_directory,
        ],
        instructions=[
            "You are a Senior Indian Environmental Law & Acoustic Compliance Intelligence Officer for NoiseWatch.",
            "You operate exclusively within the jurisdiction of the Republic of India.",
            "All regulations, statutory threshold limits, government authorities, and legal citations MUST be Indian:",
            "  1. The Noise Pollution (Regulation and Control) Rules, 2000 (Ministry of Environment, Forest and Climate Change - MoEFCC)",
            "  2. Central Pollution Control Board (CPCB) Ambient Air Quality Standards in respect of Noise",
            "  3. Environment (Protection) Act, 1986 (Section 15: imprisonment up to 5 years / fine up to ₹1 Lakh)",
            "  4. Article 21 of the Constitution of India (Right to peaceful sleep and pollution-free life)",
            "  5. Section 133 CrPC / Bharatiya Nagarik Suraksha Sanhita (BNSS) for conditional order for removal of public nuisance",
            "  6. Emergency numbers: Dial 112 (ERSS India) and 100 (Police Control Room)",
            "Do NOT reference EPA (USA), DEFRA (UK), or European standards. This system is strictly for INDIA.",
            "Use `search_indian_environmental_regulations` to retrieve live city circulars or NGT judgments, "
            "and `get_city_municipal_directory` to cite the actual Indian municipal corporation and helpline.",
        ],
        markdown=True,
    )
    return agent


async def research_local_bylaws(
    city: str,
    state: str,
    zone_type: str = "residential",
    sound_category: str = "traffic",
) -> Dict[str, Any]:
    """Research Indian municipal rules, helplines, and legal precedents using Agno with internet access."""
    agent = create_indian_agno_agent()

    query_prompt = f"""
Research Indian noise pollution regulations, municipal bylaws, and reporting mechanisms for:
- City/Locality: {city}, India
- State: {state}, India
- CPCB Zone Category: {zone_type}
- Noise Source Classification: {sound_category}

Use `get_city_municipal_directory` and `search_indian_environmental_regulations` to provide:
1. **Competent Indian Local Authority & Helplines** (e.g., Municipal Corporation, Nodal Police Officer, 112/100, SPCB).
2. **CPCB Statutory Decibel Limits & Curfews** (Rule 3 and Rule 5(1) 10:00 PM to 06:00 AM loudspeaker curfew).
3. **Penal & Judicial Remedies in India** (Environment Protection Act 1986 Sec 15, Sec 133 CrPC / BNSS, Article 21).
4. **Relevant National Green Tribunal (NGT) or High Court Directives** for {state}.
5. **Verified Online Government & Legal References** (URLs found).

Respond in clear, professional markdown.
"""

    try:
        response = agent.run(query_prompt)
        content = response.content if hasattr(response, "content") else str(response)

        found_urls = re.findall(r"https?://[^\s\)\>]+", content)
        clean_urls = list(dict.fromkeys(found_urls))[:5]
        if not clean_urls:
            clean_urls = [
                "https://cpcb.nic.in/displaypdf.php?id=Tm9pc2VfUG9sbHV0aW9uX1J1bGVzLnBkZg==",
                "https://moef.gov.in",
            ]

        return {
            "success": True,
            "city": city,
            "state": state,
            "country": "India",
            "zone_type": zone_type,
            "sound_category": sound_category,
            "research_report": content,
            "verified_urls": clean_urls,
            "agent_framework": "Agno 2.6.4 + Groq LLM (India Legal Protocol)",
            "researched_at": datetime.now(timezone.utc).isoformat(),
        }
    except Exception as e:
        logger.error("Agno research agent error: %s", e)
        limits_text = get_indian_cpcb_limits(zone_type)
        dir_text = get_city_municipal_directory(city)
        return {
            "success": False,
            "city": city,
            "state": state,
            "country": "India",
            "error": str(e),
            "research_report": (
                f"### Statutory Baseline for {city}, {state} (INDIA)\n\n"
                f"{limits_text}\n\n"
                f"#### Municipal Reporting Protocol:\n{dir_text}\n\n"
                f"**Legal Basis**: The Noise Pollution (Regulation and Control) Rules, 2000. "
                f"Violations carry penalties under Section 15 of the Environment (Protection) Act, 1986."
            ),
            "verified_urls": [
                "https://cpcb.nic.in/displaypdf.php?id=Tm9pc2VfUG9sbHV0aW9uX1J1bGVzLnBkZg=="
            ],
            "agent_framework": "Agno Fallback Engine (India CPCB Standards)",
            "researched_at": datetime.now(timezone.utc).isoformat(),
        }


async def enhance_complaint_with_agno(
    city: str,
    state: str,
    zone_type: str,
    measured_db: float,
    threshold_db: float,
    sound_category: str,
    confidence: float,
    address: str = "",
) -> Dict[str, Any]:
    """Generates an enhanced court-admissible legal dossier under Indian law incorporating live Agno research."""
    agent = create_indian_agno_agent()
    excess = round(max(0.0, measured_db - threshold_db), 1)

    prompt = f"""
A noise pollution incident has been captured via mobile acoustic telemetry in INDIA:
- Location / Address: {address or f"{city}, {state}, India"}
- CPCB Zone Category: {zone_type.upper()}
- Measured Sound Pressure Level: {measured_db} dB(A) Leq
- Statutory Limit under Noise Rules 2000: {threshold_db} dB(A) (Exceedance: +{excess} dB(A))
- AI Acoustic Signature: {sound_category.upper()} ({round(confidence * 100, 1)}% confidence)

Use `get_city_municipal_directory` and `search_indian_environmental_regulations` to prepare:
1. **LIVE REGULATORY INTELLIGENCE (INDIA)**
   - Name of Municipal Body & Nodal Officer for {city}
   - Local Police helpline (112 / 100) and grievance mechanism
   - Specific statutory curfew breaches (Rule 3 and Rule 5)

2. **FORMAL LEGAL COMPLAINT LETTER (INDIAN JURISDICTION)**
   - Addressed to: The Commissioner of Police / Municipal Commissioner / Member Secretary, State Pollution Control Board
   - Subject: Formal Grievance regarding Hazardous Noise Level Exceedance under The Noise Pollution (Regulation and Control) Rules, 2000 and Section 133 CrPC / BNSS
   - Citations: Rule 3(1), Rule 5(1), Section 15 of Environment (Protection) Act 1986, and Article 21
   - Demand for immediate site inspection, sound level meter calibration verification, and seizure of illegal sound equipment under Rule 8.

Ensure the complaint is ready for filing by an Indian citizen.
"""

    try:
        response = agent.run(prompt)
        content = response.content if hasattr(response, "content") else str(response)

        found_urls = re.findall(r"https?://[^\s\)\>]+", content)
        clean_urls = list(dict.fromkeys(found_urls))[:5]
        if not clean_urls:
            clean_urls = [
                "https://cpcb.nic.in/displaypdf.php?id=Tm9pc2VfUG9sbHV0aW9uX1J1bGVzLnBkZg=="
            ]

        return {
            "success": True,
            "dossier": content,
            "verified_urls": clean_urls,
            "country": "India",
            "agent_framework": "Agno Agent (with Groq & Internet Search - India Protocol)",
            "generated_at": datetime.now(timezone.utc).isoformat(),
        }
    except Exception as e:
        logger.error("Agno complaint dossier error: %s", e)
        return {
            "success": False,
            "error": str(e),
            "country": "India",
            "dossier": (
                f"FORMAL COMPLAINT UNDER INDIAN LAW\n"
                f"To: The Competent Authority / Nodal Officer, {city}, {state}\n"
                f"Location: {address}\n"
                f"Acoustic Exceedance: Measured {measured_db} dB(A) against CPCB limit of {threshold_db} dB(A) (+{excess} dB(A)).\n"
                f"Statutory Breach: The Noise Pollution (Regulation and Control) Rules, 2000 and Environment Protection Act 1986 Section 15.\n"
                f"Emergency Reporting: Dial 112 / 100 immediately."
            ),
            "verified_urls": [
                "https://cpcb.nic.in/displaypdf.php?id=Tm9pc2VfUG9sbHV0aW9uX1J1bGVzLnBkZg=="
            ],
            "agent_framework": "Agno Fallback Engine",
            "generated_at": datetime.now(timezone.utc).isoformat(),
        }
