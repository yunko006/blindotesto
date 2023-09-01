from tortoise import fields, models
import secrets


class ApiKey(models.Model):
    secret_key = fields.CharField(max_length=32)
    created_at = fields.DatetimeField(auto_now_add=True)
    updated_at = fields.DatetimeField(auto_now=True)

    def __str__(self):
        return self.secret_key

    class Meta:
        table = "api_keys"

    @classmethod
    def generate_api_key(cls, length=16):
        generated_key = secrets.token_urlsafe(length)
        return generated_key
