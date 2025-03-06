def test_websocket(test_app):
    client = test_app.get("/ws")
    with client.websocket_connect("/ws") as websocket:
        data = websocket.receive_json()
        assert data == {"msg": "Hello WebSocket"}
