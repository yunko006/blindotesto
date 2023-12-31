from tortoise import fields, models
from tortoise.contrib.pydantic import pydantic_model_creator


class Playlist(models.Model):
    id = fields.IntField(pk=True)
    name = fields.CharField(max_length=255)
    description = fields.TextField()
    owner = fields.CharField(max_length=100)
    spotify_id = fields.CharField(max_length=50)
    spotify_uri = fields.CharField(max_length=100)
    tracks = fields.JSONField()

    def __str__(self):
        return self.name

    class Meta:
        table = "playlists"


PlaylistSchema = pydantic_model_creator(Playlist)
