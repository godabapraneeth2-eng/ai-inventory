from backend.config import settings
from typing import List, Dict, Any
import math

class VectorStore:
    def __init__(self):
        self.collection = None
        self._memory_docs: List[Dict[str, Any]] = []
        try:
            import chromadb
            self.client = chromadb.PersistentClient(path=settings.CHROMA_DB_PATH)
            self.collection = self.client.get_or_create_collection("enterprise_docs")
        except Exception:
            self.collection = None

    def add_document(self, doc_id: str, embedding: list, text: str, metadata: dict = None):
        if self.collection is not None:
            try:
                self.collection.add(
                    ids=[doc_id],
                    embeddings=[embedding],
                    documents=[text],
                    metadatas=[metadata or {}]
                )
                return
            except Exception:
                pass
        
        # In-memory vector store fallback
        self._memory_docs.append({
            "id": doc_id,
            "embedding": embedding,
            "document": text,
            "metadata": metadata or {}
        })

    def search(self, embedding: list, n_results: int = 3):
        if self.collection is not None:
            try:
                return self.collection.query(
                    query_embeddings=[embedding],
                    n_results=n_results
                )
            except Exception:
                pass
        
        # Cosine similarity in-memory search
        scored = []
        for doc in self._memory_docs:
            e = doc["embedding"]
            dot = sum(a * b for a, b in zip(embedding, e))
            norm_a = math.sqrt(sum(a * a for a in embedding)) or 1.0
            norm_b = math.sqrt(sum(b * b for b in e)) or 1.0
            sim = dot / (norm_a * norm_b)
            scored.append((sim, doc))
        
        scored.sort(key=lambda x: x[0], reverse=True)
        top = scored[:n_results]
        return {
            "ids": [[d[1]["id"] for d in top]],
            "documents": [[d[1]["document"] for d in top]],
            "metadatas": [[d[1]["metadata"] for d in top]],
            "distances": [[1.0 - d[0] for d in top]]
        }

vector_store = VectorStore()
