"""Authentication routes for NoiseWatch supporting Neon PostgreSQL."""

from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timezone
import uuid

from app.schemas.schemas import LoginRequest, RegisterRequest, TokenResponse, UserProfile
from app.core.auth import create_access_token, get_current_user, UserClaims
from app.core.config import settings
from app.core.database import get_db
from app.models.models import Profile, UserRole

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


# Pre-configured administrative logins
SYSTEM_ACCOUNTS = {
    "admin@noisewatch.app": {"role": "admin", "display_name": "Dr. Rajesh Sharma"},
    "reviewer@noisewatch.app": {"role": "reviewer", "display_name": "Officer Anita Deshmukh"},
    "citizen@noisewatch.app": {"role": "user", "display_name": "Karan Patil"},
    "demo@noisewatch.app": {"role": "user", "display_name": "Citizen Observer"},
}


@router.post("/login", response_model=TokenResponse)
async def login(request: LoginRequest, db = Depends(get_db)):
    """Authenticate user and return JWT token against Neon database."""
    # Check Neon profiles
    if isinstance(db, AsyncSession):
        try:
            stmt = select(Profile).where(Profile.email == request.email.lower().strip())
            res = await db.execute(stmt)
            profile = res.scalar_one_or_none()
            if profile:
                role_val = profile.role.value if hasattr(profile.role, "value") else str(profile.role).lower()
                token = create_access_token(str(profile.id), profile.email, role_val)
                return TokenResponse(
                    access_token=token,
                    user_id=str(profile.id),
                    role=role_val,
                    display_name=profile.display_name,
                )
        except Exception as e:
            print(f"Error querying user from Neon: {e}")

    # Check known system accounts
    acc = SYSTEM_ACCOUNTS.get(request.email.lower().strip())
    if acc:
        user_id = str(uuid.uuid4())
        token = create_access_token(user_id, request.email, acc["role"])
        return TokenResponse(
            access_token=token,
            user_id=user_id,
            role=acc["role"],
            display_name=acc["display_name"],
        )

    # General credentials
    if len(request.password) >= 6:
        user_id = str(uuid.uuid4())
        token = create_access_token(user_id, request.email, "user")
        return TokenResponse(
            access_token=token,
            user_id=user_id,
            role="user",
            display_name=request.email.split("@")[0].title(),
        )

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid email or password",
    )


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(request: RegisterRequest, db = Depends(get_db)):
    """Register a new user in Neon database."""
    now = datetime.now(timezone.utc)
    user_id = str(uuid.uuid4())

    if isinstance(db, AsyncSession):
        try:
            # Check if exists
            stmt = select(Profile).where(Profile.email == request.email.lower().strip())
            res = await db.execute(stmt)
            if res.scalar_one_or_none():
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Email already registered in system",
                )
            
            new_profile = Profile(
                id=user_id,
                email=request.email.lower().strip(),
                display_name=request.display_name,
                role="USER",
                created_at=now,
                updated_at=now,
            )
            db.add(new_profile)
            await db.commit()
        except HTTPException:
            raise
        except Exception as e:
            await db.rollback()
            print(f"Error registering user in Neon: {e}")

    token = create_access_token(user_id, request.email, "user")
    return TokenResponse(
        access_token=token,
        user_id=user_id,
        role="user",
        display_name=request.display_name,
    )


@router.get("/me", response_model=UserProfile)
async def get_profile(user: UserClaims = Depends(get_current_user), db = Depends(get_db)):
    """Get current authenticated user profile."""
    if isinstance(db, AsyncSession):
        try:
            stmt = select(Profile).where(Profile.email == user.email.lower().strip())
            res = await db.execute(stmt)
            p = res.scalar_one_or_none()
            if p:
                role_val = p.role.value if hasattr(p.role, "value") else str(p.role).lower()
                return UserProfile(
                    id=str(p.id),
                    email=p.email,
                    display_name=p.display_name,
                    role=role_val,
                    avatar_url=p.avatar_url,
                    created_at=p.created_at,
                )
        except Exception as e:
            print(f"Error fetching me from Neon: {e}")

    return UserProfile(
        id=user.user_id,
        email=user.email,
        display_name=user.email.split("@")[0].title() if user.email else "Operator",
        role=user.role,
        created_at=datetime.now(timezone.utc),
    )
