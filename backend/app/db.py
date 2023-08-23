import os
import logging

from tortoise import Tortoise, run_async
from tortoise.contrib.fastapi import register_tortoise

log = logging.getLogger("uvicorn")


TORTOISE_ORM = {
    "connections": {"default": os.environ.get("DATABASE_URL")},
    "apps": {
        "models": {
            "models": ["app.models.tortoise", "aerich.models"],
            "default_connection": "default",
        },
        "models_playlist": {
            "models": ["app.models.playlist"],
            "default_connection": "default",
        },
    },
}


def init_db(app) -> None:
    register_tortoise(
        app,
        db_url=os.environ.get("DATABASE_URL"),
        modules={"models": ["app.models.tortoise", "app.models.playlist"]},
        generate_schemas=False,
        add_exception_handlers=True,
    )


# faire les migrations sans passer par les cmds aerich
async def generate_schema() -> None:
    log.info("Initializing Tortoise...")

    await Tortoise.init(
        db_url=os.environ.get("DATABASE_URL"),
        modules={"models": ["app.models.tortoise", "app.models.playlist"]},
    )
    log.info("Generating database schema via Tortoise...")
    await Tortoise.generate_schemas()
    await Tortoise.close_connections()


# pour exec la fnc run_async seulement quand cmd "docker-compose exec backend python app/db.py" dans terminal.
if __name__ == "__main__":
    run_async(generate_schema())
