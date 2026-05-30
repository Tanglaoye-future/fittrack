from contextlib import asynccontextmanager
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .db import close_pool, init_pool
from .envelope import EnvelopeJSONResponse, register_exception_handlers
from .routes import body_weight, daily_summary, macros, prep_progress, strength


logging.basicConfig(level=getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO))
log = logging.getLogger("analytics")


@asynccontextmanager
async def lifespan(_app: FastAPI):
    init_pool()
    log.info("📊 DB pool ready")
    yield
    close_pool()
    log.info("📊 DB pool closed")


app = FastAPI(
    title="FitFlow Pro Analytics",
    version="0.1.0",
    default_response_class=EnvelopeJSONResponse,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

register_exception_handlers(app)

API_PREFIX = "/api/v2/analytics"

app.include_router(strength.router, prefix=API_PREFIX, tags=["Analytics"])
app.include_router(body_weight.router, prefix=API_PREFIX, tags=["Analytics"])
app.include_router(macros.router, prefix=API_PREFIX, tags=["Analytics"])
app.include_router(daily_summary.router, prefix=API_PREFIX, tags=["Analytics"])
app.include_router(prep_progress.router, prefix=API_PREFIX, tags=["Analytics"])


@app.get("/healthz", include_in_schema=False)
def healthz():
    return {"status": "ok"}
