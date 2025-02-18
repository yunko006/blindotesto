import httpx
from app.config import settings
from fastapi import APIRouter, HTTPException, Query, Request
from urllib.parse import urlencode
from fastapi.responses import RedirectResponse
from app.models.spotify import RefreshTokenRequest, TokenResponse

router = APIRouter()


@router.get("/login")
async def login():
    """
    Initialise le processus d'authentification OAuth2 avec Spotify.

    Cette fonction génère une URL d'autorisation Spotify avec les scopes nécessaires
    et redirige l'utilisateur vers la page de connexion Spotify.

    Scopes requis:
        - user-read-private: Accès aux informations du profil
        - user-read-email: Accès à l'email de l'utilisateur

    Returns:
        RedirectResponse: Redirection vers la page d'authentification Spotify
    """
    # suggester par la doc spotify
    scope = "user-read-private user-read-email"
    params = {
        "response_type": "code",
        "client_id": settings.CLIENT_ID,
        "scope": scope,
        "redirect_uri": settings.REDIRECT_URI,
        "show_dialog": "true",
    }

    auth_url = f"{settings.auth_url}?{urlencode(params)}"
    # return redirect vers spotify api.
    return RedirectResponse(url=auth_url)


@router.get("/callback", response_model=TokenResponse)
async def spotify_callback(
    code: str | None = Query(default=None),
    error: str | None = Query(default=None),
    # state: str | None = Query(default=None),
):
    """
    Endpoint de callback pour l'authentification Spotify OAuth2.

    Args:
        code: Code d'autorisation fourni par Spotify
        error: Message d'erreur potentiel de Spotify

    Returns:
        TokenResponse: Informations du token d'accès Spotify

    Raises:
        HTTPException: Si une erreur survient lors de l'échange du code
    """
    # check en premier si erreur
    if error:
        return {
            "error": error,
        }

    if not code:
        return {
            "error": "no code provided",
        }

    token_url = "https://accounts.spotify.com/api/token"
    data = {
        "code": code,
        "grant_type": "authorization_code",
        "redirect_uri": settings.REDIRECT_URI,
        "client_id": settings.CLIENT_ID,
        "client_secret": settings.CLIENT_SECRET,
    }

    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                token_url,
                data=data,
                headers={"Content-Type": "application/x-www-form-urlencoded"},
            )
            response.raise_for_status()  # Gestion des erreurs
            return response.json()
        except httpx.HTTPError as e:
            return {"error": f"HTTP error occurred: {str(e)}"}

    # c'est le front end qui va gerer l'auth et stocker les tokens
    # # besoin d'interagir avec 3 datas :
    # token_info['acces_token']
    # token_info['refresh_token']
    # # number of second the token will last for
    # token_info['expires_in'] = 3600


@router.post("/refresh-token")
async def refresh_token(request: RefreshTokenRequest):
    """
    Rafraîchit le token d'accès en utilisant le refresh token
    """
    token_url = "https://accounts.spotify.com/api/token"

    data = {
        "grant_type": "refresh_token",
        "refresh_token": request.refresh_token,
        "client_id": settings.CLIENT_ID,
        "client_secret": settings.CLIENT_SECRET,
    }

    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                token_url,
                data=data,
                headers={"Content-Type": "application/x-www-form-urlencoded"},
            )
            response.raise_for_status()
            return response.json()
        except httpx.HTTPError as e:
            raise HTTPException(
                status_code=400,
                detail=f"Erreur lors du rafraîchissement du token: {str(e)}",
            )


@router.get("/playlists")
async def get_playlists(request: Request):
    """
    Récupère les playlists de l'utilisateur connecté.
    """
    access_token = request.headers.get("Authorization")
    if not access_token:
        raise HTTPException(status_code=401, detail="Token manquant")

    playlist_url = "https://api.spotify.com/v1/me/playlists"

    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(
                playlist_url, headers={"Authorization": access_token}
            )
            response.raise_for_status()
            return response.json()
        except httpx.HTTPError as e:
            raise HTTPException(status_code=400, detail=f"Erreur Spotify: {str(e)}")
