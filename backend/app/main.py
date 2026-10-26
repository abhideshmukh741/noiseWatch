"""NoiseWatch — AI-Powered Noise Pollution Monitoring & Complaint Management.

Main FastAPI application entry point.
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from datetime import datetime, timezone
from app.core.config import settings
from app.api.routes import auth, dashboard, reports, audio

app = FastAPI(
    title="NoiseWatch API",
    description=(
        "AI-powered noise pollution monitoring, incident detection, "
        "and automated complaint management system. "
        "This API provides endpoints for sound measurement management, "
        "incident review, report generation, and complaint workflows."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Global Exception Handler ──────────────────────────────────

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Catch unhandled exceptions and return a consistent error response."""
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "detail": str(exc) if settings.app_debug else "An unexpected error occurred",
            "timestamp": datetime.now(timezone.utc).isoformat(),
        },
    )


# ── Health Check ───────────────────────────────────────────────

@app.get("/health", tags=["System"])
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "NoiseWatch API",
        "version": "1.0.0",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "demo_mode": settings.demo_mode,
        "environment": settings.app_env,
    }


@app.get("/", tags=["System"])
async def root():
    """API root — service information."""
    return {
        "service": "NoiseWatch API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health",
        "demo_mode": settings.demo_mode,
    }


# ── Register Routers ──────────────────────────────────────────

app.include_router(auth.router)
app.include_router(dashboard.router)
app.include_router(reports.router)
app.include_router(audio.router)


# ── Startup Event ─────────────────────────────────────────────

@app.on_event("startup")
async def startup_event():
    """Initialize services on startup."""
    if settings.demo_mode:
        print("=" * 60)
        print("  NoiseWatch API — DEMO MODE")
        print("  All data is simulated. Do not use for real monitoring.")
        print("=" * 60)
        print(f"  Demo accounts:")
        print(f"    User:     demo@noisewatch.app / demo1234")
        print(f"    Reviewer: reviewer@noisewatch.app / demo1234")
        print(f"    Admin:    admin@noisewatch.app / demo1234")
        print("=" * 60)
    else:
        print("NoiseWatch API starting in production mode...")
        # Initialize database connection
        # Initialize ML model
        # Initialize notification service
