"""Email delivery via SMTP2Go REST API."""

import os
import base64
import logging
import requests

logger = logging.getLogger(__name__)

SMTP2GO_API_KEY = os.getenv("SMTP2GO_API_KEY", "")
FROM_EMAIL = os.getenv("FROM_EMAIL", "noreply@aicollegematcher.machomelab.com")
FROM_NAME = "AI College Matcher"
API_URL = "https://api.smtp2go.com/v3/email/send"


def send_email(
    to: str,
    subject: str,
    html_body: str,
    text_body: str | None = None,
    attachments: list[dict] | None = None,
) -> bool:
    """Send an email via SMTP2Go. Returns True on success."""
    if not SMTP2GO_API_KEY:
        logger.warning(f"SMTP2GO_API_KEY not set — skipping email to {to}: {subject}")
        return False

    payload: dict = {
        "api_key": SMTP2GO_API_KEY,
        "to": [to],
        "sender": f"{FROM_NAME} <{FROM_EMAIL}>",
        "subject": subject,
        "html_body": html_body,
    }

    if text_body:
        payload["text_body"] = text_body

    if attachments:
        payload["attachments"] = attachments

    try:
        resp = requests.post(API_URL, json=payload, timeout=10)
        data = resp.json()
        if resp.status_code == 200 and data.get("data", {}).get("succeeded", 0) > 0:
            logger.info(f"Email sent to {to}: {subject}")
            return True
        else:
            logger.error(f"SMTP2Go error for {to}: {data}")
            return False
    except Exception as e:
        logger.error(f"Email send failed for {to}: {e}")
        return False


def send_email_with_attachment(
    to: str,
    subject: str,
    html_body: str,
    text_body: str | None,
    filename: str,
    file_bytes: bytes,
    mimetype: str = "application/pdf",
) -> bool:
    """Send email with a file attachment (e.g. PDF report)."""
    attachments = [{
        "filename": filename,
        "fileblob": base64.b64encode(file_bytes).decode("utf-8"),
        "mimetype": mimetype,
    }]
    return send_email(to, subject, html_body, text_body, attachments=attachments)


# --- Convenience wrappers (called from background tasks) ---

def send_welcome_email(user_email: str, name: str | None = None):
    from .email_templates import welcome_email
    subject, html, text = welcome_email(user_email, name)
    send_email(user_email, subject, html, text)


def send_assessment_results_email(user_email: str, readiness_score: int, top_matches: list):
    from .email_templates import assessment_results_email
    subject, html, text = assessment_results_email(user_email, readiness_score, top_matches)
    send_email(user_email, subject, html, text)


def send_pdf_report_email(user_email: str, pdf_bytes: bytes):
    from .email_templates import pdf_report_email
    subject, html, text = pdf_report_email(user_email)
    send_email_with_attachment(user_email, subject, html, text, "college_match_report.pdf", pdf_bytes)


def send_upgrade_nudge(user_email: str, feature_attempted: str):
    from .email_templates import upgrade_nudge_email
    subject, html, text = upgrade_nudge_email(user_email, feature_attempted)
    send_email(user_email, subject, html, text)


def send_password_reset_email(user_email: str, reset_token: str):
    from .email_templates import password_reset_email
    subject, html, text = password_reset_email(user_email, reset_token)
    send_email(user_email, subject, html, text)
