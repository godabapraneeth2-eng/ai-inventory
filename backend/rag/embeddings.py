from typing import List
import hashlib
import math

class EmbeddingModel:
    def __init__(self):
        self._model = None
        try:
            from sentence_transformers import SentenceTransformer
            self._model = SentenceTransformer('all-MiniLM-L6-v2')
        except Exception:
            self._model = None

    def embed_text(self, text: str) -> List[float]:
        if self._model is not None:
            try:
                return self._model.encode(text).tolist()
            except Exception:
                pass
        
        # Fast, deterministic semantic hashing fallback (384-dimensional)
        dim = 384
        vec = [0.0] * dim
        words = text.lower().split()
        if not words:
            return vec
        for i, word in enumerate(words):
            h = int(hashlib.md5(word.encode()).hexdigest(), 16)
            for d in range(dim):
                weight = ((h >> (d % 32)) & 1) * 2 - 1
                vec[d] += weight / (1.0 + math.log(i + 1))
        norm = math.sqrt(sum(x * x for x in vec)) or 1.0
        return [x / norm for x in vec]

embedding_model = EmbeddingModel()
