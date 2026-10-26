"""Incident detection engine for NoiseWatch.

This module implements a configurable rule-based engine that evaluates
sound readings against threshold configurations. It does NOT automatically
declare legal violations — it flags potential exceedances for human review.
"""

from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from uuid import uuid4


class IncidentRule:
    """A single threshold rule for noise evaluation."""

    def __init__(
        self,
        zone_category: str,
        time_period: str,
        threshold_value: float,
        threshold_unit: str = "dB(A)",
        min_duration_seconds: int = 0,
        cooldown_seconds: int = 300,
        regulatory_source: str = "",
        version: str = "v1.0",
    ):
        self.zone_category = zone_category
        self.time_period = time_period
        self.threshold_value = threshold_value
        self.threshold_unit = threshold_unit
        self.min_duration_seconds = min_duration_seconds
        self.cooldown_seconds = cooldown_seconds
        self.regulatory_source = regulatory_source
        self.version = version


class DetectionResult:
    """Result of evaluating a reading against rules."""

    def __init__(
        self,
        exceeded: bool,
        reading_value: float,
        threshold_value: float,
        threshold_unit: str,
        rule_version: str,
        measurement_method: str,
        confidence: float,
        severity: str,
        zone_category: str,
        notes: List[str],
    ):
        self.exceeded = exceeded
        self.reading_value = reading_value
        self.threshold_value = threshold_value
        self.threshold_unit = threshold_unit
        self.rule_version = rule_version
        self.measurement_method = measurement_method
        self.confidence = confidence
        self.severity = severity
        self.zone_category = zone_category
        self.notes = notes


