from base64 import b64encode
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import RedirectResponse
from app.config import settings
from app.models.spotify import RefreshTokenRequest, TokenResponse
from urllib.parse import urlencode
from app.utils.spotify_requests import post_request_helper

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
    scope = (
        "streaming"
        " user-read-private"
        " user-read-email"
        " user-read-playback-state"
        " user-modify-playback-state"
    )
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
        raise HTTPException(status_code=400, detail=error)
    if not code:
        raise HTTPException(status_code=400, detail="No code provided")

    token_url = "https://accounts.spotify.com/api/token"
    data = {
        "code": code,
        "grant_type": "authorization_code",
        "redirect_uri": settings.REDIRECT_URI,
        "client_id": settings.CLIENT_ID,
        "client_secret": settings.CLIENT_SECRET,
    }
    headers = {"Content-Type": "application/x-www-form-urlencoded"}

    result = await post_request_helper(token_url, data, headers)

    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])

    return result

    # c'est le front end qui va gerer l'auth et stocker les tokens
    # # besoin d'interagir avec 3 datas :
    # token_info['acces_token']
    # token_info['refresh_token']
    # # number of second the token will last for
    # token_info['expires_in'] = 3600


@router.post("/refresh-token")
async def refresh_token(refresh_token: RefreshTokenRequest):
    token_url = "https://accounts.spotify.com/api/token"

    # Création des données requises
    data = {"grant_type": "refresh_token", "refresh_token": refresh_token.refresh_token}

    # Création de l'en-tête d'autorisation Basic
    auth_str = f"{settings.CLIENT_ID}:{settings.CLIENT_SECRET}"
    b64_auth = b64encode(auth_str.encode()).decode()
    headers = {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": f"Basic {b64_auth}",  # Ajout de l'autorisation Basic
    }

    return await post_request_helper(token_url, data, headers)
