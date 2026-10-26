"""Authentication routes for NoiseWatch."""

from fastapi import APIRouter, HTTPException, status
from app.schemas.schemas import LoginRequest, RegisterRequest, TokenResponse, UserProfile
from app.core.auth import create_access_token
from app.core.config import settings

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


# Demo user database (used when DEMO_MODE=true)
DEMO_USERS = {
    "demo@noisewatch.app": {
        "id": "demo-user-00000001",
        "email": "demo@noisewatch.app",
        "password": "demo1234",
        "display_name": "Demo User",
        "role": "user",
    },
    "reviewer@noisewatch.app": {
        "id": "demo-reviewer-00000001",
        "email": "reviewer@noisewatch.app",
        "password": "demo1234",
        "display_name": "Demo Reviewer",
        "role": "reviewer",
    },
    "admin@noisewatch.app": {
        "id": "demo-admin-00000001",
        "email": "admin@noisewatch.app",
        "password": "demo1234",
        "display_name": "Demo Admin",
        "role": "admin",
    },
}


@router.post("/login", response_model=TokenResponse)
async def login(request: LoginRequest):
    """Authenticate user and return JWT token.

    In demo mode, uses hardcoded demo accounts.
    In production, validates against Supabase Auth.
    """
    if settings.demo_mode:
        user = DEMO_USERS.get(request.email)
        if not user or user["password"] != request.password:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
            )
        token = create_access_token(user["id"], user["email"], user["role"])
        return TokenResponse(
            access_token=token,
            user_id=user["id"],
            role=user["role"],
            display_name=user["display_name"],
        )

    # Production: Supabase Auth integration
    try:
        from supabase import create_client
        supabase = create_client(settings.supabase_url, settings.supabase_anon_key)
        result = supabase.auth.sign_in_with_password({
            "email": request.email,
            "password": request.password,
        })
        if result.user:
            token = create_access_token(
                str(result.user.id),
                result.user.email,
                result.user.user_metadata.get("role", "user"),
            )
            return TokenResponse(
                access_token=token,
                user_id=str(result.user.id),
                role=result.user.user_metadata.get("role", "user"),
                display_name=result.user.user_metadata.get("display_name", result.user.email),
            )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Authentication failed: {str(e)}",
        )


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(request: RegisterRequest):
    """Register a new user.

    In demo mode, simulates registration.
    In production, creates user via Supabase Auth.
    """
    if settings.demo_mode:
        if request.email in DEMO_USERS:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email already registered",
            )
        user_id = f"user-{hash(request.email) % 100000:05d}"
        token = create_access_token(user_id, request.email, "user")
        return TokenResponse(
            access_token=token,
            user_id=user_id,
            role="user",
            display_name=request.display_name,
        )

    # Production: Supabase Auth
    try:
        from supabase import create_client
        supabase = create_client(settings.supabase_url, settings.supabase_anon_key)
        result = supabase.auth.sign_up({
            "email": request.email,
            "password": request.password,
            "options": {
                "data": {
                    "display_name": request.display_name,
                    "role": "user",
                }
            }
        })
        if result.user:
            token = create_access_token(str(result.user.id), request.email, "user")
            return TokenResponse(
                access_token=token,
                user_id=str(result.user.id),
                role="user",
                display_name=request.display_name,
            )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Registration failed: {str(e)}",
        )


@router.get("/me", response_model=UserProfile)
async def get_profile():
    """Get current user profile. Requires authentication header processed by middleware."""
    # This would use get_current_user dependency in production
    if settings.demo_mode:
        return UserProfile(
            id="demo-user-00000001",
            email="demo@noisewatch.app",
            display_name="Demo User",
            role="user",
            created_at="2024-01-01T00:00:00Z",
        )
