from fastapi import APIRouter, HTTPException
from typing import Optional
from pydantic import BaseModel
from backend.models import ShippingPredictionResponse
from backend.services.shipping_service import shipping_service
from backend.database import AsyncSessionLocal, ShippingPrediction
from sqlalchemy import select

router = APIRouter()

class PredictReq(BaseModel):
    order_id: str
    carrier: str
    weather: Optional[str] = None

@router.get("/", response_model=list[ShippingPredictionResponse])
@router.get("/predictions", response_model=list[ShippingPredictionResponse])
async def list_predictions():
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(ShippingPrediction).order_by(ShippingPrediction.created_at.desc()).limit(50))
        rows = result.scalars().all()
        return [
            ShippingPredictionResponse(
                id=r.id,
                order_id=r.order_id,
                order_number=r.order_number,
                carrier=r.carrier,
                eta=r.estimated_delivery or "",
                confidence=r.confidence or 0.85,
                delay_risk=r.delay_risk or "low",
                status=r.status or "in_transit",
            )
            for r in rows
        ]

@router.post("/predict", response_model=ShippingPredictionResponse)
async def predict_shipping(req: PredictReq):
    result = await shipping_service.predict_shipping(req.order_id, req.carrier, req.weather)
    return ShippingPredictionResponse(**result)

@router.get("/{id}", response_model=ShippingPredictionResponse)
@router.get("/predictions/{id}", response_model=ShippingPredictionResponse)
async def get_prediction(id: int):
    raise HTTPException(status_code=404, detail="Not found")
