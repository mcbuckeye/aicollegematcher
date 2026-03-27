import os
import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from ..database import get_db
from ..models import ChatMessage, Subscription

router = APIRouter(prefix="/api/chat", tags=["chat"])

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

SYSTEM_PROMPT = (
    "You are a knowledgeable college admissions advisor. You help students find "
    "the right college based on their interests, academic profile, and preferences. "
    "You have access to data on nearly 2000 US colleges. Be encouraging, specific, "
    "and practical. Keep responses concise (2-3 paragraphs max)."
)

MESSAGE_LIMITS = {
    "free": 3,
    "report": 20,
    "season": None,  # unlimited
    "premium": None,  # unlimited
}


class ChatRequest(BaseModel):
    message: str
    email: Optional[str] = None
    session_id: str
    context: Optional[Dict[str, Any]] = None


class ChatResponse(BaseModel):
    reply: str
    remaining_messages: Optional[int] = None
    limit: Optional[int] = None


def get_user_tier(email: Optional[str], db: Session) -> str:
    if not email:
        return "free"
    sub = db.query(Subscription).filter(
        Subscription.email == email,
        Subscription.status == "active",
    ).first()
    return sub.tier if sub else "free"


def get_message_count(session_id: str, db: Session) -> int:
    return db.query(ChatMessage).filter(
        ChatMessage.session_id == session_id,
        ChatMessage.role == "user",
    ).count()


@router.post("/message", response_model=ChatResponse)
def send_message(payload: ChatRequest, db: Session = Depends(get_db)):
    if not OPENAI_API_KEY:
        raise HTTPException(status_code=503, detail="Chat service not configured")

    tier = get_user_tier(payload.email, db)
    limit = MESSAGE_LIMITS.get(tier)
    user_count = get_message_count(payload.session_id, db)

    if limit is not None and user_count >= limit:
        raise HTTPException(
            status_code=429,
            detail={
                "error": "message_limit_reached",
                "tier": tier,
                "limit": limit,
                "message": f"You've used all {limit} messages for the {tier} tier. Upgrade to continue chatting.",
            },
        )

    # Build conversation history
    history = db.query(ChatMessage).filter(
        ChatMessage.session_id == payload.session_id,
    ).order_by(ChatMessage.created_at).all()

    messages = [{"role": "system", "content": SYSTEM_PROMPT}]

    # Add match context if provided
    if payload.context and payload.context.get("matches"):
        matches_text = "The student has completed an assessment. Their top college matches are:\n"
        for m in payload.context["matches"][:5]:
            school = m.get("school", {})
            matches_text += (
                f"- {school.get('name', 'Unknown')} "
                f"({m.get('match_score', 0)}% match, {m.get('category', '')}): "
                f"{m.get('reason', '')}\n"
            )
        messages.append({"role": "system", "content": matches_text})

    for msg in history:
        messages.append({"role": msg.role, "content": msg.content})

    messages.append({"role": "user", "content": payload.message})

    # Call OpenAI
    try:
        import openai

        client = openai.OpenAI(api_key=OPENAI_API_KEY)
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            max_tokens=1000,
            temperature=0.7,
        )
        reply = response.choices[0].message.content
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat error: {str(e)}")

    # Save messages to DB
    user_msg = ChatMessage(
        session_id=payload.session_id,
        role="user",
        content=payload.message,
        email=payload.email,
    )
    assistant_msg = ChatMessage(
        session_id=payload.session_id,
        role="assistant",
        content=reply,
        email=payload.email,
    )
    db.add(user_msg)
    db.add(assistant_msg)
    db.commit()

    new_count = user_count + 1
    remaining = (limit - new_count) if limit is not None else None

    return ChatResponse(
        reply=reply,
        remaining_messages=remaining,
        limit=limit,
    )
