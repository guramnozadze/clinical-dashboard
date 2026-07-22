from fastapi import FastAPI

app = FastAPI(
    title="Clinical Trial Data Dashboard API",
    description="API for managing clinical trial participant data.",
    version="0.1.0",
)


@app.get("/health", tags=["health"])
def health_check() -> dict[str, str]:
    return {"status": "ok"}
