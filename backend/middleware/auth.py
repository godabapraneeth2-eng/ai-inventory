from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware

class AuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Demo mode: bypass real auth, just check x-role header
        role = request.headers.get("x-role", "customer")
        request.state.user_role = role
        response = await call_next(request)
        return response
