import httpx
from fastapi import HTTPException


async def post_request_helper(token_url: str, data: dict, headers: dict):
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            response = await client.post(
                token_url,
                data=data,
                headers=headers,
            )
            response.raise_for_status()
            return response.json()  # Retourne directement le JSON sans HTTPException
        except httpx.HTTPError as e:
            # Au lieu de raise HTTPException, retourne un dict d'erreur
            return {"error": f"Spotify API error: {str(e)}"}


async def get_request_helper(url: str, headers: dict):
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            response = await client.get(
                url,
                headers=headers,
            )
            response.raise_for_status()
            return response.json()
        except httpx.HTTPError as e:
            raise HTTPException(
                status_code=getattr(e.response, "status_code", 500),
                detail=f"Spotify API error: {str(e)}",
            )
