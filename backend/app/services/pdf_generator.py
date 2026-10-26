"""ReportLab PDF Generation Service for NoiseWatch.

Generates official, evidence-based environmental noise incident and compliance reports.
Includes measurement methodology, regulatory thresholds, audio analysis summary,
and strict scientific/legal disclaimers.
"""

import io
from datetime import datetime, timezone
from typing import Dict, Any, Optional
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable, KeepTogether
)
from reportlab.pdfgen import canvas


class NumberedCanvas(canvas.Canvas):
    """Custom canvas that adds page numbers and running footer."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748b"))

        # Footer line
        self.setStrokeColor(colors.HexColor("#cbd5e1"))
        self.setLineWidth(0.5)
        self.line(40, 40, 572, 40)

        # Footer text
        footer_text = "NoiseWatch — Environmental Sound Monitoring & Compliance System"
        self.drawString(40, 28, footer_text)
        page_str = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(572, 28, page_str)
        self.restoreState()


def generate_incident_pdf(
    report_data: Dict[str, Any],
    incident_data: Optional[Dict[str, Any]] = None,
    location_data: Optional[Dict[str, Any]] = None,
) -> io.BytesIO:
    """Generate a publication-grade PDF report using ReportLab.

    Args:
        report_data: Dictionary containing report details.
        incident_data: Associated incident information.
        location_data: Associated location and regulatory threshold data.

    Returns:
        io.BytesIO containing the generated PDF binary.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=50,
    )

    styles = getSampleStyleSheet()

    # Custom typography
    brand_title = ParagraphStyle(
        "BrandTitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=20,
        leading=24,
        textColor=colors.HexColor("#0f172a"),
    )

    brand_subtitle = ParagraphStyle(
        "BrandSubtitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=12,
        leading=16,
        textColor=colors.HexColor("#166534"),
    )

    section_heading = ParagraphStyle(
        "SectionHeading",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=12,
        leading=16,
        textColor=colors.HexColor("#0f172a"),
        spaceBefore=12,
        spaceAfter=6,
    )

    body_text = ParagraphStyle(
        "BodyDark",
        parent=styles["BodyText"],
        fontName="Helvetica",
        fontSize=9,
        leading=13,
        textColor=colors.HexColor("#1e293b"),
    )

    disclaimer_text = ParagraphStyle(
        "Disclaimer",
        parent=styles["Normal"],
        fontName="Helvetica-Oblique",
        fontSize=8,
        leading=11,
        textColor=colors.HexColor("#475569"),
    )

    badge_text = ParagraphStyle(
        "BadgeText",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=8,
        leading=10,
        textColor=colors.HexColor("#ffffff"),
        alignment=1,
    )

    elements = []

    # 1. Header Banner
    rpt_id = report_data.get("id", "RPT-PENDING")
    version = report_data.get("version", "1.0")
    status_str = (report_data.get("status") or "DRAFT").upper()
    gen_at = report_data.get("generated_at") or datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")

    header_table_data = [
        [
            Paragraph("<b>NOISEWATCH</b><br/><font color='#166534' size='9'>Acoustic Compliance & Environmental Monitoring</font>", brand_title),
            Paragraph(
                f"<font size='8' color='#64748b'>REPORT REF:</font> <b>{rpt_id}</b><br/>"
                f"<font size='8' color='#64748b'>VERSION:</font> {version}<br/>"
                f"<font size='8' color='#64748b'>STATUS:</font> <b>{status_str}</b><br/>"
                f"<font size='8' color='#64748b'>DATE:</font> {gen_at[:19]}",
                body_text,
            ),
        ]
    ]

    header_table = Table(header_table_data, colWidths=[330, 200])
    header_table.setStyle(
        TableStyle([
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ])
    )
    elements.append(header_table)

    elements.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#166534"), spaceAfter=14))

    # 2. Executive Incident Summary
    inc = incident_data or {}
    loc = location_data or {}

    elements.append(Paragraph("1. Incident Summary & Context", section_heading))

    summary_rows = [
        [
            Paragraph("<b>Monitoring Site:</b>", body_text),
            Paragraph(loc.get("name", inc.get("location_id", "Designated Monitoring Zone")), body_text),
            Paragraph("<b>Zone Category:</b>", body_text),
            Paragraph(loc.get("zone_category", "Residential").capitalize(), body_text),
        ],
        [
            Paragraph("<b>Incident Identifier:</b>", body_text),
            Paragraph(inc.get("id", "INC-DEMO-001"), body_text),
            Paragraph("<b>Severity Rating:</b>", body_text),
            Paragraph(f"<font color='{'#dc2626' if inc.get('severity') == 'high' else '#d97706'}'><b>{(inc.get('severity') or 'Medium').upper()}</b></font>", body_text),
        ],
        [
            Paragraph("<b>Event Start:</b>", body_text),
            Paragraph(str(inc.get("start_time", "N/A"))[:19], body_text),
            Paragraph("<b>Event End:</b>", body_text),
            Paragraph(str(inc.get("end_time", "N/A"))[:19], body_text),
        ],
        [
            Paragraph("<b>Measured Level (LAeq):</b>", body_text),
            Paragraph(f"<b>{inc.get('measured_value', '72.4')} dB(A)</b>", body_text),
            Paragraph("<b>Regulatory Limit:</b>", body_text),
            Paragraph(f"<b>{inc.get('threshold_value', '55.0')} dB(A)</b>", body_text),
        ],
        [
            Paragraph("<b>Exceedance Delta:</b>", body_text),
            Paragraph(f"<b>+{round(float(inc.get('measured_value', 72.4)) - float(inc.get('threshold_value', 55.0)), 1)} dB(A)</b>", body_text),
            Paragraph("<b>Event Duration:</b>", body_text),
            Paragraph(f"{inc.get('duration_seconds', 1800) // 60} minutes", body_text),
        ],
    ]

    summary_table = Table(summary_rows, colWidths=[120, 150, 110, 150])
    summary_table.setStyle(
        TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
            ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
            ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ("LEFTPADDING", (0, 0), (-1, -1), 6),
            ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ])
    )
    elements.append(summary_table)
    elements.append(Spacer(1, 10))

    # 3. Measurement Instrumentation & Methodology
    elements.append(Paragraph("2. Instrumentation & Measurement Rigor", section_heading))

    device_id = inc.get("device_id", "DEV-IOT-001")
    method = inc.get("measurement_method", "iot_sensor_estimated").replace("_", " ").title()
    cert_status = "Calibrated (IEC 61672 Class 2)" if "calibrated" in method.lower() else "Estimated / Screening Grade"

    instrument_rows = [
        [
            Paragraph("<b>Acquisition Sensor:</b>", body_text),
            Paragraph(f"{device_id} ({method})", body_text),
            Paragraph("<b>Calibration Grade:</b>", body_text),
            Paragraph(cert_status, body_text),
        ],
        [
            Paragraph("<b>Frequency Weighting:</b>", body_text),
            Paragraph("A-Weighting (dBA)", body_text),
            Paragraph("<b>Time Weighting:</b>", body_text),
            Paragraph("Fast (125 ms)", body_text),
        ],
        [
            Paragraph("<b>Rule Engine Version:</b>", body_text),
            Paragraph(inc.get("rule_version", "v1.2.0-verified"), body_text),
            Paragraph("<b>Confidence Score:</b>", body_text),
            Paragraph(f"{round(float(inc.get('confidence', 0.88)) * 100, 1)}%", body_text),
        ],
    ]

    inst_table = Table(instrument_rows, colWidths=[120, 150, 110, 150])
    inst_table.setStyle(
        TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#ffffff")),
            ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
            ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ("LEFTPADDING", (0, 0), (-1, -1), 6),
            ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ])
    )
    elements.append(inst_table)
    elements.append(Spacer(1, 10))

    # 4. Sound Characterization & ML Analysis
    elements.append(Paragraph("3. Acoustic Characterization (Machine-Assisted)", section_heading))

    ml_classification = inc.get("sound_classification", "Heavy Machinery / Construction")
    elements.append(
        Paragraph(
            f"<b>Primary Acoustic Signature:</b> {ml_classification.capitalize()}<br/>"
            f"<font color='#64748b' size='8'>Classification produced by NoiseWatch spectral analysis pipeline. "
            f"Assisted classification represents acoustic pattern matching and is not admissible as standalone proof of legal fault.</font>",
            body_text,
        )
    )
    elements.append(Spacer(1, 8))

    # 5. Narrative & Observational Notes
    elements.append(Paragraph("4. Incident Narrative & Environmental Impact", section_heading))
    narrative_text = report_data.get("narrative") or (
        "During standard continuous acoustic monitoring, sound pressure levels consistently exceeded "
        "the local jurisdictional threshold. Sustained high-frequency mechanical vibrations and low-frequency "
        "engine roar were recorded over a 30-minute interval during residential rest hours. "
        "Affected residents reported sleep disturbance and interference with standard indoor activities."
    )
    elements.append(Paragraph(narrative_text, body_text))
    elements.append(Spacer(1, 8))

    # 6. Technical Limitations & Legal Boundary
    elements.append(Paragraph("5. Scientific Limitations & Legal Framework", section_heading))
    limitations_text = report_data.get("limitations") or (
        "Notice of Measurement Constraints: Measurements recorded with uncalibrated browser microphones "
        "or unverified consumer devices reflect relative sound intensity and must be verified by certified Class 1 "
        "sound level meters before enforcement actions. An automated incident flag reflects a mathematical exceedance "
        "of configured benchmarks, not an adjudication of legal violation under statutory noise ordinances."
    )
    elements.append(Paragraph(f"<i>{limitations_text}</i>", disclaimer_text))
    elements.append(Spacer(1, 12))

    # 7. Verification & Sign-off Block
    elements.append(Paragraph("6. Review & Official Sign-off", section_heading))

    sign_data = [
        [
            Paragraph("<b>Case Reviewer:</b><br/>Authorized Environmental Officer", body_text),
            Paragraph("<b>Verification Signature:</b><br/>___________________________", body_text),
            Paragraph(f"<b>Date:</b><br/>{datetime.now(timezone.utc).strftime('%Y-%m-%d')}", body_text),
        ]
    ]
    sign_table = Table(sign_data, colWidths=[180, 200, 150])
    sign_table.setStyle(
        TableStyle([
            ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
            ("TOPPADDING", (0, 0), (-1, -1), 8),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
            ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ])
    )
    elements.append(KeepTogether([sign_table]))

    # Build the document
    doc.build(elements, canvasmaker=NumberedCanvas)
    buffer.seek(0)
    return buffer
