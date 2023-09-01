from typing import List, Union
from app.schemas.playlist import PlaylistPayloadSchema
from app.models.playlist import Playlist

from app.schemas.user import UserPayloadSchema
from app.models.user import User
from app.models.key import ApiKey


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


async def user_post(payload: UserPayloadSchema) -> int:
    # genere et print la clé pour etre sur
    api_key = ApiKey.generate_api_key()
    print(api_key)
    print(type(api_key))
    # créer une instance ApiKey
    api_key_instance = ApiKey(secret_key=api_key)

    # enregistrez instance dans la db
    await api_key_instance.save()

    user = User(
        username=payload.username,
        hashed_password=payload.password,
        # utilise l'instance pour init la foreignKey != le str
        api_key=api_key_instance,
    )
    await user.save()
    return user.id


async def get_one_user(id: int) -> Union[dict, None]:
    user = await User.filter(id=id).first().values()
    print(user)
    if user:
        return user
    return None
