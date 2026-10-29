from fastapi import APIRouter
from backend.models import SentimentRequest, SentimentResponse
from backend.services.sentiment_service import sentiment_service

router = APIRouter()

@router.post("/analyze", response_model=SentimentResponse)
async def analyze_sentiment(req: SentimentRequest):
    result = sentiment_service.analyze(req.text)
    return SentimentResponse(**result)
