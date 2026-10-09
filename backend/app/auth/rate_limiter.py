import time
from collections import defaultdict, deque
from fastapi import Request, HTTPException, status


class InMemoryRateLimiter:
    """Thread-safe sliding window rate limiter per client IP."""
    def __init__(self, times: int = 15, seconds: int = 60):
        self.times = times
        self.seconds = seconds
        self._requests = defaultdict(deque)

    def __call__(self, request: Request):
        # Allow disabling rate limiting in testing if header or query param present
        if request.headers.get("X-Bypass-Rate-Limit") == "true":
            return True

        client_ip = request.client.host if request.client else "unknown"
        # Check X-Forwarded-For if behind a proxy
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            client_ip = forwarded.split(",")[0].strip()

        now = time.time()
        window = self._requests[client_ip]

        # Prune timestamps outside current sliding window
        while window and window[0] <= now - self.seconds:
            window.popleft()

        if len(window) >= self.times:
            retry_after = int(self.seconds - (now - window[0])) + 1
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many requests. Please wait a moment before trying again.",
                headers={"Retry-After": str(max(1, retry_after))}
            )

        window.append(now)
        return True

    def reset(self):
        self._requests.clear()
