from typing import Dict, List
from datetime import datetime
import uuid


class ChatMessage:
    def __init__(
        self,
        sender_id: str,
        sender_name: str,
        content: str,
        room_id: str,
        sender_role: str = "player",
        is_system: bool = False,
    ):
        self.id = str(uuid.uuid4())
        self.sender_id = sender_id
        self.sender_name = sender_name
        self.content = content
        self.room_id = room_id
        self.sender_role = sender_role  # "host", "player", "spectator", "system"
        self.is_system = is_system
        self.timestamp = datetime.now().isoformat()

    def to_dict(self) -> dict:
        """Convertit le message en dictionnaire pour sérialisation JSON."""
        return {
            "id": self.id,
            "sender_id": self.sender_id,
            "sender_name": self.sender_name,
            "content": self.content,
            "room_id": self.room_id,
            "sender_role": self.sender_role,
            "is_system": self.is_system,
            "timestamp": self.timestamp,
        }


class ChatManager:
    def __init__(self):
        # Structure: {room_id: [messages]}
        self.messages: Dict[str, List[ChatMessage]] = {}
        self.max_history = 100

    def add_message(
        self,
        room_id: str,
        sender_id: str,
        sender_name: str,
        content: str,
        sender_role: str = "player",
    ) -> ChatMessage:
        """
        Ajoute un message au chat d'une room.
        Permet aux utilisateurs d'envoyer des messages dans une room (grâce à room_id)
        en fonction de leur sender_id
        """
        # Initialiser la liste des messages pour cette room si elle n'existe pas encore
        if room_id not in self.messages:
            self.messages[room_id] = []

        # Créer le message
        message = ChatMessage(
            sender_id=sender_id,
            sender_name=sender_name,
            content=content,
            room_id=room_id,
            sender_role=sender_role,
        )

        # Ajouter le message à la liste de cette room
        self.messages[room_id].append(message)

        # Limiter la taille de l'historique
        if len(self.messages[room_id]) > self.max_history:
            self.messages[room_id] = self.messages[room_id][-self.max_history :]

        return message

    def add_system_message(self, room_id: str, content: str) -> ChatMessage:
        """Ajoute un message système au chat d'une room."""
        # Initialiser la liste des messages pour cette room si elle n'existe pas encore
        if room_id not in self.messages:
            self.messages[room_id] = []

        # Créer le message système
        message = ChatMessage(
            sender_id="system",
            sender_name="Système",
            content=content,
            room_id=room_id,
            sender_role="system",
            is_system=True,
        )

        # Ajouter le message à la liste de cette room
        self.messages[room_id].append(message)

        # Limiter la taille de l'historique
        if len(self.messages[room_id]) > self.max_history:
            self.messages[room_id] = self.messages[room_id][-self.max_history :]

        return message

    def get_chat_history(self, room_id: str, count: int = 50) -> List[dict]:
        """Récupère l'historique récent du chat d'une room."""
        if room_id not in self.messages:
            return []

        # Récupérer les X derniers messages
        recent_messages = (
            self.messages[room_id][-count:]
            if count < len(self.messages[room_id])
            else self.messages[room_id]
        )
        return [msg.to_dict() for msg in recent_messages]

    def get_messages_since(self, room_id: str, timestamp: str) -> List[dict]:
        """Récupère les messages d'une room depuis un timestamp donné."""
        if room_id not in self.messages:
            return []

        try:
            dt = datetime.fromisoformat(timestamp)
            # Filtrer les messages plus récents que le timestamp donné
            recent_messages = [
                msg
                for msg in self.messages[room_id]
                if datetime.fromisoformat(msg.timestamp) > dt
            ]
            return [msg.to_dict() for msg in recent_messages]
        except ValueError:
            # Si le timestamp n'est pas valide, retourner les 20 derniers messages
            recent_messages = self.messages[room_id][-20:]
            return [msg.to_dict() for msg in recent_messages]

    def delete_room_chat(self, room_id: str):
        """Supprime le chat d'une room."""
        if room_id in self.messages:
            del self.messages[room_id]

    def cleanup_empty_chats(self, active_room_ids: List[str]):
        """Nettoie les chats des rooms qui n'existent plus."""
        to_delete = [
            room_id for room_id in self.messages if room_id not in active_room_ids
        ]
        for room_id in to_delete:
            self.delete_room_chat(room_id)

        return len(to_delete)


# Instance globale du gestionnaire de chat
chat_manager = ChatManager()
