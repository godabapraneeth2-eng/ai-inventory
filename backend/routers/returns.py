"""
Phase F router — Returns & Refunds with Vision AI upload.
Supports:
  GET  /api/v1/returns/          — list all returns
  POST /api/v1/returns/          — submit return (JSON, no image)
  POST /api/v1/returns/upload    — submit return with product/damage image
  GET  /api/v1/returns/{id}      — get single return
"""
from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import JSONResponse
from backend.models import ReturnCreateRequest, ReturnResponse
from backend.services.return_service import return_service

router = APIRouter()


@router.get("/", response_model=list[ReturnResponse])
async def list_returns():
    """List all return requests ordered by most recent."""
    data = await return_service.list_returns()
    return [ReturnResponse(**d) for d in data]


@router.post("/", response_model=ReturnResponse)
async def process_return(req: ReturnCreateRequest):
    """Submit a return request (text-only, no image upload)."""
    result = await return_service.process_return(
        order_id=req.order_id,
        customer_id=req.customer_id,
        reason=req.reason,
        damage_type=req.damage_type,
    )
    return ReturnResponse(**result)


@router.post("/upload", response_model=ReturnResponse)
async def process_return_with_image(
    order_id: str = Form(...),
    customer_id: str = Form(...),
    reason: str = Form(...),
    damage_type: str = Form(None),
    product_image: UploadFile = File(None),
    damage_image: UploadFile = File(None),
):
    """
    Submit a return with optional image evidence.
    Vision AI (Gemini or fallback) analyses the image for:
    - cracks / scratches
    - missing accessories
    - wrong product
    - used product
    """
    # Use damage image first, fall back to product image
    image_bytes = None
    image_filename = None
    for upload in [damage_image, product_image]:
        if upload and upload.filename:
            content = await upload.read()
            if content:
                image_bytes = content
                image_filename = upload.filename
                break

    result = await return_service.process_return(
        order_id=order_id,
        customer_id=customer_id,
        reason=reason,
        damage_type=damage_type,
        image_bytes=image_bytes,
        image_filename=image_filename,
    )
    return ReturnResponse(**result)


@router.get("/{return_id}", response_model=ReturnResponse)
async def get_return(return_id: int):
    """Fetch a specific return request by ID."""
    from backend.database import AsyncSessionLocal, ReturnRequest
    from sqlalchemy import select
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(ReturnRequest).where(ReturnRequest.id == return_id)
        )
        row = result.scalar_one_or_none()
        if not row:
            raise HTTPException(status_code=404, detail=f"Return {return_id} not found")
        return ReturnResponse(
            id=row.id,
            order_id=row.order_id,
            customer_name=row.customer_id or "",
            reason=row.reason,
            status=row.status,
            damage_type=row.damage_type,
            confidence=row.confidence or 0.0,
            refund_amount=row.refund_amount or 0.0,
            agent_explanation=row.agent_explanation,
            policy_reference=row.policy_reference,
            created_at=row.created_at.isoformat() if row.created_at else "",
        )
