from pydantic import BaseModel


class TokenResponse(BaseModel):
    """
    Modèle de réponse pour l'authentification Spotify.

    Attributes:
        access_token: Token d'accès pour les requêtes API Spotify
        token_type: Type de token (généralement "Bearer")
        expires_in: Durée de validité du token en secondes
        refresh_token: Token utilisé pour obtenir un nouveau access_token
        scope: Permissions accordées par l'utilisateur
    """

    access_token: str
    token_type: str
    expires_in: int
    refresh_token: str
    scope: str
