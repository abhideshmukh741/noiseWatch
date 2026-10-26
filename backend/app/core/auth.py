"""Authentication and authorization utilities."""

from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.core.config import settings

security = HTTPBearer()


class UserClaims:
    """Parsed JWT claims for the authenticated user."""

    def __init__(self, user_id: str, email: str, role: str = "user"):
        self.user_id = user_id
        self.email = email
        self.role = role

    @property
    def is_admin(self) -> bool:
        return self.role == "admin"

    @property
    def is_reviewer(self) -> bool:
        return self.role in ("reviewer", "admin")


def create_access_token(user_id: str, email: str, role: str = "user") -> str:
    """Create a JWT access token."""
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.jwt_expiration_minutes)
    payload = {
        "sub": user_id,
        "email": email,
        "role": role,
        "exp": expire,
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_token(token: str) -> dict:
    """Decode and validate a JWT token."""
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret,
            algorithms=[settings.jwt_algorithm],
        )
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> UserClaims:
    """Extract and validate the current user from the JWT token."""
    payload = decode_token(credentials.credentials)
    user_id = payload.get("sub")
    email = payload.get("email", "")
    role = payload.get("role", "user")

    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
        )

    return UserClaims(user_id=user_id, email=email, role=role)


def require_role(*allowed_roles: str):
    """Dependency factory that requires specific roles."""
    async def role_checker(user: UserClaims = Depends(get_current_user)) -> UserClaims:
        if user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Insufficient permissions. Required: {', '.join(allowed_roles)}",
            )
        return user
    return role_checker


# Convenience dependencies
require_admin = require_role("admin")
require_reviewer = require_role("reviewer", "admin")
require_authenticated = get_current_user
