try:
    from langchain.text_splitter import RecursiveCharacterTextSplitter
except ImportError:
    class RecursiveCharacterTextSplitter:
        def __init__(self, chunk_size=1000, chunk_overlap=200, separators=None):
            self.chunk_size = chunk_size
            self.chunk_overlap = chunk_overlap
            self.separators = separators or ["\n\n", "\n", ". ", " ", ""]

        def split_text(self, text: str) -> list:
            if not text:
                return []
            if len(text) <= self.chunk_size:
                return [text]
            
            chunks = []
            start = 0
            text_len = len(text)
            
            while start < text_len:
                end = min(start + self.chunk_size, text_len)
                if end < text_len:
                    # Look for natural separator near the end
                    found_split = False
                    for sep in self.separators:
                        if not sep:
                            continue
                        sep_idx = text.rfind(sep, start + self.chunk_overlap, end)
                        if sep_idx != -1:
                            end = sep_idx + len(sep)
                            found_split = True
                            break
                chunk = text[start:end].strip()
                if chunk:
                    chunks.append(chunk)
                if end >= text_len:
                    break
                start = max(start + 1, end - self.chunk_overlap)
            return chunks


class TextChunker:
    def __init__(self, chunk_size=1000, chunk_overlap=200):
        self.splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            separators=["\n\n", "\n", ". ", " ", ""]
        )

    def chunk_text(self, text: str, metadata: dict = None) -> list:
        chunks = self.splitter.split_text(text)
        metadata = metadata or {}
        return [
            {
                'content': chunk,
                'metadata': {
                    **metadata,
                    'chunk_index': i,
                    'total_chunks': len(chunks)
                }
            }
            for i, chunk in enumerate(chunks)
        ]

    def chunk_pages(self, pages: list, base_metadata: dict = None) -> list:
        base_metadata = base_metadata or {}
        all_chunks = []
        global_chunk_index = 0
        
        for page_num, page_text in enumerate(pages, 1):
            page_chunks = self.splitter.split_text(page_text)
            for chunk in page_chunks:
                all_chunks.append({
                    'content': chunk,
                    'metadata': {
                        **base_metadata,
                        'page_number': page_num,
                        'chunk_index': global_chunk_index
                    }
                })
                global_chunk_index += 1
                
        for chunk in all_chunks:
            chunk['metadata']['total_chunks'] = len(all_chunks)
            
        return all_chunks
