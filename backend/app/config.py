import asyncio
from functools import lru_cache
import logging
import os
import asyncpg
from pydantic import AnyUrl

from pydantic_settings import BaseSettings

log = logging.getLogger("uvicorn")


# def check_database_status():
#     try:
#         # Replace these with your own database connection parameters
#         database_uri = "postgresql://postgres:postgres@db:5432/web_dev"

#         conn = psycopg2.connect(database_uri)

#         # Check if the connection is established
#         if conn:
#             log.info("db opérationnel")
#             conn.close()

#     except asyncpg.PostgresError as e:
#         log.info(f"Error: {e}")
#         log.info("Database is not running.")


class Settings(BaseSettings):
    environment: str = os.getenv("ENVIRONMENT", "dev")
    testing: bool = os.getenv("TESTING", 0)
    database_url: AnyUrl = os.environ.get("DATABASE_URL")


@lru_cache()
def get_settings() -> BaseSettings:
    log.info("Loading config settings from the environment...")
    # check_database_status()
    return Settings()
