from fastapi import APIRouter
from app.models.pydantic import PlaylistPayloadSchema, PlaylistResponseSchema
from app.crud.base import post


router = APIRouter()


@router.post("/", response_model=PlaylistResponseSchema, status_code=201)
async def create_playlist(payload: PlaylistPayloadSchema) -> PlaylistResponseSchema:
    playlist_id = await post(payload)

    response_object = {"id": playlist_id}
    return response_object
