import os
import stripe
from fastapi import APIRouter, HTTPException, Request, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Subscription
from datetime import datetime, timezone

router = APIRouter(prefix="/api/payments", tags=["payments"])

STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET")

if STRIPE_SECRET_KEY:
    stripe.api_key = STRIPE_SECRET_KEY

# Price IDs created in Stripe live account (Dashtivity / steve@ipwatcher.com)
STRIPE_PRICE_IDS = {
    "report": os.getenv("STRIPE_PRICE_REPORT", "price_0TFbxC1bYiDI3CPBpjy3owk6"),
    "season": os.getenv("STRIPE_PRICE_SEASON", "price_0TFbxD1bYiDI3CPB7Se3fpDw"),
    "premium": os.getenv("STRIPE_PRICE_PREMIUM", "price_0TFbxD1bYiDI3CPBl5hxVQ5r"),
}

# Price mapping: tier -> Stripe price config
TIER_CONFIG = {
    "report": {
        "price_id": STRIPE_PRICE_IDS["report"],
        "mode": "payment",
        "name": "Match Report",
    },
    "season": {
        "price_id": STRIPE_PRICE_IDS["season"],
        "mode": "subscription",
        "name": "Season Pass",
    },
    "premium": {
        "price_id": STRIPE_PRICE_IDS["premium"],
        "mode": "subscription",
        "name": "Premium",
    },
}


@router.post("/create-checkout")
def create_checkout_session(
    payload: dict,
    db: Session = Depends(get_db),
):
    if not STRIPE_SECRET_KEY:
        raise HTTPException(status_code=503, detail="Payment service not configured")

    tier = payload.get("tier")
    email = payload.get("email")
    success_url = payload.get("success_url", "http://localhost:5173/assess?payment=success")
    cancel_url = payload.get("cancel_url", "http://localhost:5173/#pricing")

    if tier not in TIER_CONFIG:
        raise HTTPException(status_code=400, detail=f"Invalid tier: {tier}")

    config = TIER_CONFIG[tier]

    try:
        session_params = {
            "payment_method_types": ["card"],
            "line_items": [{"price": config["price_id"], "quantity": 1}],
            "mode": config["mode"],
            "success_url": f"https://aicollegematcher.machomelab.com/assess?payment=success&tier={tier}",
            "cancel_url": "https://aicollegematcher.machomelab.com/#pricing",
            "metadata": {"tier": tier},
            "allow_promotion_codes": True,
        }

        if email:
            session_params["customer_email"] = email
            session_params["metadata"]["email"] = email

        checkout_session = stripe.checkout.Session.create(**session_params)

        return {"checkout_url": checkout_session.url, "session_id": checkout_session.id}

    except stripe.StripeError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/webhook")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    if not STRIPE_WEBHOOK_SECRET:
        raise HTTPException(status_code=503, detail="Webhook not configured")

    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, STRIPE_WEBHOOK_SECRET
        )
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid signature")

    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        customer_email = session.get("customer_email") or session.get("customer_details", {}).get("email")
        tier = session.get("metadata", {}).get("tier", "report")
        customer_id = session.get("customer")
        subscription_id = session.get("subscription")

        if customer_email:
            # Check for existing subscription
            existing = db.query(Subscription).filter(
                Subscription.email == customer_email
            ).first()

            if existing:
                existing.tier = tier
                existing.status = "active"
                existing.stripe_customer_id = customer_id
                existing.stripe_subscription_id = subscription_id
            else:
                sub = Subscription(
                    email=customer_email,
                    stripe_customer_id=customer_id,
                    stripe_subscription_id=subscription_id,
                    tier=tier,
                    status="active",
                )
                db.add(sub)

            db.commit()

    elif event["type"] == "customer.subscription.deleted":
        subscription = event["data"]["object"]
        sub_id = subscription.get("id")
        existing = db.query(Subscription).filter(
            Subscription.stripe_subscription_id == sub_id
        ).first()
        if existing:
            existing.status = "canceled"
            existing.tier = "free"
            db.commit()

    return {"status": "ok"}


@router.get("/status")
def get_payment_status(email: str, db: Session = Depends(get_db)):
    if not email:
        return {"tier": "free", "status": "none"}

    sub = db.query(Subscription).filter(
        Subscription.email == email,
        Subscription.status == "active",
    ).first()

    if not sub:
        return {"tier": "free", "status": "none"}

    return {
        "tier": sub.tier,
        "status": sub.status,
        "created_at": sub.created_at.isoformat() if sub.created_at else None,
    }
