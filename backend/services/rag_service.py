from backend.rag.retriever import retriever
from backend.rag.context_builder import context_builder

class RAGService:
    def process_query(self, query: str, customer_data: dict = None) -> dict:
        docs = retriever.retrieve(query)
        context = context_builder.build(query, docs, customer_data)
        
        # Mocking LLM generation for simplicity
        response = f"Based on our knowledge base, here is the answer: [Mock Generated response using {len(docs)} documents]"
        
        return {
            "answer": response,
            "context_used": context,
            "confidence": 0.85
        }

rag_service = RAGService()
