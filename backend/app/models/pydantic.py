from typing import List
from pydantic import BaseModel


class SummaryPayloadSchema(BaseModel):
    url: str


class PlaylistPayloadSchema(BaseModel):
    name: str
    description: str
    owner: str
    spotify_id: str
    spotify_uri: str
    tracks: list


class PlaylistResponseSchema(BaseModel):
    id: int


class SummaryResponseSchema(SummaryPayloadSchema):
    id: int