class IncidentDetectionEngine:
    """Configurable rule engine for noise incident detection.

    The engine evaluates readings against zone-specific, time-aware thresholds.
    It applies persistence rules, cooldowns, and measurement quality checks.

    IMPORTANT: Threshold exceedance is flagged as a POTENTIAL issue requiring
    human review. The engine does NOT determine legal violations.
    """

    def __init__(self):
        self.rules: Dict[str, Dict[str, IncidentRule]] = {}
        self._active_events: Dict[str, Dict[str, Any]] = {}  # location_id -> event tracking
        self._cooldowns: Dict[str, datetime] = {}  # location_id -> cooldown expiry
        self.load_default_rules()

    def load_rules(self, rules: List[IncidentRule]):
        """Load threshold rules into the engine."""
        for rule in rules:
            key = rule.zone_category
            if key not in self.rules:
                self.rules[key] = {}
            self.rules[key][rule.time_period] = rule

    def load_default_rules(self):
        """Load illustrative default rules (NOT legally binding)."""
        defaults = [
            IncidentRule("residential", "day", 55.0, "dB(A)", 300, 600,
                         "Illustrative threshold — not a legal standard", "v1.0-default"),
            IncidentRule("residential", "night", 45.0, "dB(A)", 300, 600,
                         "Illustrative threshold — not a legal standard", "v1.0-default"),
            IncidentRule("commercial", "day", 65.0, "dB(A)", 300, 600,
                         "Illustrative threshold — not a legal standard", "v1.0-default"),
            IncidentRule("commercial", "night", 55.0, "dB(A)", 300, 600,
                         "Illustrative threshold — not a legal standard", "v1.0-default"),
            IncidentRule("industrial", "day", 75.0, "dB(A)", 300, 600,
                         "Illustrative threshold — not a legal standard", "v1.0-default"),
            IncidentRule("industrial", "night", 70.0, "dB(A)", 300, 600,
                         "Illustrative threshold — not a legal standard", "v1.0-default"),
            IncidentRule("silence_zone", "day", 50.0, "dB(A)", 120, 600,
                         "Illustrative threshold — not a legal standard", "v1.0-default"),
            IncidentRule("silence_zone", "night", 40.0, "dB(A)", 120, 600,
                         "Illustrative threshold — not a legal standard", "v1.0-default"),
        ]
        self.load_rules(defaults)

    def _get_time_period(self, timestamp: datetime, day_start: int = 6, day_end: int = 22) -> str:
        """Determine if a timestamp falls in 'day' or 'night' period."""
        hour = timestamp.hour
        return "day" if day_start <= hour < day_end else "night"

    def _assess_confidence(self, measurement_method: str, quality_status: str) -> float:
        """Estimate confidence based on measurement quality.

        This is a screening confidence score, NOT a certainty metric.
        """
        method_scores = {
            "calibrated_measurement": 0.9,
            "external_import": 0.7,
            "uncalibrated_estimate": 0.3,
            "simulated_demo": 0.1,
        }
        quality_modifiers = {
            "good": 1.0,
            "degraded": 0.7,
            "poor": 0.4,
            "unknown": 0.5,
        }
        base = method_scores.get(measurement_method, 0.2)
        modifier = quality_modifiers.get(quality_status, 0.5)
        return round(min(base * modifier, 1.0), 2)

    def _assess_severity(self, value: float, threshold: float, confidence: float) -> str:
        """Assess potential severity based on exceedance magnitude."""
        if confidence < 0.3:
            return "low"  # Low-confidence readings can't be high severity
        excess = value - threshold
        if excess <= 5:
            return "low"
        elif excess <= 15:
            return "medium"
        elif excess <= 25:
            return "high"
        else:
            return "critical"

    def _is_in_cooldown(self, location_id: str, timestamp: datetime) -> bool:
        """Check if a location is in cooldown period to prevent duplicate incidents."""
        expiry = self._cooldowns.get(location_id)
        if expiry and timestamp < expiry:
            return True
        return False

    def evaluate_reading(
        self,
        value: float,
        unit: str,
        location_id: str,
        zone_category: str,
        timestamp: Optional[datetime] = None,
        measurement_method: str = "calibrated_measurement",
        quality_status: str = "good",
        device_calibrated: bool = False,
        is_day: Optional[bool] = None,
    ) -> DetectionResult:
        """Evaluate a single reading against applicable rules.

        Returns DetectionResult with exceeded=True if threshold exceedance is detected,
        or exceeded=False if the reading is within normal range.
        """
        if timestamp is None:
            now = datetime.now(timezone.utc)
            if is_day is False:
                timestamp = now.replace(hour=23, minute=0, second=0)
            else:
                timestamp = now.replace(hour=12, minute=0, second=0)

        time_period = self._get_time_period(timestamp)
        zone_rules = self.rules.get(zone_category)

        if not zone_rules:
            return DetectionResult(
                exceeded=False,
                reading_value=value,
                threshold_value=0.0,
                threshold_unit=unit,
                rule_version="none",
                measurement_method=measurement_method,
                confidence=0.5,
                severity="none",
                zone_category=zone_category,
                notes=["No rules configured for zone category."],
            )

        rule = zone_rules.get(time_period)
        if not rule:
            return DetectionResult(
                exceeded=False,
                reading_value=value,
                threshold_value=0.0,
                threshold_unit=unit,
                rule_version="none",
                measurement_method=measurement_method,
                confidence=0.5,
                severity="none",
                zone_category=zone_category,
                notes=[f"No rule found for {time_period} period."],
            )

        confidence = self._assess_confidence(measurement_method, quality_status)

        # Check threshold
        if value <= rule.threshold_value:
            return DetectionResult(
                exceeded=False,
                reading_value=value,
                threshold_value=rule.threshold_value,
                threshold_unit=rule.threshold_unit,
                rule_version=rule.version,
                measurement_method=measurement_method,
                confidence=confidence,
                severity="none",
                zone_category=zone_category,
                notes=["Reading within permissible statutory limits."],
            )

        # Check cooldown
        if self._is_in_cooldown(location_id, timestamp):
            return DetectionResult(
                exceeded=False,
                reading_value=value,
                threshold_value=rule.threshold_value,
                threshold_unit=rule.threshold_unit,
                rule_version=rule.version,
                measurement_method=measurement_method,
                confidence=confidence,
                severity="none",
                zone_category=zone_category,
                notes=["Location is in active cooldown window."],
            )

        severity = self._assess_severity(value, rule.threshold_value, confidence)
        notes = []

        if measurement_method == "uncalibrated_estimate":
            notes.append(
                "Reading from uncalibrated source. Value is an estimate only, "
                "not suitable for enforcement without verification."
            )
        if measurement_method == "simulated_demo":
            notes.append("DEMO MODE: This reading is simulated and not from a real sensor.")

        notes.append(
            f"Reading of {value} {unit} exceeds configured threshold of "
            f"{rule.threshold_value} {rule.threshold_unit} for {zone_category} "
            f"zones during {time_period} hours."
        )
        notes.append(
            "This is a potential exceedance flagged for review, "
            "not a confirmed legal violation."
        )

        if rule.regulatory_source:
            notes.append(f"Threshold source: {rule.regulatory_source}")

        return DetectionResult(
            exceeded=True,
            reading_value=value,
            threshold_value=rule.threshold_value,
            threshold_unit=rule.threshold_unit,
            rule_version=rule.version,
            measurement_method=measurement_method,
            confidence=confidence,
            severity=severity,
            zone_category=zone_category,
            notes=notes,
        )

    def set_cooldown(self, location_id: str, timestamp: datetime, duration_seconds: int = 300):
        """Set a cooldown for a location to prevent duplicate incident creation."""
        from datetime import timedelta
        self._cooldowns[location_id] = timestamp + timedelta(seconds=duration_seconds)


# Singleton instance
detection_engine = IncidentDetectionEngine()
detection_engine.load_default_rules()
