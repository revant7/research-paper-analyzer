import os
import json
import numpy as np
import logging

logger = logging.getLogger(__name__)

try:
    import chromadb
except ImportError:
    chromadb = None


class FallbackVectorStore:
    """Persistent lightweight vector store used when ChromaDB is not installed."""
    def __init__(self, persist_dir: str):
        self.persist_dir = persist_dir
        os.makedirs(persist_dir, exist_ok=True)
        self.storage_file = os.path.join(persist_dir, "vector_store.json")
        self.data = self._load()

    def _load(self):
        if os.path.exists(self.storage_file):
            try:
                with open(self.storage_file, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception as e:
                logger.warning(f"Failed to load vector store: {e}")
        return {}

    def _save(self):
        try:
            with open(self.storage_file, "w", encoding="utf-8") as f:
                json.dump(self.data, f, ensure_ascii=False)
        except Exception as e:
            logger.error(f"Failed to save vector store: {e}")

    def add_documents(self, documents: list, paper_id: str, user_id: str) -> None:
        self.delete_paper_documents(paper_id)
        for i, doc in enumerate(documents):
            chunk_id = f"{paper_id}_chunk_{i}"
            meta = doc.get('metadata', {}).copy()
            meta['user_id'] = user_id
            meta['paper_id'] = paper_id
            self.data[chunk_id] = {
                'id': chunk_id,
                'content': doc['content'],
                'metadata': meta,
                'embedding': doc.get('embedding', [])
            }
        self._save()

    def search(self, query_embedding: list, user_id: str, top_k: int = 5, paper_ids: list = None, similarity_threshold: float = 0.3) -> list:
        q_vec = np.array(query_embedding, dtype=np.float32)
        q_norm = np.linalg.norm(q_vec)
        if q_norm > 0:
            q_vec = q_vec / q_norm

        results = []
        for chunk_id, item in self.data.items():
            meta = item.get('metadata', {})
            if meta.get('user_id') != user_id:
                continue
            if paper_ids and meta.get('paper_id') not in paper_ids:
                continue
            
            emb = item.get('embedding')
            if not emb:
                continue

            doc_vec = np.array(emb, dtype=np.float32)
            d_norm = np.linalg.norm(doc_vec)
            if d_norm > 0:
                doc_vec = doc_vec / d_norm

            sim = float(np.dot(q_vec, doc_vec))
            # Cosine similarity clamped to [0.0, 1.0]
            sim_score = max(0.0, min(1.0, sim))
            if sim_score >= similarity_threshold:
                results.append({
                    'content': item['content'],
                    'metadata': meta,
                    'score': sim_score
                })

        results.sort(key=lambda x: x['score'], reverse=True)
        return results[:top_k]

    def delete_paper_documents(self, paper_id: str) -> None:
        to_delete = [k for k, v in self.data.items() if v.get('metadata', {}).get('paper_id') == paper_id]
        for k in to_delete:
            del self.data[k]
        self._save()

    def get_paper_chunk_count(self, paper_id: str) -> int:
        return sum(1 for v in self.data.values() if v.get('metadata', {}).get('paper_id') == paper_id)


class VectorStore:
    def __init__(self, persist_dir: str, collection_name: str = 'research_papers'):
        self.persist_dir = persist_dir
        if chromadb is not None:
            try:
                self.client = chromadb.PersistentClient(path=persist_dir)
                self.collection = self.client.get_or_create_collection(name=collection_name)
                self._backend = 'chroma'
            except Exception as e:
                logger.warning(f"Could not init chromadb client: {e}. Falling back to lightweight store.")
                self._fallback = FallbackVectorStore(persist_dir)
                self._backend = 'fallback'
        else:
            self._fallback = FallbackVectorStore(persist_dir)
            self._backend = 'fallback'

    def add_documents(self, documents: list, paper_id: str, user_id: str) -> None:
        if not documents:
            return
        # Idempotent ingestion: clear existing paper documents first
        self.delete_paper_documents(paper_id)

        if self._backend == 'fallback':
            return self._fallback.add_documents(documents, paper_id, user_id)
            
        ids = []
        embeddings = []
        metadatas = []
        contents = []
        
        for i, doc in enumerate(documents):
            ids.append(f"{paper_id}_chunk_{i}")
            if 'embedding' in doc:
                embeddings.append(doc['embedding'])
                
            meta = doc.get('metadata', {}).copy()
            meta['user_id'] = user_id
            meta['paper_id'] = paper_id
            metadatas.append(meta)
            contents.append(doc['content'])
            
        if embeddings:
            self.collection.add(ids=ids, embeddings=embeddings, metadatas=metadatas, documents=contents)
        else:
            self.collection.add(ids=ids, metadatas=metadatas, documents=contents)

    def search(self, query_embedding: list, user_id: str, top_k: int = 5, paper_ids: list = None, similarity_threshold: float = 0.3) -> list:
        if self._backend == 'fallback':
            return self._fallback.search(query_embedding, user_id, top_k, paper_ids, similarity_threshold)

        filters = [{'user_id': user_id}]
        if paper_ids:
            if len(paper_ids) == 1:
                filters.append({'paper_id': paper_ids[0]})
            else:
                filters.append({'paper_id': {'$in': paper_ids}})
        
        where_clause = {'$and': filters} if len(filters) > 1 else filters[0]
                
        results = self.collection.query(
            query_embeddings=[query_embedding],
            n_results=top_k,
            where=where_clause,
            include=['documents', 'metadatas', 'distances']
        )
        
        formatted_results = []
        if results['documents'] and results['documents'][0]:
            for doc, meta, dist in zip(results['documents'][0], results['metadatas'][0], results['distances'][0]):
                similarity = max(0.0, min(1.0, 1.0 - dist)) if dist <= 1 else 0.0
                if similarity >= similarity_threshold:
                    formatted_results.append({
                        'content': doc,
                        'metadata': meta,
                        'score': similarity
                    })
                    
        return sorted(formatted_results, key=lambda x: x['score'], reverse=True)

    def delete_paper_documents(self, paper_id: str) -> None:
        if self._backend == 'fallback':
            return self._fallback.delete_paper_documents(paper_id)
        self.collection.delete(where={'paper_id': paper_id})

    def get_paper_chunk_count(self, paper_id: str) -> int:
        if self._backend == 'fallback':
            return self._fallback.get_paper_chunk_count(paper_id)
        results = self.collection.get(where={'paper_id': paper_id}, include=[])
        return len(results['ids']) if results and 'ids' in results else 0


_vector_store_instance = None


def get_vector_store(config: dict = None) -> VectorStore:
    global _vector_store_instance
    if _vector_store_instance is None:
        persist_dir = config.get('chroma_persist_dir', './chroma_data') if config else './chroma_data'
        collection_name = config.get('collection_name', 'research_papers') if config else 'research_papers'
        _vector_store_instance = VectorStore(persist_dir, collection_name)
    return _vector_store_instance
