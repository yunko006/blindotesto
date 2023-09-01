from typing import List, Optional
from pydantic import BaseModel, EmailStr

# User model pydantic


# Shared properties
class UserBase(BaseModel):
    username: str
    email: Optional[EmailStr] = None
    is_active: Optional[bool] = True
    is_superuser: bool = False


# Properties to receive via API on creation
class UserCreate(UserBase):
    username: str
    email: EmailStr
    password: str
