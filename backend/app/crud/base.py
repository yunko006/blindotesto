from app.models.pydantic import PlaylistPayloadSchema
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
