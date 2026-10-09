from .vector_store import VectorStore
from .embeddings import EmbeddingService

class Retriever:
    def __init__(self, vector_store: VectorStore, embedding_service: EmbeddingService):
        self.vector_store = vector_store
        self.embedding_service = embedding_service

    def retrieve(self, query: str, user_id: str, top_k: int = 5, paper_ids: list = None) -> list:
        query_embedding = self.embedding_service.generate_embedding(query)
        results = self.vector_store.search(
            query_embedding=query_embedding,
            user_id=user_id,
            top_k=top_k,
            paper_ids=paper_ids
        )
        
        formatted_results = []
        for res in results:
            formatted_results.append({
                'content': res['content'],
                'paper_id': res['metadata'].get('paper_id'),
                'page_number': res['metadata'].get('page_number'),
                'chunk_index': res['metadata'].get('chunk_index'),
                'score': res['score']
            })
            
        return formatted_results
