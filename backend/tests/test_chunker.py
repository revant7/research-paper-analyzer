import pytest
from app.rag.chunker import TextChunker, RecursiveCharacterTextSplitter


def test_recursive_character_text_splitter_basic():
    splitter = RecursiveCharacterTextSplitter(chunk_size=50, chunk_overlap=10)
    sample_text = (
        "Retrieval-Augmented Generation (RAG) is an AI framework for retrieving facts from an external knowledge base. "
        "It grounds large language models on specific facts to ensure factual accuracy and reduce hallucination."
    )
    chunks = splitter.split_text(sample_text)
    assert len(chunks) > 1
    for chunk in chunks:
        assert len(chunk) <= 60  # Allows boundary margin


def test_text_chunker_metadata():
    chunker = TextChunker(chunk_size=100, chunk_overlap=20)
    pages = [
        "This is the first page of the research paper discussing transformers and self-attention.",
        "This is the second page explaining cross-entropy loss and empirical evaluation metrics."
    ]
    chunks = chunker.chunk_pages(pages, base_metadata={"paper_id": "test-paper-123", "user_id": "user-456"})
    
    assert len(chunks) >= 2
    for chunk in chunks:
        assert "content" in chunk
        assert "metadata" in chunk
        assert chunk["metadata"]["paper_id"] == "test-paper-123"
        assert chunk["metadata"]["user_id"] == "user-456"
        assert "page_number" in chunk["metadata"]
        assert "chunk_index" in chunk["metadata"]
        assert chunk["metadata"]["total_chunks"] == len(chunks)
