import os
import uuid
import shutil
from pathlib import Path
from fastapi import UploadFile, HTTPException
from app.config import get_settings

settings = get_settings()

def ensure_upload_dir() -> str:
    upload_dir = Path(settings.UPLOAD_DIR)
    upload_dir.mkdir(parents=True, exist_ok=True)
    return str(upload_dir)


def generate_file_path(user_id: uuid.UUID, filename: str) -> str:
    ensure_upload_dir()
    unique_prefix = str(uuid.uuid4())
    safe_filename = filename.replace(" ", "_")
    return os.path.join(settings.UPLOAD_DIR, f"{user_id}_{unique_prefix}_{safe_filename}")


def validate_pdf(file: UploadFile) -> None:
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")
    if file.content_type != 'application/pdf':
        raise HTTPException(status_code=400, detail="Invalid file type. Expected application/pdf")


def get_file_size_mb(file_path: str) -> float:
    if not os.path.exists(file_path):
        return 0.0
    size_bytes = os.path.getsize(file_path)
    return size_bytes / (1024 * 1024)


def cleanup_file(file_path: str) -> None:
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
    except Exception as e:
        print(f"Error cleaning up file {file_path}: {e}")
