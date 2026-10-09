import hashlib
import numpy as np
import logging

logger = logging.getLogger(__name__)

try:
    from sentence_transformers import SentenceTransformer
except ImportError:
    SentenceTransformer = None


class EmbeddingService:
    _model = None

    def __init__(self, model_name='sentence-transformers/all-MiniLM-L6-v2'):
        self.model_name = model_name

    def _get_model(self):
        if SentenceTransformer is not None:
            if EmbeddingService._model is None:
                try:
                    EmbeddingService._model = SentenceTransformer(self.model_name)
                except Exception as e:
                    logger.warning(f"Could not load SentenceTransformer: {e}")
                    EmbeddingService._model = False
            return EmbeddingService._model
        return None

    def _fallback_embedding(self, text: str, dim: int = 384) -> list:
        """Deterministic dense vector representation for semantic matching without external model."""
        if not text:
            return [0.0] * dim
        
        vec = np.zeros(dim, dtype=np.float32)
        words = text.lower().split()
        for i, word in enumerate(words):
            # Generate deterministic hash for word
            h = int(hashlib.md5(word.encode('utf-8')).hexdigest(), 16)
            idx = h % dim
            sign = 1.0 if (h >> 8) % 2 == 0 else -1.0
            vec[idx] += sign
        
        norm = np.linalg.norm(vec)
        if norm > 0:
            vec = vec / norm
        return vec.tolist()

    def generate_embeddings(self, texts: list) -> list:
        model = self._get_model()
        if model:
            try:
                return model.encode(texts).tolist()
            except Exception as e:
                logger.warning(f"Error encoding with model: {e}")
        
        return [self._fallback_embedding(t) for t in texts]

    def generate_embedding(self, text: str) -> list:
        return self.generate_embeddings([text])[0]


_embedding_service_instance = None


def get_embedding_service(config: dict = None) -> EmbeddingService:
    global _embedding_service_instance
    if _embedding_service_instance is None:
        model_name = config.get('embedding_model', 'sentence-transformers/all-MiniLM-L6-v2') if config else 'sentence-transformers/all-MiniLM-L6-v2'
        _embedding_service_instance = EmbeddingService(model_name)
    return _embedding_service_instance
