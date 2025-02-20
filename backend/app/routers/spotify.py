from fastapi import APIRouter, HTTPException, Request
from app.utils.spotify_requests import get_request_helper

router = APIRouter()


@router.get("/playlists")
async def get_playlists(request: Request):
    """
    Récupère les playlists de l'utilisateur connecté.
    """
    access_token = request.headers.get("Authorization")
    if not access_token:
        raise HTTPException(status_code=401, detail="Token manquant")

    playlist_url = "https://api.spotify.com/v1/me/playlists"
    headers = {"Authorization": access_token}

    return await get_request_helper(playlist_url, headers)


@router.get("/playlists/{playlist_id}/tracks")
async def get_playlist_tracks(playlist_id: str, request: Request):
    """
    Récupère les chansons d'une playlist spécifique.
    """
    access_token = request.headers.get("Authorization")
    if not access_token:
        raise HTTPException(status_code=401, detail="Token manquant")

    tracks_url = f"https://api.spotify.com/v1/playlists/{playlist_id}/tracks"
    headers = {"Authorization": access_token}

    return await get_request_helper(tracks_url, headers)
