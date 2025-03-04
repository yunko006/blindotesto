import json
from typing import Dict, List
from fastapi import WebSocket


class ConnectionManager:
    def __init__(self):
        # Structure: {room_id: {client_id: websocket}}
        self.active_connections: Dict[str, Dict[str, WebSocket]] = {}

    async def connect(self, websocket: WebSocket, room_id: str, client_id: str):
        await websocket.accept()

        # Créer la room si elle n'existe pas
        if room_id not in self.active_connections:
            self.active_connections[room_id] = {}

        # Ajouter le client à la room
        self.active_connections[room_id][client_id] = websocket
        print(f"Client {client_id} connected to room {room_id}")

    def disconnect(self, room_id: str, client_id: str):
        # Supprimer le client de la room
        if (
            room_id in self.active_connections
            and client_id in self.active_connections[room_id]
        ):
            del self.active_connections[room_id][client_id]
            print(f"Client {client_id} disconnected from room {room_id}")

            # Si la room est vide, la supprimer
            if not self.active_connections[room_id]:
                del self.active_connections[room_id]
                print(f"Room {room_id} deleted (empty)")

    async def send_personal_message(self, message: str, room_id: str, client_id: str):
        if (
            room_id in self.active_connections
            and client_id in self.active_connections[room_id]
        ):
            await self.active_connections[room_id][client_id].send_text(message)

    async def broadcast_to_room(
        self, message: str, room_id: str, exclude_client: str = None
    ):
        """Envoie un message à tous les clients dans une room, avec la possibilité d'exclure un client."""
        if room_id in self.active_connections:
            for client_id, connection in self.active_connections[room_id].items():
                if exclude_client is None or client_id != exclude_client:
                    await connection.send_text(message)

    def get_connected_players(self, room_id: str) -> List[dict]:
        """Retourne la liste des joueurs connectés à une room."""
        if room_id not in self.active_connections:
            return []

        return [
            {
                "id": client_id,
                "name": client_id,
            }  # Utilisez client_id comme nom si vous n'avez pas de noms distincts
            for client_id in self.active_connections[room_id].keys()
        ]

    async def broadcast_player_list(self, room_id: str):
        """Envoie la liste mise à jour des joueurs à tous les clients dans une room."""
        if room_id in self.active_connections:
            players = self.get_connected_players(room_id)
            message = json.dumps({"type": "player_list", "players": players})
            await self.broadcast_to_room(message, room_id)


ws_manager = ConnectionManager()
