from backend.rag.embeddings import embedding_model
from backend.rag.vector_store import vector_store

class Retriever:
    def retrieve(self, query: str, top_k: int = 3) -> list:
        emb = embedding_model.embed_text(query)
        results = vector_store.search(emb, n_results=top_k)
        if results and 'documents' in results and results['documents']:
            return results['documents'][0]
        return []

retriever = Retriever()
