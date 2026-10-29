"""Database layer — SQLite (async) for new features + Supabase client for existing data."""
from __future__ import annotations

from datetime import datetime
from typing import AsyncGenerator

from sqlalchemy import (
    Column, Integer, String, Float, Text, Boolean, DateTime, JSON,
    ForeignKey, Index, event,
)
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase, relationship
from supabase import create_client, Client

from backend.config import settings


# ──────────────────────────────────────────────
# SQLAlchemy Async Engine
# ──────────────────────────────────────────────

engine = create_async_engine(settings.SQLITE_URL, echo=settings.DEBUG)
AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


# ──────────────────────────────────────────────
# ORM Models
# ──────────────────────────────────────────────

class CustomerMemory(Base):
    __tablename__ = "customer_memory"
    id = Column(Integer, primary_key=True, autoincrement=True)
    customer_id = Column(String(64), nullable=False, index=True)
    memory_type = Column(String(50), nullable=False)  # purchase_pattern, complaint, preference, interaction
    key = Column(String(200), nullable=False)
    value = Column(JSON, nullable=False)
    relevance_score = Column(Float, default=1.0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    __table_args__ = (Index("idx_memory_customer_type", "customer_id", "memory_type"),)


class ReturnRequest(Base):
    __tablename__ = "return_requests"
    id = Column(Integer, primary_key=True, autoincrement=True)
    order_id = Column(String(64), nullable=False, index=True)
    customer_id = Column(String(64), nullable=False, index=True)
    customer_name = Column(String(200), default="")
    reason = Column(Text, nullable=False)
    damage_type = Column(String(100))  # cracks, scratches, missing_accessories, wrong_product, used
    image_path = Column(String(500))
    status = Column(String(30), default="pending")  # pending, approved, rejected, more_evidence_needed
    confidence = Column(Float, default=0.0)
    refund_amount = Column(Float, default=0.0)
    agent_explanation = Column(Text)
    policy_reference = Column(String(200))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class FraudReport(Base):
    __tablename__ = "fraud_reports"
    id = Column(Integer, primary_key=True, autoincrement=True)
    customer_id = Column(String(64), nullable=False, index=True)
    customer_name = Column(String(200), default="")
    fraud_score = Column(Float, default=0.0)
    fraud_type = Column(String(100))  # fake_return, multiple_refunds, suspicious_address, unusual_pattern, payment_fraud
    risk_level = Column(String(20), default="low")
    explanation = Column(Text)
    evidence = Column(JSON)
    status = Column(String(30), default="active")  # active, investigated, cleared, blocked
    created_at = Column(DateTime, default=datetime.utcnow)


class PurchaseOrder(Base):
    __tablename__ = "purchase_orders"
    id = Column(Integer, primary_key=True, autoincrement=True)
    product_id = Column(String(64), nullable=False)
    product_name = Column(String(200), default="")
    sku = Column(String(50), default="")
    quantity = Column(Integer, nullable=False)
    unit_cost = Column(Float, default=0.0)
    total_cost = Column(Float, default=0.0)
    supplier = Column(String(200), default="")
    status = Column(String(30), default="pending")  # pending, ordered, in_transit, delivered, cancelled
    estimated_delivery = Column(String(30))
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class ShippingPrediction(Base):
    __tablename__ = "shipping_predictions"
    id = Column(Integer, primary_key=True, autoincrement=True)
    order_id = Column(String(64), nullable=False, index=True)
    order_number = Column(String(50), default="")
    carrier = Column(String(100), default="FedEx")
    estimated_delivery = Column(String(30))
    predicted_delay_days = Column(Integer, default=0)
    delay_risk = Column(String(20), default="low")  # low, medium, high
    confidence = Column(Float, default=0.85)
    weather_impact = Column(String(100))
    route_issues = Column(String(200))
    status = Column(String(30), default="in_transit")
    created_at = Column(DateTime, default=datetime.utcnow)


class QualityInspection(Base):
    __tablename__ = "quality_inspections"
    id = Column(Integer, primary_key=True, autoincrement=True)
    order_id = Column(String(64), nullable=False, index=True)
    order_number = Column(String(50), default="")
    result = Column(String(20), default="pending")  # passed, failed, warning, pending
    product_correct = Column(Boolean, default=True)
    quantity_correct = Column(Boolean, default=True)
    packaging_quality = Column(String(20), default="good")  # good, acceptable, poor
    seal_integrity = Column(Boolean, default=True)
    issues = Column(JSON, default=list)
    confidence = Column(Float, default=0.95)
    inspector_agent = Column(String(50), default="QualityAgent")
    created_at = Column(DateTime, default=datetime.utcnow)


class ApprovalQueue(Base):
    __tablename__ = "approval_queue"
    id = Column(Integer, primary_key=True, autoincrement=True)
    request_type = Column(String(50), nullable=False)  # refund, order_override, fraud_clear, procurement
    entity_id = Column(String(64), nullable=False)
    description = Column(Text, default="")
    agent_name = Column(String(50), default="")
    confidence = Column(Float, default=0.0)
    status = Column(String(20), default="pending")  # pending, approved, rejected
    reviewed_by = Column(String(100))
    review_notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    reviewed_at = Column(DateTime)


class EventLog(Base):
    __tablename__ = "event_log"
    id = Column(Integer, primary_key=True, autoincrement=True)
    event_type = Column(String(50), nullable=False, index=True)
    source_agent = Column(String(50))
    entity_type = Column(String(50))
    entity_id = Column(String(64))
    payload = Column(JSON, default=dict)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)


