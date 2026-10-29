"""
Phase R — Observability: Agent execution logs, stats, and Workflow Replay.

Endpoints:
  GET  /api/v1/observability/logs          — paginated execution logs
  GET  /api/v1/observability/stats         — aggregate performance metrics
  GET  /api/v1/observability/replay/{id}   — replay a specific agent execution
  POST /api/v1/observability/replay        — re-run an agent action by name + input
"""
from __future__ import annotations
import datetime
import time
from typing import Optional

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from backend.database import AsyncSessionLocal, AgentExecution
from backend.models import AgentExecutionResponse

router = APIRouter()


# ── Models ─────────────────────────────────────────────────────────────────────

class ReplayRequest(BaseModel):
    agent_name: str
    action: str
    input_data: dict = {}


class ReplayResponse(BaseModel):
    original_execution_id: Optional[int] = None
    new_execution_id: int
    agent_name: str
    action: str
    status: str
    output: dict
    duration_ms: int
    replayed_at: str
    diff_summary: str


# ── Helpers ────────────────────────────────────────────────────────────────────

async def _persist_execution(
    agent_name: str,
    action: str,
    status: str,
    input_data: dict,
    output_data: dict,
    duration_ms: int,
    tokens_used: int = 0,
    error_message: str = None,
) -> int:
    async with AsyncSessionLocal() as session:
        ex = AgentExecution(
            agent_name=agent_name,
            action=action,
            status=status,
            input_data=input_data,
            output_data=output_data,
            duration_ms=duration_ms,
            tokens_used=tokens_used,
            error_message=error_message,
            confidence=output_data.get("confidence"),
        )
        session.add(ex)
        await session.commit()
        await session.refresh(ex)
        return ex.id


AGENT_DISPATCHER: dict[str, callable] = {}


def _register_agent(name: str):
    """Decorator to register an agent handler for replay."""
    def decorator(fn):
        AGENT_DISPATCHER[name] = fn
        return fn
    return decorator


@_register_agent("SentimentAgent")
async def _replay_sentiment(input_data: dict) -> dict:
    from backend.services.sentiment_service import sentiment_service
    text = input_data.get("text", "replay test message")
    result = await sentiment_service.analyze(text)
    return result


@_register_agent("FraudAgent")
async def _replay_fraud(input_data: dict) -> dict:
    from backend.services.fraud_service import fraud_service
    return await fraud_service.scan(
        customer_id=input_data.get("customer_id", "REPLAY"),
        order_value=input_data.get("order_value", 100.0),
        ip_address=input_data.get("ip_address"),
        customer_name=input_data.get("customer_name", "Replay Customer"),
    )


@_register_agent("QualityAgent")
async def _replay_quality(input_data: dict) -> dict:
    from backend.services.quality_service import quality_service
    return await quality_service.inspect(
        order_id=input_data.get("order_id", "REPLAY-001"),
        sku=input_data.get("sku", "SKU-REPLAY"),
        expected_quantity=input_data.get("quantity", 1),
    )


@_register_agent("ReturnAgent")
async def _replay_return(input_data: dict) -> dict:
    from backend.services.return_service import return_service
    return await return_service.process_return(
        order_id=input_data.get("order_id", "REPLAY-001"),
        customer_id=input_data.get("customer_id", "REPLAY"),
        reason=input_data.get("reason", "Replay test"),
    )


@_register_agent("ProcurementAgent")
async def _replay_procurement(input_data: dict) -> dict:
    from backend.services.procurement_service import procurement_service
    return await procurement_service.generate_pos()


@_register_agent("ShippingAgent")
async def _replay_shipping(input_data: dict) -> dict:
    from backend.services.shipping_service import shipping_service
    return await shipping_service.predict(
        order_id=input_data.get("order_id", "REPLAY-001"),
        carrier=input_data.get("carrier", "FedEx"),
        destination_city=input_data.get("destination_city", "New York"),
    )


# ── Endpoints ──────────────────────────────────────────────────────────────────

