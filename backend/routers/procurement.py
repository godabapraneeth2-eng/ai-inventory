from fastapi import APIRouter, HTTPException
from typing import Optional
from pydantic import BaseModel
from backend.models import PurchaseOrderResponse
from backend.services.procurement_service import procurement_service
from backend.database import AsyncSessionLocal, PurchaseOrder
from sqlalchemy import select

router = APIRouter()

class GenerateReq(BaseModel):
    product_name: Optional[str] = "MacBook Pro"
    sku: Optional[str] = "SKU-001"
    current_stock: Optional[int] = 5
    reorder_point: Optional[int] = 10

@router.get("/", response_model=list[PurchaseOrderResponse])
@router.get("/orders", response_model=list[PurchaseOrderResponse])
async def list_orders():
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(PurchaseOrder).order_by(PurchaseOrder.created_at.desc()).limit(50))
        rows = result.scalars().all()
        return [
            PurchaseOrderResponse(
                id=r.id,
                product_name=r.product_name,
                sku=r.sku,
                quantity=r.quantity,
                unit_cost=float(r.unit_cost or 0.0),
                total_cost=float(r.total_cost or 0.0),
                supplier=r.supplier,
                status=r.status,
                estimated_delivery=r.estimated_delivery or "",
                created_at=r.created_at.isoformat() if r.created_at else "",
            )
            for r in rows
        ]

@router.post("/generate", response_model=PurchaseOrderResponse)
async def generate_po(req: Optional[GenerateReq] = None):
    p_name = req.product_name if req else "MacBook Pro"
    s = req.sku if req else "SKU-001"
    cs = req.current_stock if req else 5
    rp = req.reorder_point if req else 10
    result = await procurement_service.generate_po(p_name, s, cs, rp)
    return PurchaseOrderResponse(**result)

@router.get("/{id}", response_model=PurchaseOrderResponse)
@router.get("/orders/{id}", response_model=PurchaseOrderResponse)
async def get_order(id: int):
    raise HTTPException(status_code=404, detail="Not found")
