"""
PDF report generator.
A4 format with logo, metadata, prediction results, keyframes.
Pure in-memory — returns bytes.
"""
import io
import base64
from datetime import datetime
from typing import Optional
import numpy as np
from PIL import Image
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import cm
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (SimpleDocTemplate, Paragraph, Spacer,
                                 Table, TableStyle, Image as RLImage, HRFlowable)
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.colors import HexColor


# Brand colors
C_BG       = HexColor("#0a0f1e")
C_ACCENT   = HexColor("#4a9eff")
C_PURPLE   = HexColor("#7c3aed")
C_RED      = HexColor("#ef4444")
C_ORANGE   = HexColor("#f97316")
C_YELLOW   = HexColor("#eab308")
C_GREEN    = HexColor("#10b981")
C_WHITE    = HexColor("#f0f4ff")
C_GRAY     = HexColor("#64748b")
C_DARK     = HexColor("#1e293b")
C_CRITICAL = HexColor("#ef4444")


SEVERITY_COLOR_MAP = {
    "CLEAR":     C_GREEN,
    "SUSPICIOUS": C_YELLOW,
    "HIGH RISK": C_ORANGE,
    "CRITICAL":  C_RED,
}


def _frame_to_image_flowable(frame_rgb: np.ndarray, width_cm: float = 5.5) -> RLImage:
    img = Image.fromarray(frame_rgb.astype(np.uint8), "RGB")
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=85)
    buf.seek(0)
    w = width_cm * cm
    aspect = img.height / img.width
    return RLImage(buf, width=w, height=w * aspect)


