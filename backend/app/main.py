from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import spotify

app = FastAPI()

origins = [
    "http://localhost:3000",  # Frontend Next.js
    "http://localhost:8000",  # Backend FastAPI
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(spotify.router, prefix="/spotify", tags=["spotify"])


@app.get("/hello")
def read_root():
    return {"Message": "Hello, World"}
