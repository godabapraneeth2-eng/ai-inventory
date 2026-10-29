import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import structlog
from backend.database import init_db
from backend.routers import router as api_router
from backend.middleware.auth import AuthMiddleware
from backend.middleware.logging import LoggingMiddleware

logger = structlog.get_logger()

app = FastAPI(title="Nexus AI Enterprise Platform", version="2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(AuthMiddleware)
app.add_middleware(LoggingMiddleware)

app.include_router(api_router, prefix="/api/v1")

@app.get("/health")
async def health_check():
    return {"status": "ok", "version": "2.0"}

@app.on_event("startup")
async def startup_event():
    await init_db()
    logger.info("application_startup", status="Database initialized and seeding demo data if necessary")

if __name__ == "__main__":
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
