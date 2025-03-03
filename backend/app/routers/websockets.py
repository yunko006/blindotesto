from fastapi import APIRouter, Query, WebSocket, WebSocketDisconnect
from app.utils.ws_manager import ws_manager as manager

router = APIRouter()


# / car j'utilise le prefix /ws dans le main.py
@router.websocket("/{room_id}")
async def websocket_endpoint(
    websocket: WebSocket, room_id: str, client_id: str = Query(None)
):
    if not client_id:
        await websocket.close(code=1008, reason="client_id is required")
        return

    await manager.connect(websocket, room_id, client_id)
    print(f"Client connected to room: {room_id}")
    while True:
        try:
            data = await websocket.receive_text()

            # Vous pouvez traiter les messages JSON ici pour des actions spécifiques
            # Par exemple, pour les buzzers

            # Message personnel (confirmation)
            await manager.send_personal_message(f"You: {data}", room_id, client_id)
            # Diffuser à tous les autres clients dans la room
            await manager.broadcast_to_room(
                f"{client_id}: {data}",
                room_id,
                exclude_client=client_id,  # Ne pas renvoyer le message à l'expéditeur
            )
        except WebSocketDisconnect:
            manager.disconnect(room_id, client_id)
            await manager.broadcast_to_room(f"{client_id} left room {room_id}", room_id)
