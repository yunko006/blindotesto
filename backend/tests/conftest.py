# https://fastapi.tiangolo.com/tutorial/testing/#testing-file
from typing import Generator
import pytest

from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture()
def test_app() -> Generator:
    yield TestClient(app)
