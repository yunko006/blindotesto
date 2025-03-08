from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import spotify, oauth, websockets

app = FastAPI()

origins = [
    "http://localhost:3000",  # Frontend Next.js
    "http://localhost:8000",  # Backend FastAPI
    "ws://localhost:3000",  # WebSockets depuis Next.js
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(spotify.router, prefix="/spotify", tags=["spotify"])
app.include_router(oauth.router, prefix="/auth", tags=["authentication"])
app.include_router(websockets.router, prefix="/ws", tags=["websockets"])


@app.get("/hello")
def read_root():
    return {"Message": "Hello, World"}
