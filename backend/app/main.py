from .db import init_db
import logging
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from tortoise.contrib.fastapi import register_tortoise

from .api import ping, playlists
from .config import Settings


log = logging.getLogger("uvicorn")


# @asynccontextmanager
# async def lifespan(app: FastAPI):
#     # startup event
#     log.info("Chargement de l'application...")
#     init_db(app)
#     log.info("db init...")
#     yield
#     # event after shutdown
#     log.info("Arret de l'app en cours...")


def create_app() -> FastAPI:
    app = FastAPI()  # lifespan=lifespan)
    settings = Settings()

    app.include_router(ping.router)
    app.include_router(playlists.router, prefix="/playlists", tags=["playlists"])
    return app


app = create_app()


@app.on_event("startup")
async def startup_event():
    log.info("Starting up...")
    init_db(app)


@app.on_event("shutdown")
async def shutdown_event():
    log.info("Shutting down...")
