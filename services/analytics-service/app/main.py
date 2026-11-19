import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.config import settings
from app.api.endpoints import router as analytics_router
from app.services.worker import worker

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.log_level.upper(), logging.INFO),
    format="[%(asctime)s] [%(levelname)s] [%(name)s]: %(message)s",
)
logger = logging.getLogger("main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing PulseSupply Analytics Engine...")
    # Start the background BullMQ consumer
    await worker.start()
    yield
    # Graceful shutdown of background workers
    logger.info("Shutting down Analytics Engine background tasks...")
    await worker.stop()


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="Asynchronous analytics and reporting engine for PulseSupply e-commerce SaaS.",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error processing {request.method} {request.url}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": {
                "message": "Internal server error occurred in analytics engine",
                "details": str(exc) if settings.environment != "production" else None,
            },
        },
    )


# Root health check endpoint for container probes
@app.get("/healthz", tags=["System"])
def root_health():
    return {
        "status": "healthy",
        "service": "analytics-service",
        "environment": settings.environment,
    }


# Include Routers
app.include_router(analytics_router)

