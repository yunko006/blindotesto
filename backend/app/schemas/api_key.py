from datetime import datetime
from pydantic import BaseModel


# User api key
class UserApiKeys(BaseModel):
    secret_key: str
    # created_at: datetime
    # updated_at: datetime
