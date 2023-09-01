from pydantic import BaseModel


# User api key
class UserApiKeys(BaseModel):
    secret_key: str
    created_at: str
    updated_at: str
    # user:
