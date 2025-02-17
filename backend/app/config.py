from dotenv import load_dotenv
from pydantic import BaseSettings
import os

load_dotenv()


class Settings(BaseSettings):
    CLIENT_ID: str = os.getenv("CLIENT_ID")
    CLIENT_SECRET: str = os.getenv("CLIENT_SECRET")
    REDIRECT_URI: str = "http://localhost:8000/callback"
    # ca je suis pas sur encore que ca soit dans settings.
    auth_url: str = "https://accounts.spotify.com/authorize"
    auth_url: str = "https://accounts.spotify.com/api/token"
    api_base_url: str = "https://api.spotify.com/v1/"


# init des settings pour etre accessible partout
settings = Settings()
