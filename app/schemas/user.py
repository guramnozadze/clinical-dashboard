import uuid

from pydantic import BaseModel, ConfigDict, Field


class UserCreate(BaseModel):
    username: str = Field(
        min_length=3, max_length=64, pattern=r"^[A-Za-z0-9][A-Za-z0-9_.-]*$"
    )
    # bcrypt only uses the first 72 bytes, so longer passwords are rejected
    # rather than silently truncated.
    password: str = Field(min_length=8, max_length=72)


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    user_id: uuid.UUID
    username: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
