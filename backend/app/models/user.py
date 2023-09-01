from tortoise import fields, models


class User(models.Model):
    id = fields.IntField(pk=True)
    email = fields.CharField(max_length=255)
    hashed_password = fields.CharField(max_length=255)
    is_active = fields.BooleanField(default=True)
    is_superuser = fields.BooleanField(default=False)
    # pour utiliser une foreignkey dans tortoise il faut donner le nom de la class du models "ex: ApiKey dans key.py"
    api_key = fields.ForeignKeyField("models.ApiKey", related_name="key")

    def __str__(self):
        return self.id

    class Meta:
        table = "users"
