import logging
import os
import shutil
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database.database import get_db
from app.models.user import User
from app.models.paper import Paper
from app.schemas.auth import (
    UserCreate, UserLogin, UserResponse, TokenResponse,
    UserUpdate, ChangePasswordRequest
)
from app.auth.auth_service import hash_password, verify_password, create_access_token
from app.auth.dependencies import get_current_user
from app.auth.rate_limiter import InMemoryRateLimiter
from app.config import get_settings
from app.rag.vector_store import get_vector_store

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/auth", tags=["Authentication"])
settings = get_settings()

auth_limiter = InMemoryRateLimiter(times=15, seconds=60)


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(
    user_data: UserCreate,
    db: AsyncSession = Depends(get_db),
    _rate_limit: bool = Depends(auth_limiter)
):
    normalized_email = user_data.email.strip().lower()
    stmt = select(User).where(User.email == normalized_email)
    result = await db.execute(stmt)
    existing = result.scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")
    
    user = User(
        name=user_data.name.strip(),
        email=normalized_email,
        password_hash=hash_password(user_data.password)
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    
    token = create_access_token({"sub": str(user.id)})
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )


@router.post("/login", response_model=TokenResponse)
async def login(
    credentials: UserLogin,
    db: AsyncSession = Depends(get_db),
    _rate_limit: bool = Depends(auth_limiter)
):
    normalized_email = credentials.email.strip().lower()
    stmt = select(User).where(User.email == normalized_email)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()
    
    if not user or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    
    token = create_access_token({"sub": str(user.id)})
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse.model_validate(current_user)


@router.put("/profile", response_model=UserResponse)
async def update_profile(
    update_data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if update_data.name is not None:
        current_user.name = update_data.name.strip()
    if update_data.email is not None:
        normalized_email = update_data.email.strip().lower()
        if normalized_email != current_user.email:
            stmt = select(User).where(User.email == normalized_email)
            result = await db.execute(stmt)
            if result.scalar_one_or_none():
                raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already in use")
        current_user.email = normalized_email
    await db.commit()
    await db.refresh(current_user)
    return UserResponse.model_validate(current_user)


@router.post("/change-password")
async def change_password(
    body: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if not verify_password(body.old_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect current password"
        )
    
    current_user.password_hash = hash_password(body.new_password)
    await db.commit()
    return {"message": "Password changed successfully"}


@router.delete("/account")
async def delete_account(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # 1. Clean up user's papers from vector store
    try:
        stmt = select(Paper).where(Paper.user_id == str(current_user.id))
        res = await db.execute(stmt)
        papers = res.scalars().all()
        
        vs = get_vector_store()
        for p in papers:
            vs.delete_paper_documents(str(p.id))
    except Exception as e:
        logger.warning(f"Error deleting user vector documents during account deletion: {e}")

    # 2. Clean up user's files on disk
    user_dir = os.path.join(settings.UPLOAD_DIR, str(current_user.id))
    if os.path.exists(user_dir):
        try:
            shutil.rmtree(user_dir, ignore_errors=True)
        except Exception as e:
            logger.warning(f"Error removing user directory during account deletion: {e}")

    # 3. Delete user row from database (cascades papers, conversations, messages, summaries)
    await db.delete(current_user)
    await db.commit()
    return {"message": "Account successfully deleted"}
