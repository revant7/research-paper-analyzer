import base64
import hashlib
import hmac
import json
from datetime import datetime, timedelta, timezone
from typing import Dict, Any
import bcrypt
from fastapi import HTTPException, status
from app.config import get_settings

settings = get_settings()

SUPPORTED_JWT_ALGORITHMS = {
    "HS256": hashlib.sha256,
    "HS384": hashlib.sha384,
    "HS512": hashlib.sha512,
}


def _base64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("ascii")


def _base64url_decode(data: str) -> bytes:
    padding = "=" * (-len(data) % 4)
    return base64.urlsafe_b64decode((data + padding).encode("ascii"))


def _json_default(value: Any) -> Any:
    if isinstance(value, datetime):
        return int(value.timestamp())
    raise TypeError(f"Object of type {type(value).__name__} is not JSON serializable")


def _raise_invalid_token() -> None:
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )


def hash_password(password: str) -> str:
    pwd_bytes = password.encode('utf-8')[:72]
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pwd_bytes, salt).decode('utf-8')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        pwd_bytes = plain_password.encode('utf-8')[:72]
        hashed_bytes = hashed_password.encode('utf-8')
        return bcrypt.checkpw(pwd_bytes, hashed_bytes)
    except Exception:
        return False


def create_access_token(data: Dict[str, Any]) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.JWT_EXPIRATION_MINUTES
    )
    to_encode.update({"exp": expire})

    algorithm = settings.JWT_ALGORITHM
    digest = SUPPORTED_JWT_ALGORITHMS.get(algorithm)
    if digest is None:
        raise ValueError(f"Unsupported JWT algorithm: {algorithm}")

    header = {"alg": algorithm, "typ": "JWT"}
    header_segment = _base64url_encode(
        json.dumps(header, separators=(",", ":"), sort_keys=True).encode("utf-8")
    )
    payload_segment = _base64url_encode(
        json.dumps(
            to_encode,
            default=_json_default,
            separators=(",", ":"),
            sort_keys=True,
        ).encode("utf-8")
    )
    signing_input = f"{header_segment}.{payload_segment}".encode("ascii")
    signature = hmac.new(settings.JWT_SECRET_KEY.encode("utf-8"), signing_input, digest).digest()

    return f"{header_segment}.{payload_segment}.{_base64url_encode(signature)}"


def decode_access_token(token: str) -> Dict[str, Any]:
    try:
        header_segment, payload_segment, signature_segment = token.split(".")
        header = json.loads(_base64url_decode(header_segment))
        algorithm = header.get("alg")

        if algorithm != settings.JWT_ALGORITHM:
            _raise_invalid_token()

        digest = SUPPORTED_JWT_ALGORITHMS.get(algorithm)
        if digest is None:
            _raise_invalid_token()

        signing_input = f"{header_segment}.{payload_segment}".encode("ascii")
        expected_signature = hmac.new(
            settings.JWT_SECRET_KEY.encode("utf-8"), signing_input, digest
        ).digest()
        actual_signature = _base64url_decode(signature_segment)
        if not hmac.compare_digest(actual_signature, expected_signature):
            _raise_invalid_token()

        payload = json.loads(_base64url_decode(payload_segment))
        exp = payload.get("exp")
        if exp is not None and datetime.now(timezone.utc).timestamp() > float(exp):
            _raise_invalid_token()

        return payload
    except HTTPException:
        raise
    except Exception:
        _raise_invalid_token()
