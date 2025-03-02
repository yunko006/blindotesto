from fastapi import APIRouter, WebSocket, WebSocketDisconnect

router = APIRouter()


# / car j'utilise le prefix /ws dans le main.py
@router.websocket("/{room_id}")
async def websocket_endpoint(websocket: WebSocket, room_id: str):
    await websocket.accept()
    print(f"Client connected to room: {room_id}")
    while True:
        try:
            data = await websocket.receive_text()
            # Vous pourriez ajouter un format plus sophistiqué, comme JSON
            await websocket.send_text(f"Message dans la room {room_id}: {data}")
        except WebSocketDisconnect:
            print(f"Client disconnected from room: {room_id}")
            break
