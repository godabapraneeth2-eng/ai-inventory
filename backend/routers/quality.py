from fastapi import APIRouter, HTTPException
from typing import Optional
from pydantic import BaseModel
from backend.models import QualityInspectionResponse
from backend.services.quality_service import quality_service

router = APIRouter()

class InspectReq(BaseModel):
    order_id: str
    sku: Optional[str] = "UNKNOWN"
    expected_quantity: Optional[int] = 1

@router.get("/", response_model=list[QualityInspectionResponse])
@router.get("/inspections", response_model=list[QualityInspectionResponse])
async def list_inspections():
    data = await quality_service.list_inspections()
    return [QualityInspectionResponse(**item) for item in data]

@router.post("/inspect", response_model=QualityInspectionResponse)
async def inspect_quality(req: InspectReq):
    result = await quality_service.inspect(
        order_id=req.order_id,
        sku=req.sku or "UNKNOWN",
        expected_quantity=req.expected_quantity or 1
    )
    return QualityInspectionResponse(**result)

@router.get("/{id}", response_model=QualityInspectionResponse)
@router.get("/inspections/{id}", response_model=QualityInspectionResponse)
async def get_inspection(id: int):
    raise HTTPException(status_code=404, detail="Not found")
