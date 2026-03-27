"""Email delivery via SMTP2Go (SMTP protocol)."""

import os
import base64
import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders

logger = logging.getLogger(__name__)

SMTP_HOST = os.getenv("SMTP_HOST", "mail.smtp2go.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "2525"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASS = os.getenv("SMTP_PASS", "")
FROM_EMAIL = os.getenv("FROM_EMAIL", "noreply@aicollegematcher.machomelab.com")
FROM_NAME = "AI College Matcher"


def send_email(
    to: str,
    subject: str,
    html_body: str,
    text_body: str | None = None,
    attachments: list[dict] | None = None,  # [{"filename": "...", "content": bytes}]
) -> bool:
    """Send an email via SMTP2Go. Returns True on success."""
    if not SMTP_USER or not SMTP_PASS:
        logger.warning(f"SMTP credentials not set — skipping email to {to}: {subject}")
        return False

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{FROM_NAME} <{FROM_EMAIL}>"
        msg["To"] = to

        if text_body:
            msg.attach(MIMEText(text_body, "plain"))
        msg.attach(MIMEText(html_body, "html"))

        if attachments:
            for att in attachments:
                part = MIMEBase("application", "octet-stream")
                part.set_payload(att["content"])
                encoders.encode_base64(part)
                part.add_header(
                    "Content-Disposition",
                    f'attachment; filename="{att["filename"]}"',
                )
                msg.attach(part)

        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASS)
            server.sendmail(FROM_EMAIL, [to], msg.as_string())

        logger.info(f"Email sent to {to}: {subject}")
        return True

    except Exception as e:
        logger.error(f"Failed to send email to {to}: {e}")
        return False
