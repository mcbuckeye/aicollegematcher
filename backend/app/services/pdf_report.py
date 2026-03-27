"""
Generate PDF match report using reportlab.
"""
import io
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable,
)


NAVY = colors.HexColor("#1E3A5F")
GOLD = colors.HexColor("#D4A843")
LIGHT_GRAY = colors.HexColor("#F5F1EB")


def _fmt_currency(v):
    if v is None:
        return "N/A"
    return f"${v:,}"


def _fmt_pct(v):
    if v is None:
        return "N/A"
    if 0 < v <= 1:
        return f"{v * 100:.1f}%"
    return f"{v:.0f}%"


def generate_pdf_report(assessment: dict, results: dict) -> bytes:
    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf,
        pagesize=letter,
        leftMargin=0.75 * inch,
        rightMargin=0.75 * inch,
        topMargin=0.75 * inch,
        bottomMargin=0.75 * inch,
    )

    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(
        "Title2", parent=styles["Title"], fontSize=20, textColor=NAVY, spaceAfter=6,
    ))
    styles.add(ParagraphStyle(
        "SubTitle", parent=styles["Normal"], fontSize=12, textColor=colors.gray, spaceAfter=18,
    ))
    styles.add(ParagraphStyle(
        "SectionHead", parent=styles["Heading2"], fontSize=14, textColor=NAVY,
        spaceBefore=16, spaceAfter=8, borderPadding=(0, 0, 4, 0),
    ))
    styles.add(ParagraphStyle(
        "SchoolName", parent=styles["Heading3"], fontSize=12, textColor=NAVY, spaceAfter=2,
    ))
    styles.add(ParagraphStyle(
        "SmallText", parent=styles["Normal"], fontSize=9, textColor=colors.gray,
    ))

    story = []

    # Header
    story.append(Paragraph("AI College Matcher", styles["Title2"]))
    story.append(Paragraph("Your Personalized College Match Report", styles["SubTitle"]))
    story.append(HRFlowable(width="100%", thickness=2, color=GOLD))
    story.append(Spacer(1, 12))

    # Readiness Score
    score = results.get("readiness_score", 0)
    percentile = results.get("percentile", 0)
    story.append(Paragraph("Your Readiness Score", styles["SectionHead"]))
    score_data = [[
        Paragraph(f"<b>{score}</b> / 100", styles["Normal"]),
        Paragraph(f"Top <b>{percentile}%</b> of students", styles["Normal"]),
    ]]
    score_table = Table(score_data, colWidths=[2.5 * inch, 3 * inch])
    score_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), LIGHT_GRAY),
        ("TEXTCOLOR", (0, 0), (-1, -1), NAVY),
        ("FONTSIZE", (0, 0), (-1, -1), 14),
        ("TOPPADDING", (0, 0), (-1, -1), 10),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
        ("LEFTPADDING", (0, 0), (-1, -1), 12),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("BOX", (0, 0), (-1, -1), 1, NAVY),
    ]))
    story.append(score_table)
    story.append(Spacer(1, 8))

    # Student Profile Summary
    story.append(Paragraph("Your Profile", styles["SectionHead"]))
    profile_rows = []
    field_labels = [
        ("grade", "Grade"), ("gpa", "GPA"), ("test_scores", "Test Scores"),
        ("major", "Intended Major"), ("budget", "Budget"),
        ("school_size", "Preferred Size"), ("distance", "Distance Preference"),
        ("zip_code", "Zip Code"),
    ]
    for key, label in field_labels:
        val = assessment.get(key)
        if val:
            profile_rows.append([
                Paragraph(f"<b>{label}</b>", styles["Normal"]),
                Paragraph(str(val), styles["Normal"]),
            ])

    priorities = assessment.get("priorities", [])
    if priorities:
        profile_rows.append([
            Paragraph("<b>Priorities</b>", styles["Normal"]),
            Paragraph(", ".join(priorities), styles["Normal"]),
        ])

    must_haves = assessment.get("must_haves", [])
    if must_haves:
        profile_rows.append([
            Paragraph("<b>Must-Haves</b>", styles["Normal"]),
            Paragraph(", ".join(must_haves), styles["Normal"]),
        ])

    if profile_rows:
        profile_table = Table(profile_rows, colWidths=[2 * inch, 4.5 * inch])
        profile_table.setStyle(TableStyle([
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ("LINEBELOW", (0, 0), (-1, -2), 0.5, colors.lightgrey),
        ]))
        story.append(profile_table)

    # Strengths & Areas to Improve
    strengths = results.get("strengths", [])
    areas = results.get("areas_to_improve", [])
    if strengths or areas:
        story.append(Spacer(1, 8))
        story.append(Paragraph("Strengths & Areas to Improve", styles["SectionHead"]))
        sa_data = []
        max_len = max(len(strengths), len(areas))
        for i in range(max_len):
            s = strengths[i] if i < len(strengths) else ""
            a = areas[i] if i < len(areas) else ""
            sa_data.append([
                Paragraph(f"+ {s}" if s else "", styles["Normal"]),
                Paragraph(f"- {a}" if a else "", styles["Normal"]),
            ])
        sa_table = Table(
            [[Paragraph("<b>Strengths</b>", styles["Normal"]),
              Paragraph("<b>Areas to Improve</b>", styles["Normal"])]] + sa_data,
            colWidths=[3.25 * inch, 3.25 * inch],
        )
        sa_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), LIGHT_GRAY),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ("LINEBELOW", (0, 0), (-1, -1), 0.5, colors.lightgrey),
        ]))
        story.append(sa_table)

    # Top Matched Schools
    story.append(Spacer(1, 12))
    story.append(Paragraph("Your Top Matched Schools", styles["SectionHead"]))
    story.append(HRFlowable(width="100%", thickness=1, color=GOLD))
    story.append(Spacer(1, 8))

    matches = results.get("top_matches", [])[:10]
    for i, match in enumerate(matches):
        school = match.get("school", {})
        score_val = match.get("match_score", 0)
        reason = match.get("reason", "")
        category = match.get("category", "")

        name = school.get("name", "Unknown")
        city = school.get("city", "")
        state = school.get("state", "")
        location = f"{city}, {state}" if city and state else ""

        story.append(Paragraph(
            f"{i + 1}. {name} &mdash; <font color='#D4A843'><b>{score_val}% match</b></font>"
            f"  <font color='gray' size='9'>({category.replace('-', ' ').title()})</font>",
            styles["SchoolName"],
        ))
        if location:
            story.append(Paragraph(location, styles["SmallText"]))

        # Stats row
        stats_data = [[
            Paragraph(f"<b>Acceptance:</b> {_fmt_pct(school.get('acceptance_rate'))}", styles["SmallText"]),
            Paragraph(f"<b>Tuition:</b> {_fmt_currency(school.get('tuition'))}", styles["SmallText"]),
            Paragraph(f"<b>Grad Rate:</b> {_fmt_pct(school.get('graduation_rate'))}", styles["SmallText"]),
            Paragraph(f"<b>Earnings (10yr):</b> {_fmt_currency(school.get('median_earnings_10yr'))}", styles["SmallText"]),
        ]]
        stats_table = Table(stats_data, colWidths=[1.6 * inch, 1.6 * inch, 1.6 * inch, 1.7 * inch])
        stats_table.setStyle(TableStyle([
            ("TOPPADDING", (0, 0), (-1, -1), 2),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
        ]))
        story.append(stats_table)

        if reason:
            story.append(Paragraph(f"<i>{reason}</i>", styles["SmallText"]))
        story.append(Spacer(1, 10))

    # Footer
    story.append(Spacer(1, 20))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.lightgrey))
    story.append(Spacer(1, 6))
    story.append(Paragraph(
        "Generated by AI College Matcher &bull; aicollegematcher.com",
        ParagraphStyle("Footer", parent=styles["Normal"], fontSize=8, textColor=colors.gray, alignment=1),
    ))

    doc.build(story)
    return buf.getvalue()
