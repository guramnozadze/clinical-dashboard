from contextlib import asynccontextmanager

from fastapi import FastAPI

import app.models  # noqa: F401  # register ORM models on Base.metadata
from app.database import Base, engine
from app.routers import participants


@asynccontextmanager
async def lifespan(_: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="Clinical Trial Data Dashboard API",
    description="API for managing clinical trial participant data.",
    version="0.1.0",
    lifespan=lifespan,
)

app.include_router(participants.router)


@app.get("/health", tags=["health"])
def health_check() -> dict[str, str]:
    return {"status": "ok"}
