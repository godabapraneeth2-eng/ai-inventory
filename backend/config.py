"""Nexus AI Enterprise Backend Configuration."""
from __future__ import annotations

import os
from pathlib import Path
from functools import lru_cache

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # ── Supabase ──
    SUPABASE_URL: str = "https://ligmlsadkhucwhfxzfej.supabase.co"
    SUPABASE_ANON_KEY: str = (
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"
        ".eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxpZ21sc2Fka2h1Y3doZnh6ZmVqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODczOTk0NDMsImV4cCI6MjEwMjk3NTQ0M30"
        ".eZqVWP1KRcka-YyNT6GCr6SfYw8LxVQ6WyfIf3XASWg"
    )
    SUPABASE_SERVICE_ROLE_KEY: str = ""

    # ── Gemini ──
    GEMINI_API_KEY: str = ""

    # ── Database ──
    SQLITE_URL: str = "sqlite+aiosqlite:///./nexus_enterprise.db"

    # ── ChromaDB ──
    CHROMA_DB_PATH: str = "./chroma_db"

    # ── Embedding model ──
    EMBEDDING_MODEL: str = "all-MiniLM-L6-v2"

    # ── RAG ──
    RAG_CHUNK_SIZE: int = 500
    RAG_CHUNK_OVERLAP: int = 50
    RAG_TOP_K: int = 5

    # ── Confidence Thresholds ──
    AUTO_EXECUTE_THRESHOLD: float = 0.95
    MANAGER_REVIEW_THRESHOLD: float = 0.70

    # ── App ──
    APP_NAME: str = "Nexus AI Enterprise"
    DEBUG: bool = False

    model_config = {"env_file": ".env", "extra": "ignore"}


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
