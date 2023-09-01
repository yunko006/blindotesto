from tortoise import fields, models
from tortoise.contrib.pydantic import pydantic_model_creator


class User(models.Model):
    id = fields.IntField(pk=True)
    username = fields.CharField(max_length=255)
    hashed_password = fields.CharField(max_length=255)
    is_active = fields.BooleanField(default=True)
    is_superuser = fields.BooleanField(default=False)
    # pour utiliser une foreignkey dans tortoise il faut donner le nom de la class du models "ex: ApiKey dans key.py"
    api_key = fields.ForeignKeyField("models.ApiKey", related_name="key")

    def __str__(self):
        return self.username

    class Meta:
        table = "users"


UserSchema = pydantic_model_creator(User)
