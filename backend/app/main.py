import os
from typing import Annotated

from fastapi import Depends, FastAPI
from tortoise.contrib.fastapi import register_tortoise

from .config import Settings, get_settings


app = FastAPI()
settings = Settings()

register_tortoise(
    app,
    db_url=os.environ.get("DATABASE_URL"),
    modules={"models": ["app.models.tortoise", "app.models.playlist"]},
    generate_schemas=True,
    add_exception_handlers=True,
)


@app.get("/ping")
async def pong(settings: Annotated[Settings, Depends(get_settings)]):
    return {
        "ping": "pongping!",
        "environment": settings.environment,
        "testing": settings.testing,
    }
