"""HTML email templates for AI College Matcher."""

SITE_URL = "https://aicollegematcher.machomelab.com"

# Shared HTML wrapper
def _wrap(body_content: str) -> str:
    return f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f5f1eb;font-family:'Inter',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f1eb;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1E3A5F,#2A4F7F);padding:28px 32px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">
                🎓 AI College Matcher
              </h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              {body_content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color:#f8f6f2;padding:24px 32px;text-align:center;border-top:1px solid #eee;">
              <p style="margin:0 0 8px 0;color:#6B7280;font-size:12px;">
                &copy; 2026 AI College Matcher. All rights reserved.
              </p>
              <p style="margin:0;color:#6B7280;font-size:12px;">
                <a href="{SITE_URL}/unsubscribe" style="color:#6B7280;text-decoration:underline;">Unsubscribe</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""


def _button(text: str, url: str) -> str:
    return f"""<table cellpadding="0" cellspacing="0" style="margin:24px 0;">
  <tr>
    <td style="background:linear-gradient(135deg,#D4A843,#B8902E);border-radius:8px;padding:14px 28px;">
      <a href="{url}" style="color:#1E3A5F;font-weight:700;font-size:15px;text-decoration:none;display:inline-block;">{text}</a>
    </td>
  </tr>
</table>"""


def welcome_email(user_email: str, name: str | None = None) -> tuple[str, str, str]:
    greeting = f"Hi {name}," if name else "Hi there,"
    html = _wrap(f"""
      <h2 style="margin:0 0 16px 0;color:#1E3A5F;font-size:20px;">{greeting}</h2>
      <p style="color:#2D3748;font-size:15px;line-height:1.6;margin:0 0 16px 0;">
        Welcome to <strong>AI College Matcher</strong>! We're excited to help you find the perfect college fit.
      </p>
      <p style="color:#2D3748;font-size:15px;line-height:1.6;margin:0 0 16px 0;">
        Here's what you can do:
      </p>
      <ul style="color:#2D3748;font-size:15px;line-height:1.8;margin:0 0 16px 0;padding-left:20px;">
        <li>Take our free <strong>College Readiness Assessment</strong></li>
        <li>Browse 2,000+ schools with detailed stats</li>
        <li>Chat with our AI college advisor</li>
        <li>Get essay feedback and application strategy</li>
      </ul>
      {_button("Take the Free Assessment", f"{SITE_URL}/assess")}
      <p style="color:#6B7280;font-size:13px;margin:0;">
        Questions? Just reply to this email — we're here to help.
      </p>
    """)
    text = f"{greeting}\n\nWelcome to AI College Matcher! Take your free assessment at {SITE_URL}/assess"
    return "Welcome to AI College Matcher!", html, text


def assessment_results_email(
    user_email: str,
    readiness_score: int,
    top_matches: list[dict],
) -> tuple[str, str, str]:
    matches_html = ""
    for m in top_matches[:3]:
        school = m.get("school", {})
        name = school.get("name", "Unknown")
        city = school.get("city", "")
        state = school.get("state", "")
        score = m.get("match_score", 0)
        matches_html += f"""
        <tr>
          <td style="padding:12px 16px;border-bottom:1px solid #f0f0f0;">
            <strong style="color:#1E3A5F;font-size:15px;">{name}</strong><br>
            <span style="color:#6B7280;font-size:13px;">{city}, {state} &middot; {score}% match</span>
          </td>
        </tr>"""

    html = _wrap(f"""
      <h2 style="margin:0 0 16px 0;color:#1E3A5F;font-size:20px;">Your Results Are Ready!</h2>
      <div style="background:linear-gradient(135deg,#1E3A5F,#2A4F7F);border-radius:12px;padding:24px;text-align:center;margin:0 0 24px 0;">
        <p style="margin:0 0 8px 0;color:#D4A843;font-size:13px;text-transform:uppercase;letter-spacing:1px;">College Readiness Score</p>
        <p style="margin:0;color:#ffffff;font-size:48px;font-weight:700;">{readiness_score}</p>
        <p style="margin:4px 0 0 0;color:#ffffff;opacity:0.7;font-size:13px;">out of 100</p>
      </div>
      <h3 style="margin:0 0 12px 0;color:#1E3A5F;font-size:16px;">Your Top Matches</h3>
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f6f2;border-radius:8px;overflow:hidden;margin:0 0 24px 0;">
        {matches_html}
      </table>
      {_button("View Full Results", f"{SITE_URL}/assess")}
      <p style="color:#6B7280;font-size:13px;margin:0;">
        Upgrade for a detailed PDF report with personalized insights.
      </p>
    """)
    text = f"Your College Readiness Score: {readiness_score}/100. View results at {SITE_URL}/assess"
    return "Your College Match Results are Ready", html, text


def pdf_report_email(user_email: str) -> tuple[str, str, str]:
    html = _wrap(f"""
      <h2 style="margin:0 0 16px 0;color:#1E3A5F;font-size:20px;">Your Report is Attached!</h2>
      <p style="color:#2D3748;font-size:15px;line-height:1.6;margin:0 0 16px 0;">
        Your personalized AI College Matcher report is attached to this email as a PDF.
      </p>
      <p style="color:#2D3748;font-size:15px;line-height:1.6;margin:0 0 16px 0;">
        Inside you'll find:
      </p>
      <ul style="color:#2D3748;font-size:15px;line-height:1.8;margin:0 0 16px 0;padding-left:20px;">
        <li>Your detailed readiness analysis</li>
        <li>Personalized school recommendations</li>
        <li>Application strategy tips</li>
      </ul>
      {_button("Explore More Schools", f"{SITE_URL}/schools")}
    """)
    text = "Your AI College Matcher report is attached to this email."
    return "Your AI College Matcher Report", html, text


def upgrade_nudge_email(user_email: str, feature_attempted: str) -> tuple[str, str, str]:
    html = _wrap(f"""
      <h2 style="margin:0 0 16px 0;color:#1E3A5F;font-size:20px;">Unlock {feature_attempted}</h2>
      <p style="color:#2D3748;font-size:15px;line-height:1.6;margin:0 0 16px 0;">
        You tried to access <strong>{feature_attempted}</strong> — a premium feature that helps students get into their dream schools.
      </p>
      <p style="color:#2D3748;font-size:15px;line-height:1.6;margin:0 0 16px 0;">
        With a paid plan you get:
      </p>
      <ul style="color:#2D3748;font-size:15px;line-height:1.8;margin:0 0 16px 0;padding-left:20px;">
        <li>Unlimited AI advisor chat</li>
        <li>Detailed PDF match reports</li>
        <li>Essay feedback &amp; strategy tools</li>
        <li>Decision support analysis</li>
      </ul>
      {_button("See Plans & Pricing", f"{SITE_URL}/#pricing")}
    """)
    text = f"Unlock {feature_attempted} with an AI College Matcher upgrade. See plans at {SITE_URL}/#pricing"
    return f"Unlock {feature_attempted} on AI College Matcher", html, text


def password_reset_email(user_email: str, reset_token: str) -> tuple[str, str, str]:
    reset_url = f"{SITE_URL}/login?reset_token={reset_token}"
    html = _wrap(f"""
      <h2 style="margin:0 0 16px 0;color:#1E3A5F;font-size:20px;">Reset Your Password</h2>
      <p style="color:#2D3748;font-size:15px;line-height:1.6;margin:0 0 16px 0;">
        We received a request to reset your password. Click the button below to set a new password.
      </p>
      {_button("Reset Password", reset_url)}
      <p style="color:#6B7280;font-size:13px;margin:0 0 8px 0;">
        This link expires in <strong>1 hour</strong>. If you didn't request this, you can safely ignore this email.
      </p>
    """)
    text = f"Reset your password: {reset_url}\nThis link expires in 1 hour."
    return "Reset your AI College Matcher password", html, text
