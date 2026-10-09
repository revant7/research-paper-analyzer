import pymupdf as fitz
try:
    import pdfplumber
except ImportError:
    pdfplumber = None
import re
import os

class PDFProcessor:
    def extract_text(self, file_path: str) -> dict:
        result = {'text': '', 'pages': [], 'page_count': 0, 'metadata': {}}
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File not found: {file_path}")
            
        try:
            doc = fitz.open(file_path)
            result['page_count'] = len(doc)
            for page in doc:
                text = page.get_text() or ""
                result['pages'].append(text)
                result['text'] += text + "\n"
            result['metadata'] = self.extract_metadata(file_path)
            
            if not result['text'].strip():
                raise ValueError("Empty text extracted with PyMuPDF")
        except Exception as e:
            if pdfplumber:
                try:
                    with pdfplumber.open(file_path) as pdf:
                        result['pages'] = [page.extract_text() or "" for page in pdf.pages]
                        result['text'] = "\n".join(result['pages'])
                        result['page_count'] = len(pdf.pages)
                except Exception as e2:
                    raise RuntimeError(f"Failed to extract text: {e}, {e2}")
            else:
                raise RuntimeError(f"Failed to extract text from PDF: {e}")
                
        return result

    def extract_metadata(self, file_path: str) -> dict:
        try:
            doc = fitz.open(file_path)
            return {
                'title': doc.metadata.get('title', ''),
                'authors': doc.metadata.get('author', ''),
                'subject': doc.metadata.get('subject', ''),
                'creation_date': doc.metadata.get('creationDate', '')
            }
        except Exception:
            return {}

    def clean_text(self, text: str) -> str:
        text = re.sub(r'\s+', ' ', text)
        text = ''.join(char for char in text if ord(char) >= 32 or char == '\n')
        return text.strip()

    def validate_pdf(self, file_path: str) -> bool:
        if not os.path.exists(file_path):
            return False
        try:
            doc = fitz.open(file_path)
            return len(doc) > 0
        except Exception:
            return False

    def detect_abstract(self, text: str) -> str:
        match = re.search(r'(?i)\babstract\b[\s\S]*?(?=\b(?:introduction|background|1\.)\b)', text)
        return match.group(0) if match else ""
