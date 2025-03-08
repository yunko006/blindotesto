from typing import Dict, Optional, List
from fastapi import WebSocket


class ConnectionManager:
    def __init__(self):
        # Structure: {client_id: {"connection": WebSocket, "room_id": str, "role": str}}
        self.active_connections: Dict[str, dict] = {}

    async def connect(
        self, websocket: WebSocket, client_id: str, room_id: str, role: str = "player"
    ) -> bool:
        """
        Établit une connexion WebSocket avec un client.

        Args:
            websocket: La connexion WebSocket
            client_id: L'identifiant unique du client
            room_id: L'identifiant de la room associée
            role: Le rôle du client ("host", "player", "spectator")

        Returns:
            bool: True si la connexion a été établie avec succès
        """
        try:
            await websocket.accept()

            # Enregistrer la connexion
            self.active_connections[client_id] = {
                "connection": websocket,
                "room_id": room_id,
                "role": role,
            }

            return True
        except Exception as e:
            print(f"Erreur lors de la connexion: {e}")
            return False

    def disconnect(self, client_id: str) -> Optional[str]:
        """
        Déconnecte un client.

        Args:
            client_id: L'identifiant du client à déconnecter

        Returns:
            Optional[str]: L'ID de la room à laquelle le client était connecté, ou None
        """
        if client_id in self.active_connections:
            room_id = self.active_connections[client_id]["room_id"]
            del self.active_connections[client_id]
            return room_id
        return None

    def get_connection(self, client_id: str) -> Optional[WebSocket]:
        """Récupère la connexion WebSocket d'un client."""
        if client_id in self.active_connections:
            return self.active_connections[client_id]["connection"]
        return None

    def get_client_room(self, client_id: str) -> Optional[str]:
        """Récupère l'ID de la room associée à un client."""
        if client_id in self.active_connections:
            return self.active_connections[client_id]["room_id"]
        return None

    def get_client_role(self, client_id: str) -> Optional[str]:
        """Récupère le rôle d'un client."""
        if client_id in self.active_connections:
            return self.active_connections[client_id]["role"]
        return None

    def get_clients_in_room(self, room_id: str) -> List[str]:
        """Récupère la liste des IDs clients dans une room."""
        return [
            client_id
            for client_id, data in self.active_connections.items()
            if data["room_id"] == room_id
        ]

    def get_clients_by_role(self, room_id: str, role: str) -> List[str]:
        """Récupère la liste des IDs clients dans une room par rôle."""
        return [
            client_id
            for client_id, data in self.active_connections.items()
            if data["room_id"] == room_id and data["role"] == role
        ]

    async def send_personal_message(self, message: str, client_id: str) -> bool:
        """
        Envoie un message à un client spécifique.

        Args:
            message: Le message à envoyer
            client_id: L'ID du client destinataire

        Returns:
            bool: True si le message a été envoyé avec succès
        """
        connection = self.get_connection(client_id)
        if connection:
            try:
                await connection.send_text(message)
                return True
            except Exception as e:
                print(f"Erreur lors de l'envoi du message à {client_id}: {e}")
        return False

    async def broadcast_to_room(
        self, message: str, room_id: str, exclude_client: str = None
    ) -> int:
        """
        Diffuse un message à tous les clients dans une room.

        Args:
            message: Le message à diffuser
            room_id: L'ID de la room
            exclude_client: ID du client à exclure (optionnel)

        Returns:
            int: Nombre de clients qui ont reçu le message
        """
        count = 0
        for client_id, data in self.active_connections.items():
            if data["room_id"] == room_id and (
                exclude_client is None or client_id != exclude_client
            ):
                try:
                    await data["connection"].send_text(message)
                    count += 1
                except Exception as e:
                    print(f"Erreur lors de la diffusion à {client_id}: {e}")
        return count

    async def broadcast_to_role(
        self, message: str, room_id: str, role: str, exclude_client: str = None
    ) -> int:
        """
        Diffuse un message à tous les clients d'un rôle spécifique dans une room.

        Args:
            message: Le message à diffuser
            room_id: L'ID de la room
            role: Le rôle ciblé ("host", "player", "spectator")
            exclude_client: ID du client à exclure (optionnel)

        Returns:
            int: Nombre de clients qui ont reçu le message
        """
        count = 0
        for client_id, data in self.active_connections.items():
            if (
                data["room_id"] == room_id
                and data["role"] == role
                and (exclude_client is None or client_id != exclude_client)
            ):
                try:
                    await data["connection"].send_text(message)
                    count += 1
                except Exception as e:
                    print(f"Erreur lors de la diffusion à {client_id}: {e}")
        return count

    def count_clients_in_room(self, room_id: str) -> int:
        """Compte le nombre de clients dans une room."""
        return len(self.get_clients_in_room(room_id))

    def is_room_empty(self, room_id: str) -> bool:
        """Vérifie si une room est vide."""
        return self.count_clients_in_room(room_id) == 0


# Instance globale du gestionnaire de connexions
connection_manager = ConnectionManager()
