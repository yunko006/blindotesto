import os

from fastapi import FastAPI
from tortoise.contrib.fastapi import register_tortoise

from .api import ping
from .config import Settings, log
from .db import init_db


def create_app() -> FastAPI:
    app = FastAPI()
    settings = Settings()

    app.include_router(ping.router)

    return app


app = create_app()


@app.on_event("startup")
async def startup_event():
    log.info("Starting up...")
    init_db(app)


@app.on_event("shutdown")
async def shutdown_event():
    log.info("Shutting down...")
