import pytest
from fastapi.testclient import TestClient


@pytest.fixture(scope="session")
def client():
    """
    Session-scoped FastAPI test client.
    Reuses a single app instance across all tests for speed.
    The lifespan is bypassed by TestClient so the BullMQ worker
    does not need a live Redis connection during pytest runs.
    """
    from app.main import app
    with TestClient(app) as c:
        yield c

