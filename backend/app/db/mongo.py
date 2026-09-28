"""MongoDB connection + Beanie initialization (replaces the old SQLAlchemy session.py)."""
from __future__ import annotations

from motor.motor_asyncio import AsyncIOMotorClient

from beanie import init_beanie

from app.core.config import MONGODB_DB_NAME, MONGODB_URI
from app.models import DOCUMENT_MODELS

_client: AsyncIOMotorClient | None = None


async def init_db() -> None:
    global _client
    try:
        _client = AsyncIOMotorClient(MONGODB_URI)
        database = _client[MONGODB_DB_NAME]
        await init_beanie(database=database, document_models=DOCUMENT_MODELS)
    except Exception as exc:  # pragma: no cover - depends on local Mongo availability
        _client = None
        print(f"MongoDB not available at startup; continuing without DB init: {exc}")


async def close_db() -> None:
    global _client
    if _client is not None:
        _client.close()
        _client = None
