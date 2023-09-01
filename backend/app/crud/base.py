from typing import List, Union
from app.schemas.playlist import PlaylistPayloadSchema
from app.models.playlist import Playlist


async def post(payload: PlaylistPayloadSchema) -> int:
    playlist = Playlist(
        name=payload.name,
        description=payload.description,
        owner=payload.owner,
        spotify_id=payload.spotify_id,
        spotify_uri=payload.spotify_uri,
        tracks=payload.tracks,
    )
    await playlist.save()
    return playlist.id


async def get_all() -> List:
    playlists = await Playlist.all().values()
    return playlists


async def get_one(id: int) -> Union[dict, None]:
    playlist = await Playlist.filter(id=id).first().values()
    print(playlist)
    if playlist:
        return playlist
    return None