class ChatSession(Base):
    __tablename__ = "chat_sessions"
    id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(String(64), unique=True, index=True)
    customer_id = Column(String(64))
    started_at = Column(DateTime, default=datetime.utcnow)
    last_activity = Column(DateTime, default=datetime.utcnow)


class ChatMessage(Base):
    __tablename__ = "chat_messages"
    id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(String(64), index=True)
    role = Column(String(20), nullable=False)  # user, assistant
    content = Column(Text, nullable=False)
    context = Column(Text)
    sentiment = Column(String(20))
    confidence = Column(Float)
    sources = Column(JSON)
    timestamp = Column(DateTime, default=datetime.utcnow)


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(100), unique=True, nullable=False)
    display_name = Column(String(200))
    role = Column(String(30), default="customer")
    created_at = Column(DateTime, default=datetime.utcnow)


class EmbeddingMeta(Base):
    __tablename__ = "embeddings_meta"
    id = Column(Integer, primary_key=True, autoincrement=True)
    doc_id = Column(String(100), unique=True, index=True)
    source_type = Column(String(50))  # order, customer, inventory, policy, agent_log
    source_id = Column(String(64))
    content_hash = Column(String(64))
    chunk_index = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)


class AgentExecution(Base):
    __tablename__ = "agent_executions"
    id = Column(Integer, primary_key=True, autoincrement=True)
    agent_name = Column(String(50), nullable=False, index=True)
    action = Column(String(200))
    status = Column(String(20), default="started")
    confidence = Column(Float)
    input_data = Column(JSON)
    output_data = Column(JSON)
    error_message = Column(Text)
    duration_ms = Column(Integer)
    tokens_used = Column(Integer, default=0)
    retry_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)


# ──────────────────────────────────────────────
# Database Lifecycle
# ──────────────────────────────────────────────

async def init_db() -> None:
    """Create all tables."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency for database sessions."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


# ──────────────────────────────────────────────
# Supabase Client
# ──────────────────────────────────────────────

_supabase_client: Client | None = None


def get_supabase() -> Client:
    """Get or create Supabase client singleton."""
    global _supabase_client
    if _supabase_client is None:
        key = settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_ANON_KEY
        _supabase_client = create_client(settings.SUPABASE_URL, key)
    return _supabase_client


get_supabase_client = get_supabase

