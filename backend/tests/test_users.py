import pytest


def test_create_user(test_app_with_db):
    payload = {"username": "exemple_username", "password": "exemple_pw"}

    response = test_app_with_db.post("/users/", json=payload)

    assert response.status_code == 201


def test_create_invalid_user(test_app_with_db):
    payload = {"username": "exemple_username"}

    response = test_app_with_db.post("/users/", json=payload)

    assert response.status_code == 422
