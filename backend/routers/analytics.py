from fastapi import APIRouter
from pydantic import BaseModel
from backend.models import ExecutiveAnalytics
from backend.services.analytics_service import analytics_service

router = APIRouter()

class QueryReq(BaseModel):
    query: str

@router.get("/executive", response_model=ExecutiveAnalytics)
async def get_executive_dashboard():
    result = await analytics_service.get_dashboard()
    return ExecutiveAnalytics(**result)

@router.post("/query")
async def natural_language_query(req: QueryReq):
    return {"answer": f"Simulated answer for: {req.query}"}
