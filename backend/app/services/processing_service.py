import logging
import asyncio
from app.database.database import AsyncSessionLocal
from app.models.paper import Paper
from app.rag.pdf_processor import PDFProcessor
from app.rag.chunker import TextChunker
from app.rag.embeddings import get_embedding_service
from app.rag.vector_store import get_vector_store
from app.config import get_settings
from sqlalchemy import select
import uuid

logger = logging.getLogger(__name__)
settings = get_settings()

class ProcessingService:
    async def process_paper(self, paper_id: str, file_path: str, user_id: str):
        async with AsyncSessionLocal() as db:
            try:
                # Update status to processing
                stmt = select(Paper).where(Paper.id == str(paper_id))
                result = await db.execute(stmt)
                paper = result.scalar_one_or_none()
                if not paper:
                    logger.error(f"Paper {paper_id} not found")
                    return
                
                paper.processing_status = "processing"
                await db.commit()
                
                # Extract text offloaded to threadpool
                processor = PDFProcessor()
                is_valid = await asyncio.to_thread(processor.validate_pdf, file_path)
                if not is_valid:
                    raise ValueError("Invalid or corrupted PDF file")
                
                extracted = await asyncio.to_thread(processor.extract_text, file_path)
                text = await asyncio.to_thread(processor.clean_text, extracted['text'])
                
                if not text.strip():
                    raise ValueError("No extractable text found in PDF")
                
                abstract = await asyncio.to_thread(processor.detect_abstract, text)
                page_count = extracted['page_count']
                metadata = extracted.get('metadata', {})
                
                # Update paper metadata
                if metadata.get('title'):
                    paper.title = metadata['title']
                if metadata.get('authors'):
                    paper.authors = metadata['authors']
                paper.abstract = abstract
                paper.page_count = page_count
                await db.commit()
                
                # Chunk text offloaded to threadpool
                chunker = TextChunker(
                    chunk_size=settings.CHUNK_SIZE,
                    chunk_overlap=settings.CHUNK_OVERLAP
                )
                chunks = await asyncio.to_thread(
                    chunker.chunk_pages,
                    pages=extracted['pages'],
                    base_metadata={'paper_id': paper_id, 'user_id': user_id}
                )
                
                if not chunks:
                    raise ValueError("Text chunking produced no chunks")
                
                # Generate embeddings offloaded to threadpool
                embedding_service = get_embedding_service()
                texts = [c['content'] for c in chunks]
                embeddings = await asyncio.to_thread(embedding_service.generate_embeddings, texts)
                
                # Store in vector DB offloaded to threadpool
                vector_store = get_vector_store()
                documents = []
                for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
                    chunk['metadata']['chunk_id'] = f"{paper_id}_chunk_{i}"
                    documents.append({
                        'content': chunk['content'],
                        'metadata': chunk['metadata'],
                        'embedding': embedding
                    })
                
                await asyncio.to_thread(
                    vector_store.add_documents,
                    documents=documents,
                    paper_id=paper_id,
                    user_id=user_id
                )
                
                # Update status to completed
                paper.processing_status = "completed"
                paper.total_chunks = len(chunks)
                await db.commit()
                
                logger.info(f"Paper {paper_id} processed: {page_count} pages, {len(chunks)} chunks")
                
            except Exception as e:
                logger.exception(f"Processing failed for paper {paper_id}: {e}")
                try:
                    stmt = select(Paper).where(Paper.id == str(paper_id))
                    result = await db.execute(stmt)
                    paper = result.scalar_one_or_none()
                    if paper:
                        paper.processing_status = "failed"
                        paper.processing_error = "Processing failed: PDF extraction or indexing error"
                        await db.commit()
                except Exception:
                    pass
