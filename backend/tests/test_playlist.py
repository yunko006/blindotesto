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
