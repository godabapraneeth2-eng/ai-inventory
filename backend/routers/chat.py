from fastapi import APIRouter
from backend.models import ChatRequest, ChatResponse
from backend.agents.chat_agent import chat_agent

router = APIRouter()

@router.post("/", response_model=ChatResponse)
async def chat_endpoint(req: ChatRequest):
    # Dummy chat agent call for now
    reply = chat_agent.handle_message(req.question, req.customer_id)
    return ChatResponse(
        answer=reply,
        context="RAG context here",
        sources=[],
        sentiment="neutral",
        confidence=0.9
    )
