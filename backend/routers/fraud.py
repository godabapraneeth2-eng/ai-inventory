from fastapi import APIRouter, HTTPException
from typing import Optional, List
from pydantic import BaseModel
from backend.models import FraudAlertResponse
from backend.services.fraud_service import fraud_service
from backend.database import AsyncSessionLocal, FraudReport
from sqlalchemy import select

router = APIRouter()

class ScanReq(BaseModel):
    customer_id: str
    amount: Optional[float] = None
    order_value: Optional[float] = None
    customer_name: Optional[str] = "Unknown"
    history: Optional[list] = []

@router.get("/", response_model=list[FraudAlertResponse])
@router.get("/alerts", response_model=list[FraudAlertResponse])
async def list_alerts():
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(FraudReport).order_by(FraudReport.created_at.desc()).limit(50))
        rows = result.scalars().all()
        return [
            FraudAlertResponse(
                id=r.id,
                customer_id=r.customer_id,
                customer_name=r.customer_name or "Unknown",
                fraud_score=float(r.fraud_score or 0.0),
                fraud_type=r.fraud_type or "transactional",
                risk_level=r.risk_level or "low",
                explanation=r.explanation or "",
                status=r.status or "active",
                created_at=r.created_at.isoformat() if r.created_at else "",
            )
            for r in rows
        ]

@router.post("/scan", response_model=FraudAlertResponse)
async def scan_fraud(req: ScanReq):
    val = req.order_value if req.order_value is not None else (req.amount or 0.0)
    result = await fraud_service.scan(
        customer_id=req.customer_id,
        order_value=val,
        customer_name=req.customer_name or "Unknown",
        history=req.history
    )
    return FraudAlertResponse(**result)

@router.get("/{id}", response_model=FraudAlertResponse)
@router.get("/alerts/{id}", response_model=FraudAlertResponse)
async def get_alert(id: int):
    raise HTTPException(status_code=404, detail="Not found")
