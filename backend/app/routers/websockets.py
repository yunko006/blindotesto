from fastapi import APIRouter, Query, WebSocket, WebSocketDisconnect
from app.utils.ws_manager import ws_manager as manager
import json

router = APIRouter()


# / car j'utilise le prefix /ws dans le main.py
@router.websocket("/{room_id}")
async def websocket_endpoint(
    websocket: WebSocket, room_id: str, client_id: str = Query(None)
):
    if not client_id:
        await websocket.close(code=1008, reason="client_id is required")
        return

    try:
        # Établir la connexion
        await manager.connect(websocket, room_id, client_id)
        print(f"Client {client_id} connected to room: {room_id}")

        # Envoyer immédiatement la liste des joueurs au nouveau client
        players = manager.get_connected_players(room_id)
        await websocket.send_text(
            json.dumps({"type": "player_list", "players": players})
        )

        # Boucle principale pour recevoir les messages
        while True:
            # Attendre un message du client
            data = await websocket.receive_text()

            try:
                # Essayer de parser le message comme JSON
                message_data = json.loads(data)
                message_type = message_data.get("type", "")

                # Traiter différents types de messages
                if message_type == "chat_message":
                    # Message de chat
                    content = message_data.get("content", "")

                    # Message personnel (confirmation)
                    await manager.send_personal_message(
                        json.dumps(
                            {
                                "type": "chat_message",
                                "sender": "you",
                                "content": content,
                            }
                        ),
                        room_id,
                        client_id,
                    )

                    # Diffuser à tous les autres clients dans la room
                    await manager.broadcast_to_room(
                        json.dumps(
                            {
                                "type": "chat_message",
                                "sender": client_id,
                                "content": content,
                            }
                        ),
                        room_id,
                        exclude_client=client_id,
                    )

                elif message_type == "get_player_list":
                    # Demande de la liste des joueurs
                    players = manager.get_connected_players(room_id)
                    await websocket.send_text(
                        json.dumps({"type": "player_list", "players": players})
                    )

                elif message_type == "config_update":
                    # Mise à jour de la configuration
                    config = message_data.get("config", {})

                    # Diffuser la nouvelle configuration à tous les joueurs
                    await manager.broadcast_to_room(
                        json.dumps(
                            {
                                "type": "config_update",
                                "config": config,
                                "updated_by": client_id,
                            }
                        ),
                        room_id,
                    )

                elif message_type == "buzz":
                    # Gestion du buzz (si vous avez cette fonctionnalité)
                    await manager.broadcast_to_room(
                        json.dumps({"type": "buzz", "player": client_id}), room_id
                    )

                else:
                    # Pour la compatibilité avec le code existant
                    # Message personnel (confirmation)
                    await manager.send_personal_message(
                        f"You: {data}", room_id, client_id
                    )
                    # Diffuser à tous les autres clients dans la room
                    await manager.broadcast_to_room(
                        f"{client_id}: {data}", room_id, exclude_client=client_id
                    )

            except json.JSONDecodeError:
                # Si ce n'est pas du JSON valide, traiter comme avant
                await manager.send_personal_message(f"You: {data}", room_id, client_id)
                await manager.broadcast_to_room(
                    f"{client_id}: {data}", room_id, exclude_client=client_id
                )

    except WebSocketDisconnect:
        manager.disconnect(room_id, client_id)
        await manager.broadcast_to_room(
            json.dumps({"type": "player_disconnected", "player": client_id}), room_id
        )

        # Envoyer la liste mise à jour des joueurs
        players = manager.get_connected_players(room_id)
        await manager.broadcast_to_room(
            json.dumps({"type": "player_list", "players": players}), room_id
        )

        print(f"Client {client_id} disconnected from room: {room_id}")
