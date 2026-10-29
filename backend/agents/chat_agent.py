from backend.services.rag_service import rag_service
from backend.services.sentiment_service import sentiment_service

class ChatAgent:
    def handle_message(self, message: str, customer_id: str = None) -> str:
        sentiment_info = sentiment_service.analyze(message)
        rag_info = rag_service.process_query(message, {"customer_id": customer_id})
        
        reply = rag_info['answer']
        if sentiment_info['sentiment'] == 'angry':
            reply = "I apologize for the frustration. " + reply
            
        return reply

chat_agent = ChatAgent()
