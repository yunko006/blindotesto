import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from tortoise.contrib.fastapi import register_tortoise

from .api import ping
from .config import Settings, log
from .db import init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    # startup event
    log.info("Chargement de l'application...")
    init_db(app)
    log.info("db init...")
    yield
    # event after shutdown
    log.info("Arret de l'app en cours...")


def create_app() -> FastAPI:
    app = FastAPI(lifespan=lifespan)
    settings = Settings()

    app.include_router(ping.router)

    return app


app = create_app()
