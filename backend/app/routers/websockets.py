# app/routes/ws_routes.py
from fastapi import APIRouter, Query, WebSocket, WebSocketDisconnect
from app.managers.ws_manager import connection_manager
from app.managers.room_manager import room_manager
from app.managers.chat_manager import chat_manager
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
        # 1. Vérifier si la room existe
        room = room_manager.get_room(room_id)
        if not room:
            # Si la room n'existe pas, la créer
            room_id = room_manager.create_room()
            room = room_manager.get_room(room_id)

        # 2. Établir la connexion WebSocket
        success = await connection_manager.connect(websocket, client_id, room_id)
        if not success:
            return

        # 3. Ajouter le client à la room
        room.add_player(client_id, websocket, client_id)
        print(f"Client {client_id} connected to room: {room_id}")

        # 4. Ajouter un message système au chat
        chat_manager.add_system_message(
            room_id, f"Le joueur {client_id} a rejoint la partie"
        )

        # 5. Envoyer l'état initial au client
        # 5.1 Liste des joueurs
        players = room.get_player_list()
        await websocket.send_text(
            json.dumps({"type": "player_list", "players": players})
        )

        # 5.2 Historique du chat
        chat_history = chat_manager.get_chat_history(room_id, 30)
        await websocket.send_text(
            json.dumps({"type": "chat_history", "messages": chat_history})
        )

        # 5.3 État de la room
        await websocket.send_text(
            json.dumps({"type": "room_state", "state": room.get_full_state()})
        )

        # 6. Informer les autres clients de la nouvelle connexion
        await connection_manager.broadcast_to_room(
            json.dumps({"type": "player_joined", "player": client_id}),
            room_id,
            exclude_client=client_id,
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

                    # Ajouter le message au gestionnaire de chat
                    message = chat_manager.add_message(
                        room_id=room_id,
                        sender_id=client_id,
                        sender_name=client_id,  # Ou récupérer le vrai nom depuis room.players[client_id]["name"]
                        content=content,
                        sender_role="player",
                    )

                    # Message personnel (confirmation)
                    await connection_manager.send_personal_message(
                        json.dumps(
                            {
                                "type": "chat_message",
                                "message": {**message.to_dict(), "is_self": True},
                            }
                        ),
                        client_id,
                    )

                    # Diffuser à tous les autres clients dans la room
                    await connection_manager.broadcast_to_room(
                        json.dumps(
                            {"type": "chat_message", "message": message.to_dict()}
                        ),
                        room_id,
                        exclude_client=client_id,
                    )

                elif message_type == "get_player_list":
                    # Demande de la liste des joueurs
                    players = room.get_player_list()
                    await websocket.send_text(
                        json.dumps({"type": "player_list", "players": players})
                    )

                elif message_type == "config_update":
                    # Mise à jour de la configuration
                    config = message_data.get("config", {})

                    # Mettre à jour la configuration de la room
                    room.update_config(config)

                    # Ajouter un message système au chat
                    system_msg = chat_manager.add_system_message(
                        room_id, f"Configuration mise à jour par {client_id}"
                    )

                    # Diffuser la nouvelle configuration à tous les joueurs
                    await connection_manager.broadcast_to_room(
                        json.dumps(
                            {
                                "type": "config_update",
                                "config": config,
                                "updated_by": client_id,
                                "system_message": system_msg.to_dict(),
                            }
                        ),
                        room_id,
                    )

                elif message_type == "buzz":
                    # Enregistrer le buzz dans la room
                    if room.register_buzz(client_id):
                        # Si le buzz est accepté, ajouter un message système
                        system_msg = chat_manager.add_system_message(
                            room_id, f"{client_id} a buzzé!"
                        )

                        # Diffuser l'information à tous les clients
                        await connection_manager.broadcast_to_room(
                            json.dumps(
                                {
                                    "type": "buzz",
                                    "player": client_id,
                                    "timestamp": room.buzzer_timestamp,
                                    "system_message": system_msg.to_dict(),
                                }
                            ),
                            room_id,
                        )

                elif message_type == "start_game":
                    # Démarrer le jeu
                    room.start_game()

                    # Ajouter un message système
                    system_msg = chat_manager.add_system_message(
                        room_id, "La partie a commencé!"
                    )

                    # Informer tous les clients
                    await connection_manager.broadcast_to_room(
                        json.dumps(
                            {
                                "type": "game_started",
                                "state": room.get_full_state(),
                                "system_message": system_msg.to_dict(),
                            }
                        ),
                        room_id,
                    )

                elif message_type == "validate_answer":
                    # Valider la réponse du joueur qui a buzzé
                    is_correct = message_data.get("is_correct", False)
                    result = room.validate_answer(is_correct)

                    if result:
                        # Créer un message système approprié
                        result_text = "correcte" if is_correct else "incorrecte"
                        system_msg = chat_manager.add_system_message(
                            room_id,
                            f"La réponse de {result['player_id']} était {result_text}!",
                        )

                        # Informer tous les clients
                        await connection_manager.broadcast_to_room(
                            json.dumps(
                                {
                                    "type": "answer_result",
                                    "result": result,
                                    "system_message": system_msg.to_dict(),
                                    "state": room.get_full_state(),
                                }
                            ),
                            room_id,
                        )

                else:
                    # Pour la compatibilité avec le code existant
                    # Si le type de message n'est pas reconnu, le traiter comme un message texte brut
                    print(f"Message de type inconnu reçu: {message_type}")
                    await connection_manager.send_personal_message(
                        f"Message reçu: {data}", client_id
                    )

            except json.JSONDecodeError:
                # Si ce n'est pas du JSON valide, traiter comme un message texte brut
                print(f"JSON invalide reçu: {data}")
                await connection_manager.send_personal_message(
                    f"Message non-JSON reçu: {data}", client_id
                )

    except WebSocketDisconnect:
        # Gérer la déconnexion du client
        print(f"Client {client_id} disconnected from room: {room_id}")

        # 1. Supprimer le client de la room
        room = room_manager.get_room(room_id)
        if room:
            room.remove_connection(client_id)

            # 2. Ajouter un message système
            system_msg = chat_manager.add_system_message(
                room_id, f"{client_id} a quitté la partie"
            )

            # 3. Supprimer la connexion du manager
            connection_manager.disconnect(client_id)

            # 4. Informer les autres clients
            await connection_manager.broadcast_to_room(
                json.dumps(
                    {
                        "type": "player_disconnected",
                        "player": client_id,
                        "system_message": system_msg.to_dict(),
                        "players": room.get_player_list(),
                    }
                ),
                room_id,
            )

            # 5. Si la room est vide, la supprimer
            if room.is_empty():
                room_manager.delete_room(room_id)
                chat_manager.delete_room_chat(room_id)
                print(f"Room {room_id} deleted (empty)")


# Endpoint pour récupérer la liste des rooms actives
@router.get("/rooms")
async def get_rooms():
    """Récupère la liste des rooms disponibles."""
    return room_manager.get_all_rooms_info()


# Endpoint pour récupérer l'historique du chat d'une room
@router.get("/room/{room_id}/chat")
async def get_chat_history(room_id: str, limit: int = 50):
    """Récupère l'historique du chat d'une room."""
    if not room_manager.check_room_exists(room_id):
        return {"error": "Room not found"}

    return {"messages": chat_manager.get_chat_history(room_id, limit)}
