from .pdf_processor import PDFProcessor
from .chunker import TextChunker
from .embeddings import get_embedding_service
from .vector_store import get_vector_store
from .llm_provider import get_llm_provider
from .retriever import Retriever
from .generator import RAGGenerator

class RAGPipeline:
    def __init__(self, retriever: Retriever, generator: RAGGenerator, config: dict = None):
        self.retriever = retriever
        self.generator = generator
        self.config = config or {}

    async def process_query(self, query: str, user_id: str, paper_id: str = None, paper_ids: list = None) -> dict:
        search_papers = paper_ids or ([paper_id] if paper_id else None)
        
        chunks = self.retriever.retrieve(
            query=query,
            user_id=user_id,
            paper_ids=search_papers
        )
        
        if not chunks:
            return {
                "answer": "no information found",
                "citations": [],
                "source_chunks": []
            }
            
        paper_titles = {chunk['paper_id']: f"Paper {chunk['paper_id']}" for chunk in chunks if 'paper_id' in chunk}
        
        result = await self.generator.generate_answer(query, chunks, paper_titles)
        result["source_chunks"] = chunks
        
        return result

    async def process_paper(self, file_path: str, paper_id: str, user_id: str, 
                          pdf_processor: PDFProcessor, chunker: TextChunker, 
                          embedding_service, vector_store) -> dict:
        extract_result = pdf_processor.extract_text(file_path)
        
        cleaned_pages = [pdf_processor.clean_text(p) for p in extract_result['pages']]
        abstract = pdf_processor.detect_abstract(extract_result['text'])
        
        chunks = chunker.chunk_pages(
            pages=cleaned_pages,
            base_metadata={'source': paper_id}
        )
        
        if chunks:
            texts = [c['content'] for c in chunks]
            embeddings = embedding_service.generate_embeddings(texts)
            
            for chunk, emb in zip(chunks, embeddings):
                chunk['embedding'] = emb
                
            vector_store.add_documents(chunks, paper_id, user_id)
            
        return {
            "page_count": extract_result['page_count'],
            "total_chunks": len(chunks),
            "abstract": abstract,
            "metadata": extract_result['metadata']
        }

def get_rag_pipeline(config: dict = None) -> RAGPipeline:
    config = config or {}
    
    embedding_service = get_embedding_service(config)
    vector_store = get_vector_store(config)
    llm_provider = get_llm_provider(config.get('llm_provider', 'mock'))
    
    retriever = Retriever(vector_store, embedding_service)
    generator = RAGGenerator(llm_provider)
    
    return RAGPipeline(retriever, generator, config)
