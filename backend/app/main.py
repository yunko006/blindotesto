from typing import Annotated
from fastapi import Depends, FastAPI
from .config import Settings, get_settings


app = FastAPI()
settings = Settings()


@app.get("/ping")
async def pong(settings: Annotated[Settings, Depends(get_settings)]):
    return {
        "ping": "pong!",
        "environment": settings.environment,
        "testing": settings.testing,
    }