def generate_pdf_report(
    filename: str,
    video_metadata: dict,
    prediction: dict,
    keyframes_rgb: list,
    incident_id: str,
    logo_path: Optional[str] = None,
) -> bytes:
    """
    Generate full A4 PDF report.
    Returns PDF as bytes.
    """
    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf,
        pagesize=A4,
        rightMargin=2*cm,
        leftMargin=2*cm,
        topMargin=2*cm,
        bottomMargin=2*cm,
        title=f"Violence Detection Report — {incident_id}",
    )

    styles = getSampleStyleSheet()
    w, h = A4

    # Custom styles
    title_style = ParagraphStyle("Title", fontSize=20, textColor=C_WHITE,
                                  spaceAfter=4, fontName="Helvetica-Bold", alignment=TA_CENTER)
    sub_style   = ParagraphStyle("Sub",   fontSize=10, textColor=C_GRAY,
                                  spaceAfter=2, fontName="Helvetica", alignment=TA_CENTER)
    h2_style    = ParagraphStyle("H2",    fontSize=13, textColor=C_ACCENT,
                                  spaceBefore=12, spaceAfter=6, fontName="Helvetica-Bold")
    body_style  = ParagraphStyle("Body",  fontSize=10, textColor=C_WHITE,
                                  spaceAfter=4, fontName="Helvetica", leading=16)
    label_style = ParagraphStyle("Label", fontSize=9,  textColor=C_GRAY,
                                  fontName="Helvetica")

    severity_level = prediction["severity"]["level"]
    severity_color = SEVERITY_COLOR_MAP.get(severity_level, C_WHITE)
    is_violence    = prediction["is_violence"]
    timestamp      = datetime.now().strftime("%d %B %Y, %H:%M:%S")

    story = []

    # ── HEADER ──────────────────────────────────────────────────────────────
    if logo_path:
        try:
            logo = RLImage(logo_path, width=2*cm, height=2*cm)
            story.append(logo)
            story.append(Spacer(1, 0.3*cm))
        except Exception:
            pass

    story.append(Paragraph("VIOLENCE DETECTION SYSTEM", title_style))
    story.append(Paragraph("Incident Analysis Report", sub_style))
    story.append(Paragraph(f"Generated: {timestamp}", sub_style))
    story.append(Spacer(1, 0.4*cm))
    story.append(HRFlowable(width="100%", thickness=1, color=C_ACCENT))
    story.append(Spacer(1, 0.5*cm))

    # ── INCIDENT SUMMARY BOX ────────────────────────────────────────────────
    result_text  = "⚠ VIOLENCE DETECTED" if is_violence else "✓ NO VIOLENCE DETECTED"
    result_color = C_RED if is_violence else C_GREEN

    summary_data = [
        [Paragraph("<b>INCIDENT ID</b>", label_style),    Paragraph(incident_id, body_style)],
        [Paragraph("<b>FILE</b>", label_style),            Paragraph(filename, body_style)],
        [Paragraph("<b>RESULT</b>", label_style),
         Paragraph(f'<font color="#{result_color.hexval()[2:]}">{result_text}</font>', body_style)],
        [Paragraph("<b>SEVERITY</b>", label_style),
         Paragraph(f'<font color="#{severity_color.hexval()[2:]}">{severity_level}</font>', body_style)],
        [Paragraph("<b>CONFIDENCE</b>", label_style),
         Paragraph(f'{prediction["violence_confidence"]:.2f}% Violence / {prediction["nonviolence_confidence"]:.2f}% Non-Violence', body_style)],
    ]

    summary_table = Table(summary_data, colWidths=[4.5*cm, 12*cm])
    summary_table.setStyle(TableStyle([
        ("BACKGROUND",   (0, 0), (-1, -1), C_DARK),
        ("ROWBACKGROUNDS",(0,0),(-1,-1), [C_DARK, HexColor("#162032")]),
        ("TEXTCOLOR",    (0, 0), (-1, -1), C_WHITE),
        ("FONTNAME",     (0, 0), (-1, -1), "Helvetica"),
        ("FONTSIZE",     (0, 0), (-1, -1), 10),
        ("PADDING",      (0, 0), (-1, -1), 8),
        ("GRID",         (0, 0), (-1, -1), 0.5, HexColor("#2d3748")),
        ("ROUNDEDCORNERS", [4]),
    ]))
    story.append(summary_table)
    story.append(Spacer(1, 0.6*cm))

    # ── VIDEO METADATA ───────────────────────────────────────────────────────
    story.append(Paragraph("VIDEO METADATA", h2_style))
    story.append(HRFlowable(width="100%", thickness=0.5, color=C_GRAY))
    story.append(Spacer(1, 0.3*cm))

    meta_data = [
        ["Resolution",       f'{video_metadata.get("width","N/A")} × {video_metadata.get("height","N/A")} px'],
        ["Duration",         video_metadata.get("duration_str", "N/A")],
        ["Frame Rate",       f'{video_metadata.get("fps","N/A")} FPS'],
        ["Total Frames",     str(video_metadata.get("total_frames", "N/A"))],
        ["Duration (sec)",   f'{video_metadata.get("duration_seconds","N/A")}s'],
    ]
    meta_table = Table(
        [[Paragraph(f"<b>{r[0]}</b>", label_style), Paragraph(r[1], body_style)] for r in meta_data],
        colWidths=[5*cm, 11.5*cm]
    )
    meta_table.setStyle(TableStyle([
        ("BACKGROUND",    (0, 0), (-1, -1), C_DARK),
        ("ROWBACKGROUNDS",(0,0),(-1,-1),[C_DARK, HexColor("#162032")]),
        ("GRID",          (0, 0), (-1, -1), 0.5, HexColor("#2d3748")),
        ("PADDING",       (0, 0), (-1, -1), 7),
        ("FONTSIZE",      (0, 0), (-1, -1), 10),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 0.6*cm))

    # ── MODEL DETAILS ────────────────────────────────────────────────────────
    story.append(Paragraph("MODEL DETAILS", h2_style))
    story.append(HRFlowable(width="100%", thickness=0.5, color=C_GRAY))
    story.append(Spacer(1, 0.3*cm))

    model_data = [
        ["Architecture",   prediction.get("architecture", "CNN + LSTM")],
        ["Backbone",       prediction.get("backbone", "MobileNetV2")],
        ["Input Shape",    str(prediction.get("model_input_shape", [1,30,128,128,3]))],
        ["Threshold Used", f'{prediction.get("threshold_used", 50.0)}%'],
        ["Frames Sampled", "90 (uniform across full video)"],
        ["Frames Used",    "30 (uniform from pool)"],
    ]
    model_table = Table(
        [[Paragraph(f"<b>{r[0]}</b>", label_style), Paragraph(r[1], body_style)] for r in model_data],
        colWidths=[5*cm, 11.5*cm]
    )
    model_table.setStyle(TableStyle([
        ("BACKGROUND",    (0, 0), (-1, -1), C_DARK),
        ("ROWBACKGROUNDS",(0,0),(-1,-1),[C_DARK, HexColor("#162032")]),
        ("GRID",          (0, 0), (-1, -1), 0.5, HexColor("#2d3748")),
        ("PADDING",       (0, 0), (-1, -1), 7),
        ("FONTSIZE",      (0, 0), (-1, -1), 10),
    ]))
    story.append(model_table)
    story.append(Spacer(1, 0.6*cm))

    # ── PREDICTION RESULTS ───────────────────────────────────────────────────
    story.append(Paragraph("PREDICTION RESULTS", h2_style))
    story.append(HRFlowable(width="100%", thickness=0.5, color=C_GRAY))
    story.append(Spacer(1, 0.3*cm))

    pred_data = [
        ["Classification",       prediction["class_name"]],
        ["Violence Confidence",  f'{prediction["violence_confidence"]:.4f}%'],
        ["Non-Violence Conf.",   f'{prediction["nonviolence_confidence"]:.4f}%'],
        ["Severity Level",       severity_level],
    ]
    pred_table = Table(
        [[Paragraph(f"<b>{r[0]}</b>", label_style), Paragraph(r[1], body_style)] for r in pred_data],
        colWidths=[5*cm, 11.5*cm]
    )
    pred_table.setStyle(TableStyle([
        ("BACKGROUND",    (0, 0), (-1, -1), C_DARK),
        ("ROWBACKGROUNDS",(0,0),(-1,-1),[C_DARK, HexColor("#162032")]),
        ("GRID",          (0, 0), (-1, -1), 0.5, HexColor("#2d3748")),
        ("PADDING",       (0, 0), (-1, -1), 7),
        ("FONTSIZE",      (0, 0), (-1, -1), 10),
    ]))
    story.append(pred_table)
    story.append(Spacer(1, 0.6*cm))

    # ── KEYFRAMES ────────────────────────────────────────────────────────────
    if keyframes_rgb:
        story.append(Paragraph("KEY FRAMES (Top Detected Frames)", h2_style))
        story.append(HRFlowable(width="100%", thickness=0.5, color=C_GRAY))
        story.append(Spacer(1, 0.3*cm))
        story.append(Paragraph(
            "The following frames were identified as most significant during analysis.",
            body_style
        ))
        story.append(Spacer(1, 0.3*cm))

        # 3 frames per row
        frame_images = [_frame_to_image_flowable(f, width_cm=5.0) for f in keyframes_rgb[:6]]
        rows = [frame_images[i:i+3] for i in range(0, len(frame_images), 3)]
        for row in rows:
            # Pad row to 3 cols
            while len(row) < 3:
                row.append(Spacer(5*cm, 3*cm))
            t = Table([row], colWidths=[5.5*cm, 5.5*cm, 5.5*cm])
            t.setStyle(TableStyle([
                ("ALIGN",   (0,0),(-1,-1), "CENTER"),
                ("VALIGN",  (0,0),(-1,-1), "MIDDLE"),
                ("PADDING", (0,0),(-1,-1), 4),
                ("BACKGROUND",(0,0),(-1,-1), C_DARK),
                ("GRID",    (0,0),(-1,-1), 0.5, HexColor("#2d3748")),
            ]))
            story.append(t)
            story.append(Spacer(1, 0.2*cm))

    story.append(Spacer(1, 0.5*cm))

    # ── FOOTER ──────────────────────────────────────────────────────────────
    story.append(HRFlowable(width="100%", thickness=0.5, color=C_GRAY))
    story.append(Spacer(1, 0.2*cm))
    story.append(Paragraph(
        "Generated by Violence Detection System · Confidential · For authorized use only",
        ParagraphStyle("Footer", fontSize=8, textColor=C_GRAY, alignment=TA_CENTER)
    ))

    doc.build(story)
    buf.seek(0)
    return buf.read()