@router.get("/logs", response_model=list[AgentExecutionResponse])
async def list_logs(
    agent: Optional[str] = Query(None, description="Filter by agent name"),
    status: Optional[str] = Query(None, description="Filter by status"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
):
    """Return paginated agent execution logs with optional filters."""
    from sqlalchemy import select, desc
    async with AsyncSessionLocal() as session:
        q = select(AgentExecution).order_by(desc(AgentExecution.created_at))
        if agent:
            q = q.where(AgentExecution.agent_name == agent)
        if status:
            q = q.where(AgentExecution.status == status)
        q = q.limit(limit).offset(offset)
        result = await session.execute(q)
        rows = result.scalars().all()

    return [
        AgentExecutionResponse(
            id=r.id,
            agent_name=r.agent_name,
            action=r.action or "",
            status=r.status,
            confidence=r.confidence or 0.0,
            duration_ms=r.duration_ms or 0,
            tokens_used=r.tokens_used or 0,
            error_message=r.error_message,
            retry_count=r.retry_count or 0,
            created_at=r.created_at.isoformat() if r.created_at else "",
        )
        for r in rows
    ]


@router.get("/stats")
async def get_stats():
    """Return aggregate performance metrics across all agents."""
    from sqlalchemy import select, func
    async with AsyncSessionLocal() as session:
        # Total counts by status
        counts_q = await session.execute(
            select(AgentExecution.status, func.count(AgentExecution.id))
            .group_by(AgentExecution.status)
        )
        counts = {row[0]: row[1] for row in counts_q}

        # Avg duration per agent
        dur_q = await session.execute(
            select(AgentExecution.agent_name, func.avg(AgentExecution.duration_ms))
            .group_by(AgentExecution.agent_name)
        )
        avg_durations = {row[0]: round(row[1] or 0, 1) for row in dur_q}

        # Total token usage
        token_q = await session.execute(
            select(func.sum(AgentExecution.tokens_used))
        )
        total_tokens = token_q.scalar() or 0

        total = sum(counts.values())
        errors = counts.get("error", 0)
        success_rate = round((1 - errors / total) * 100, 1) if total else 100.0

    return {
        "total_executions": total,
        "success_rate": success_rate,
        "status_breakdown": counts,
        "avg_duration_ms_by_agent": avg_durations,
        "total_tokens_used": total_tokens,
        "generated_at": datetime.datetime.utcnow().isoformat(),
    }


@router.get("/replay/{execution_id}", response_model=ReplayResponse)
async def replay_by_id(execution_id: int):
    """
    Fetch an existing execution by ID and re-run it with the same input.
    Returns both the original and new execution details plus a diff summary.
    """
    from sqlalchemy import select
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(AgentExecution).where(AgentExecution.id == execution_id)
        )
        original = result.scalar_one_or_none()

    if not original:
        raise HTTPException(status_code=404, detail=f"Execution {execution_id} not found")

    agent_name = original.agent_name
    input_data = original.input_data or {}
    action = original.action or "replay"

    handler = AGENT_DISPATCHER.get(agent_name)
    if not handler:
        raise HTTPException(
            status_code=422,
            detail=f"Agent '{agent_name}' is not registered for replay. "
                   f"Available: {list(AGENT_DISPATCHER.keys())}",
        )

    start = time.monotonic()
    try:
        output = await handler(input_data)
        status = "completed"
        error = None
    except Exception as exc:
        output = {"error": str(exc)}
        status = "error"
        error = str(exc)
    duration_ms = int((time.monotonic() - start) * 1000)

    new_id = await _persist_execution(
        agent_name=agent_name,
        action=f"[REPLAY of #{execution_id}] {action}",
        status=status,
        input_data=input_data,
        output_data=output,
        duration_ms=duration_ms,
        error_message=error,
    )

    # Diff summary
    orig_status = original.status
    orig_dur = original.duration_ms or 0
    diff_parts = []
    if orig_status != status:
        diff_parts.append(f"Status changed: {orig_status} → {status}")
    if abs(duration_ms - orig_dur) > 50:
        direction = "faster" if duration_ms < orig_dur else "slower"
        diff_parts.append(f"Duration: {orig_dur}ms → {duration_ms}ms ({direction})")
    if orig_status == "error" and status == "completed":
        diff_parts.append("Previous failure resolved on replay")
    diff_summary = "; ".join(diff_parts) if diff_parts else "Identical outcome to original"

    return ReplayResponse(
        original_execution_id=execution_id,
        new_execution_id=new_id,
        agent_name=agent_name,
        action=action,
        status=status,
        output=output,
        duration_ms=duration_ms,
        replayed_at=datetime.datetime.utcnow().isoformat(),
        diff_summary=diff_summary,
    )


@router.post("/replay", response_model=ReplayResponse)
async def replay_manual(req: ReplayRequest):
    """
    Manually replay any registered agent by providing agent_name,
    action description, and input_data payload.
    """
    handler = AGENT_DISPATCHER.get(req.agent_name)
    if not handler:
        raise HTTPException(
            status_code=422,
            detail=f"Agent '{req.agent_name}' is not registered for replay. "
                   f"Available: {list(AGENT_DISPATCHER.keys())}",
        )

    start = time.monotonic()
    try:
        output = await handler(req.input_data)
        status = "completed"
        error = None
    except Exception as exc:
        output = {"error": str(exc)}
        status = "error"
        error = str(exc)
    duration_ms = int((time.monotonic() - start) * 1000)

    new_id = await _persist_execution(
        agent_name=req.agent_name,
        action=f"[MANUAL REPLAY] {req.action}",
        status=status,
        input_data=req.input_data,
        output_data=output,
        duration_ms=duration_ms,
        error_message=error,
    )

    return ReplayResponse(
        original_execution_id=None,
        new_execution_id=new_id,
        agent_name=req.agent_name,
        action=req.action,
        status=status,
        output=output,
        duration_ms=duration_ms,
        replayed_at=datetime.datetime.utcnow().isoformat(),
        diff_summary="Manual replay — no original to compare against",
    )
