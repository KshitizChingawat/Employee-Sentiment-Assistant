"""
Auth Routes — register, login, profile.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from backend.database.connection import get_db
from backend.models.models import User, UserRole
from backend.schemas.schemas import UserRegister, UserLogin, TokenResponse, UserOut
from backend.services.auth_service import (
    hash_password, verify_password, create_access_token, get_current_user
)

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=UserOut, status_code=201)
async def register(payload: UserRegister, db: AsyncSession = Depends(get_db)):
    """Register a new user account."""

    # Check duplicate email
    result = await db.execute(select(User).where(User.email == payload.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    # Validate role
    allowed_roles = {r.value for r in UserRole}
    role = payload.role if payload.role in allowed_roles else "employee"

    user = User(
        email      = payload.email,
        name       = payload.name,
        password   = hash_password(payload.password),
        role       = role,
        department = payload.department,
        company_id = payload.company_id or 1,
    )
    db.add(user)
    await db.flush()
    await db.refresh(user)
    return user


@router.post("/login", response_model=TokenResponse)
async def login(payload: UserLogin, db: AsyncSession = Depends(get_db)):
    """Authenticate and return a JWT access token."""

    result = await db.execute(select(User).where(User.email == payload.email))
    user   = result.scalar_one_or_none()

    if not user or not verify_password(payload.password, user.password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account deactivated")

    token = create_access_token({"sub": str(user.id), "role": user.role})

    return {
        "access_token": token,
        "token_type":   "bearer",
        "user": {
            "id":         user.id,
            "name":       user.name,
            "email":      user.email,
            "role":       user.role,
            "department": user.department,
            "company_id": user.company_id,
        },
    }


@router.get("/me", response_model=UserOut)
async def me(current_user: User = Depends(get_current_user)):
    """Return the currently authenticated user's profile."""
    return current_user


@router.get("/users", response_model=list[UserOut])
async def list_users(
    current_user: User = Depends(get_current_user),
    db: AsyncSession   = Depends(get_db),
):
    """List all users (admin only)."""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    result = await db.execute(
        select(User).where(User.company_id == current_user.company_id)
    )
    return result.scalars().all()
