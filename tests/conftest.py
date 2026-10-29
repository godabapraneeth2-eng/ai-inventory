"""
pytest configuration for MANOJ AI Enterprise Platform.
Sets up async test mode, in-memory SQLite for isolation, and shared test client.
"""
import asyncio
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport


# ── Async mode ─────────────────────────────────────────────────────────────────
@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


# ── Override DB to in-memory SQLite for tests ──────────────────────────────────
@pytest.fixture(scope="session", autouse=True)
def override_db_url(tmp_path_factory):
    """Point SQLAlchemy at an isolated in-memory SQLite for the test session."""
    import os
    tmp = tmp_path_factory.mktemp("db")
    os.environ["DATABASE_URL"] = f"sqlite+aiosqlite:///{tmp}/test.db"
    os.environ["SUPABASE_URL"] = "https://test.supabase.co"
    os.environ["SUPABASE_ANON_KEY"] = "test-anon-key"
    os.environ["GEMINI_API_KEY"] = ""          # disable real LLM calls in tests
    os.environ["CHROMA_DB_PATH"] = str(tmp / "chroma")


# ── App + HTTP client ─────────────────────────────────────────────────────────
@pytest_asyncio.fixture(scope="session")
async def app():
    from backend.database import init_db
    await init_db()
    from backend.main import app as fastapi_app
    return fastapi_app


@pytest_asyncio.fixture(scope="session")
async def client(app):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c
