import os
import logging
import secrets
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from jose import jwt, JWTError
from bcrypt import hashpw, gensalt, checkpw

from ..database import get_db
from ..models import User
from ..schemas import (
    RegisterRequest, LoginRequest, TokenResponse, UserResponse,
    ForgotPasswordRequest, ResetPasswordRequest, VerifyEmailRequest,
    GoogleAuthRequest, MessageResponse,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/auth", tags=["auth"])

SECRET_KEY = os.getenv("AUTH_SECRET_KEY", "dev-secret-key-change-in-production")
ALGORITHM = "HS256"
TOKEN_EXPIRY_DAYS = 30


def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    to_encode["exp"] = datetime.now(timezone.utc) + timedelta(days=TOKEN_EXPIRY_DAYS)
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def get_current_user(db: Session, token: str) -> User:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = payload.get("user_id")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


def get_current_user_dependency(
    db: Session = Depends(get_db),
    authorization: str = Depends(lambda: None),
):
    """This is a placeholder — use require_auth or optional_auth below."""
    pass


from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi import Security

bearer_scheme = HTTPBearer(auto_error=False)


def require_auth(
    credentials: HTTPAuthorizationCredentials = Security(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return get_current_user(db, credentials.credentials)


def optional_auth(
    credentials: HTTPAuthorizationCredentials = Security(bearer_scheme),
    db: Session = Depends(get_db),
) -> User | None:
    if not credentials:
        return None
    try:
        return get_current_user(db, credentials.credentials)
    except HTTPException:
        return None


@router.post("/register", response_model=TokenResponse)
def register(
    req: RegisterRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    existing = db.query(User).filter(User.email == req.email.lower().strip()).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    if len(req.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")

    password_hash = hashpw(req.password.encode("utf-8"), gensalt()).decode("utf-8")
    verification_token = secrets.token_urlsafe(32)

    user = User(
        email=req.email.lower().strip(),
        password_hash=password_hash,
        tier="free",
        is_verified=False,
        verification_token=verification_token,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Send welcome email in background
    try:
        from ..services.email_service import send_welcome_email
        background_tasks.add_task(send_welcome_email, user.email)
    except Exception as e:
        logger.warning(f"Failed to queue welcome email: {e}")

    token = create_access_token({"user_id": user.id, "email": user.email, "tier": user.tier})
    return TokenResponse(
        access_token=token,
        user=UserResponse.model_validate(user),
    )


@router.post("/login", response_model=TokenResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email.lower().strip()).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not checkpw(req.password.encode("utf-8"), user.password_hash.encode("utf-8")):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    user.last_login = datetime.now(timezone.utc)
    db.commit()

    token = create_access_token({"user_id": user.id, "email": user.email, "tier": user.tier})
    return TokenResponse(
        access_token=token,
        user=UserResponse.model_validate(user),
    )


@router.post("/logout", response_model=MessageResponse)
def logout():
    # Client-side only — just return success
    return MessageResponse(message="Logged out successfully")


@router.get("/me", response_model=UserResponse)
def get_me(user: User = Depends(require_auth)):
    return UserResponse.model_validate(user)


@router.post("/forgot-password", response_model=MessageResponse)
def forgot_password(
    req: ForgotPasswordRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.email == req.email.lower().strip()).first()
    if not user:
        # Don't reveal if email exists
        return MessageResponse(message="If that email is registered, a reset link has been sent")

    reset_token = secrets.token_urlsafe(32)
    user.reset_token = reset_token
    user.reset_token_expires = datetime.now(timezone.utc) + timedelta(hours=1)
    db.commit()

    try:
        from ..services.email_service import send_password_reset_email
        background_tasks.add_task(send_password_reset_email, user.email, reset_token)
    except Exception as e:
        logger.warning(f"Failed to queue reset email: {e}")

    return MessageResponse(message="If that email is registered, a reset link has been sent")


@router.post("/reset-password", response_model=MessageResponse)
def reset_password(req: ResetPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.reset_token == req.token).first()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")

    if user.reset_token_expires and user.reset_token_expires < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Reset token has expired")

    if len(req.new_password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")

    user.password_hash = hashpw(req.new_password.encode("utf-8"), gensalt()).decode("utf-8")
    user.reset_token = None
    user.reset_token_expires = None
    db.commit()

    return MessageResponse(message="Password reset successfully")


@router.post("/verify-email", response_model=MessageResponse)
def verify_email(req: VerifyEmailRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.verification_token == req.token).first()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid verification token")

    user.is_verified = True
    user.verification_token = None
    db.commit()

    return MessageResponse(message="Email verified successfully")


@router.post("/google", response_model=MessageResponse)
def google_auth(req: GoogleAuthRequest):
    # Stub — validate structure but don't process yet
    if not req.token:
        raise HTTPException(status_code=400, detail="Token is required")
    return MessageResponse(message="Google OAuth coming soon")
