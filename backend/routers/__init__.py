from fastapi import APIRouter
from backend.routers import chat, sentiment, returns, fraud, procurement, shipping, quality, analytics, events, observability, ws, approvals

router = APIRouter()
router.include_router(chat.router, prefix="/chat", tags=["chat"])
router.include_router(sentiment.router, prefix="/sentiment", tags=["sentiment"])
router.include_router(returns.router, prefix="/returns", tags=["returns"])
router.include_router(fraud.router, prefix="/fraud", tags=["fraud"])
router.include_router(procurement.router, prefix="/procurement", tags=["procurement"])
router.include_router(shipping.router, prefix="/shipping", tags=["shipping"])
router.include_router(quality.router, prefix="/quality", tags=["quality"])
router.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
router.include_router(events.router, prefix="/events", tags=["events"])
router.include_router(observability.router, prefix="/observability", tags=["observability"])
router.include_router(ws.router, prefix="/ws", tags=["ws"])
router.include_router(approvals.router, prefix="/approvals", tags=["approvals"])
