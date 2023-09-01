from typing import List, Optional
from pydantic import BaseModel, EmailStr

from app.schemas.api_key import UserApiKeys

# User model pydantic


class UserPayloadSchema(BaseModel):
    username: str
    password: str


class UserResponseSchema(BaseModel):
    id: int


class UserResponse(BaseModel):
    id: int
    username: str
    hashed_password: str
    is_active: bool
    is_superuser: bool
    api_key_id: int
