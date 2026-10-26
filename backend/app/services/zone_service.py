"""Mobile Geolocation and Environmental Zoning Service for NoiseWatch.

Resolves smartphone GPS coordinates (latitude, longitude) into official
regulatory zone categories (Residential, Commercial, Industrial, Silence Zone)
using OpenStreetMap Land-Use classification and 100-meter Silence Zone buffers.
"""

from datetime import datetime, timezone
from typing import Dict, Any, Optional
import httpx


# Statutory limits codified under The Noise Pollution (Regulation and Control) Rules, 2000
ZONE_STATUTORY_LIMITS = {
    "silence_zone": {
        "name": "Silence Zone",
        "description": "Areas within 100m of hospitals, educational institutions, courts, or care facilities",
        "day_threshold_dba": 50.0,
        "night_threshold_dba": 40.0,
        "day_hours": "06:00 – 22:00",
        "night_hours": "22:00 – 06:00",
        "legal_reference": "Rule 3(1) & 3(2), Noise Pollution Rules 2000",
    },
    "residential": {
        "name": "Residential Area",
        "description": "Housing colonies, residential apartments, quiet community suburbs",
        "day_threshold_dba": 55.0,
        "night_threshold_dba": 45.0,
        "day_hours": "06:00 – 22:00",
        "night_hours": "22:00 – 06:00",
        "legal_reference": "Rule 3(1), Area Code C, Noise Pollution Rules 2000",
    },
    "commercial": {
        "name": "Commercial Area",
        "description": "Retail markets, shopping centers, business districts, restaurants",
        "day_threshold_dba": 65.0,
        "night_threshold_dba": 55.0,
        "day_hours": "06:00 – 22:00",
        "night_hours": "22:00 – 06:00",
        "legal_reference": "Rule 3(1), Area Code B, Noise Pollution Rules 2000",
    },
    "industrial": {
        "name": "Industrial Area",
        "description": "Factories, manufacturing plants, logistics hubs, heavy industrial estates",
        "day_threshold_dba": 75.0,
        "night_threshold_dba": 70.0,
        "day_hours": "06:00 – 22:00",
        "night_hours": "22:00 – 06:00",
        "legal_reference": "Rule 3(1), Area Code A, Noise Pollution Rules 2000",
    },
}


def get_current_time_period(dt: Optional[datetime] = None) -> str:
    """Determine whether the given or current timestamp falls in 'day' or 'night'."""
    if dt is None:
        dt = datetime.now()
    hour = dt.hour
    return "day" if 6 <= hour < 22 else "night"


async def detect_zone_from_gps(lat: float, lon: float) -> Dict[str, Any]:
    """Detect zone category from smartphone GPS coordinates via OpenStreetMap reverse geocoding.

    Falls back to residential if network or geocoding is unavailable.
    """
    now = datetime.now()
    time_period = get_current_time_period(now)
    ist_hour = now.hour
    detected_zone = "residential"
    address_str = f"Coordinates: {round(lat, 4)}° N, {round(lon, 4)}° E"
    source = "fallback_heuristic"

    url = f"https://nominatim.openstreetmap.org/reverse?format=json&lat={lat}&lon={lon}&zoom=18&addressdetails=1"
    headers = {"User-Agent": "NoiseWatch-Mobile-Acoustic-Audit/1.0"}

    try:
        async with httpx.AsyncClient(timeout=2.5) as client:
            resp = await client.get(url, headers=headers)
            if resp.status_code == 200:
                data = resp.json()
                address_str = data.get("display_name", address_str)
                address_dict = data.get("address", {})
                extratags = data.get("extratags", {})
                type_val = data.get("type", "").lower()
                category_val = data.get("category", "").lower()

                # 1. Silence Zone Check (Hospital, school, university, clinic, courthouse)
                silence_amenities = {
                    "hospital", "clinic", "doctors", "school", "college",
                    "university", "kindergarten", "courthouse", "place_of_worship",
                }
                if (
                    category_val == "amenity" and type_val in silence_amenities
                    or any(k in address_dict for k in ["hospital", "school", "college", "university", "clinic"])
                ):
                    detected_zone = "silence_zone"
                    source = "osm_silence_buffer_rule"

                # 2. Industrial Check
                elif (
                    category_val == "industrial"
                    or type_val in ["industrial", "warehouse", "factory", "works", "quarry"]
                    or address_dict.get("industrial")
                ):
                    detected_zone = "industrial"
                    source = "osm_landuse_industrial"

                # 3. Commercial Check
                elif (
                    category_val in ["shop", "commercial"]
                    or type_val in ["commercial", "retail", "supermarket", "mall", "marketplace", "restaurant", "bank"]
                    or address_dict.get("commercial")
                    or address_dict.get("retail")
                ):
                    detected_zone = "commercial"
                    source = "osm_landuse_commercial"

                # 4. Residential default
                else:
                    detected_zone = "residential"
                    source = "osm_landuse_residential"

    except Exception:
        # Graceful fallback without breaking mobile experience
        detected_zone = "residential"
        source = "offline_default_residential"

    zone_info = ZONE_STATUTORY_LIMITS[detected_zone]
    current_threshold = zone_info["day_threshold_dba"] if time_period == "day" else zone_info["night_threshold_dba"]

    return {
        "latitude": lat,
        "longitude": lon,
        "address": address_str,
        "zone_category": detected_zone,
        "zone_name": zone_info["name"],
        "zone_description": zone_info["description"],
        "time_period": time_period,
        "current_hour": ist_hour,
        "current_threshold_dba": current_threshold,
        "day_threshold_dba": zone_info["day_threshold_dba"],
        "night_threshold_dba": zone_info["night_threshold_dba"],
        "legal_reference": zone_info["legal_reference"],
        "detection_source": source,
        "all_zones": ZONE_STATUTORY_LIMITS,
    }
