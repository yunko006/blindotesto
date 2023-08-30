import json

import pytest


def test_create_playlist(test_app_with_db):
    payload = {
        "name": "Test Playlist",
        "description": "This is a test playlist",
        "owner": "Test Owner",
        "spotify_id": "test_spotify_id",
        "spotify_uri": "test_spotify_uri",
        "tracks": ["track1", "track2"],
    }

    response = test_app_with_db.post(
        "/playlists/",
        json=payload,
    )

    assert response.status_code == 201


def test_create_playlist_invalid_payload(test_app_with_db):
    invalid_payload = {
        "description": "This is a test playlist",
        "owner": "Test Owner",
        "spotify_id": "test_spotify_id",
        "spotify_uri": "test_spotify_uri",
        "tracks": ["track1", "track2"],
    }

    response = test_app_with_db.post(
        "/playlists/",
        json=invalid_payload,
    )

    assert response.status_code == 422


def test_get_one_playlist(test_app_with_db):
    payload = {
        "name": "Test Playlist",
        "description": "This is a test playlist",
        "owner": "Test Owner",
        "spotify_id": "test_spotify_id",
        "spotify_uri": "test_spotify_uri",
        "tracks": ["track1", "track2"],
    }

    response = test_app_with_db.post(
        "/playlists/",
        json=payload,
    )

    playlist_id = response.json()["id"]

    response = test_app_with_db.get(f"/playlists/{playlist_id}")
    assert response.status_code == 200

    response_dict = response.json()
    assert response_dict["name"] == "Test Playlist"
    assert response_dict["description"] == "This is a test playlist"
    assert response_dict["owner"] == "Test Owner"
    assert response_dict["spotify_id"] == "test_spotify_id"


def test_get_one_invalid_playlist(test_app_with_db):
    playlist_id = 234
    response = test_app_with_db.get(f"/playlists/{playlist_id}")

    assert response.status_code == 404
