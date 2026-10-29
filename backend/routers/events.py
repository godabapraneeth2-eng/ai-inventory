from fastapi import APIRouter
from backend.models import EventResponse
from backend.database import AsyncSessionLocal, EventLog
from sqlalchemy.future import select

router = APIRouter()

@router.get("/", response_model=list[EventResponse])
async def list_events(limit: int = 10, offset: int = 0):
    async with AsyncSessionLocal() as session:
        stmt = select(EventLog).order_by(EventLog.timestamp.desc()).limit(limit).offset(offset)
        result = await session.execute(stmt)
        events = result.scalars().all()
        return [EventResponse(
            id=e.id, 
            event_type=e.event_type, 
            payload=e.payload, 
            timestamp=e.timestamp.isoformat()
        ) for e in events]
