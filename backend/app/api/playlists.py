from typing import List
from fastapi import APIRouter
from app.models.pydantic import PlaylistPayloadSchema, PlaylistResponseSchema
from app.crud.base import post, get_all, get_one
from app.models.playlist import PlaylistSchema

router = APIRouter()


@router.post("/", response_model=PlaylistResponseSchema, status_code=201)
async def create_playlist(payload: PlaylistPayloadSchema) -> PlaylistResponseSchema:
    playlist_id = await post(payload)

    response_object = {"id": playlist_id}
    return response_object


@router.get("/", response_model=List[PlaylistSchema])
async def get_all_playlists() -> List[PlaylistSchema]:
    return await get_all()


@router.get("/{id}/", response_model=PlaylistSchema)
async def get_one_playlist(id: int) -> PlaylistSchema:
    playlist = await get_one(id)
    return playlist
