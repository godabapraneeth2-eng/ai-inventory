from fastapi import APIRouter, HTTPException
from backend.models import ApprovalResponse, ApprovalActionRequest

router = APIRouter()

@router.get("/", response_model=list[ApprovalResponse])
async def list_approvals():
    return []

@router.post("/{id}/approve", response_model=ApprovalResponse)
async def approve_request(id: int, req: ApprovalActionRequest):
    raise HTTPException(status_code=404, detail="Not found")

@router.post("/{id}/reject", response_model=ApprovalResponse)
async def reject_request(id: int, req: ApprovalActionRequest):
    raise HTTPException(status_code=404, detail="Not found")
