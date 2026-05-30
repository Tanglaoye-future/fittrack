"""Integration tests hit the real Postgres on localhost:5433. Set env vars to override."""
import os
import sys
from pathlib import Path

# Ensure src/ is importable without installing the package
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

os.environ.setdefault("DATABASE_URL", "postgresql://fitflow:fitflow123@localhost:5433/fitflow_pro_v2_db")
os.environ.setdefault("JWT_SECRET", "fitflow-jwt-secret-key-2026")

import jwt
import pytest
from fastapi.testclient import TestClient

from analytics.main import app


@pytest.fixture(scope="session")
def client():
    with TestClient(app) as c:
        yield c


@pytest.fixture(scope="session")
def auth_headers():
    token = jwt.encode(
        {"sub": "00000000-0000-0000-0000-000000000000", "email": "test@example.com"},
        os.environ["JWT_SECRET"],
        algorithm="HS256",
    )
    return {"Authorization": f"Bearer {token}"}
