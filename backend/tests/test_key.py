import pytest
from app.models.key import ApiKey


def test_generate_api_key(test_app_with_db):
    generated_key = ApiKey.generate_api_key()

    # 16 bytes token return un str de length = 22
    assert len(generated_key) == 22
