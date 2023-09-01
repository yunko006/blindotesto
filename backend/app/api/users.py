from fastapi import APIRouter, HTTPException
from app.schemas.user import UserPayloadSchema, UserResponseSchema, UserResponse
from app.crud import base
from app.models.user import User, UserSchema


router = APIRouter()


@router.post("/", response_model=UserResponseSchema, status_code=201)
async def create_user(payload: UserPayloadSchema) -> UserResponseSchema:
    user = await base.user_post(payload)

    response_object = {"id": user}
    return response_object


@router.get("/{id}/", response_model=UserResponse)
async def get_one_user(id: int):
    user = await base.get_one_user(id)

    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user
