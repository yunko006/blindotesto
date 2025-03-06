from typing import Dict, List, Optional
import uuid
from datetime import datetime
from fastapi import WebSocket


class Room:
    def __init__(self, room_id: str, room_name: str = None, password: str = None):
        self.room_id = room_id
        self.name = room_name or f"Room-{room_id[:6]}"
        self.password = password
        self.host_connection: Optional[WebSocket] = None
        self.host_id: Optional[str] = None
        self.players: Dict[
            str, dict
        ] = {}  # {player_id: {"connection": WebSocket, "name": str, "score": int}}
        self.spectators: Dict[str, WebSocket] = {}  # Connexions qui regardent seulement
        self.current_song = None
        self.game_state = "waiting"  # waiting, playing, paused, ended
        self.buzzer_state = "inactive"  # inactive, active, buzzed
        self.current_buzzer = None  # ID du joueur qui a buzzé
        self.buzzer_timestamp = None  # Horodatage du dernier buzz
        self.created_at = datetime.now()
        self.config = {
            "playlist": "Pop",
            "clipDuration": "15",
            "clipMoment": "refrain",
            "buzzerOffDuration": "3",
            "cutMusicAfterBuzz": True,
        }
        self.messages = []  # Historique du chat

    def set_host(self, host_connection: WebSocket, host_id: str):
        """Définit ou met à jour la connexion hôte."""
        self.host_connection = host_connection
        self.host_id = host_id

    def add_player(self, player_id: str, connection: WebSocket, name: str = None):
        """Ajoute un joueur à la room."""
        self.players[player_id] = {
            "connection": connection,
            "name": name or player_id,
            "score": 0,
        }

    def remove_connection(self, client_id: str):
        """Supprime une connexion de la room."""
        if self.host_id == client_id:
            self.host_connection = None
            self.host_id = None
            return "host"

        if client_id in self.players:
            del self.players[client_id]
            return "player"

        if client_id in self.spectators:
            del self.spectators[client_id]
            return "spectator"

        return None

    def get_player_list(self):
        """Retourne la liste des joueurs avec leurs scores."""
        return {
            player_id: {"name": player["name"], "score": player["score"]}
            for player_id, player in self.players.items()
        }

    def update_config(self, new_config: dict):
        """Met à jour la configuration de la room."""
        self.config.update(new_config)

    def start_game(self):
        """Démarre le jeu."""
        self.game_state = "playing"
        self.buzzer_state = "inactive"

    def pause_game(self):
        """Met le jeu en pause."""
        self.game_state = "paused"

    def end_game(self):
        """Termine le jeu."""
        self.game_state = "ended"
        self.buzzer_state = "inactive"

    def reset_buzzer(self):
        """Réinitialise le buzzer."""
        self.buzzer_state = "active"
        self.current_buzzer = None
        self.buzzer_timestamp = None

    def register_buzz(self, player_id: str):
        """Enregistre un buzz d'un joueur."""
        if self.game_state == "playing" and self.buzzer_state == "active":
            self.buzzer_state = "buzzed"
            self.current_buzzer = player_id
            self.buzzer_timestamp = datetime.now().isoformat()
            return True
        return False

    def validate_answer(self, is_correct: bool):
        """Valide la réponse du joueur qui a buzzé."""
        if self.current_buzzer and self.buzzer_state == "buzzed":
            if is_correct and self.current_buzzer in self.players:
                self.players[self.current_buzzer]["score"] += 1

            result = {
                "player_id": self.current_buzzer,
                "is_correct": is_correct,
                "scores": self.get_player_list(),
            }

            self.reset_buzzer()
            return result

        return None

    def is_empty(self):
        """Vérifie si la room est vide (pas d'hôte, de joueurs ou de spectateurs)."""
        return not self.host_connection and not self.players and not self.spectators

    def get_room_info(self):
        """Retourne les informations de base sur la room."""
        return {
            "id": self.room_id,
            "name": self.name,
            "has_password": bool(self.password),
            "player_count": len(self.players),
            "game_state": self.game_state,
            "created_at": self.created_at.isoformat(),
        }

    def get_full_state(self):
        """Retourne l'état complet de la room."""
        return {
            "id": self.room_id,
            "name": self.name,
            "has_password": bool(self.password),
            "game_state": self.game_state,
            "buzzer_state": self.buzzer_state,
            "current_buzzer": self.current_buzzer,
            "players": self.get_player_list(),
            "config": self.config,
            "current_song": self.current_song,
        }


class RoomManager:
    def __init__(self):
        self.rooms: Dict[str, Room] = {}

    def create_room(self, room_name: str = None, password: str = None) -> str:
        """Crée une nouvelle room et retourne son ID."""
        room_id = str(uuid.uuid4())[:8]
        self.rooms[room_id] = Room(room_id, room_name, password)
        return room_id

    def get_room(self, room_id: str) -> Optional[Room]:
        """Récupère une room par son ID."""
        return self.rooms.get(room_id)

    def delete_room(self, room_id: str):
        """Supprime une room."""
        if room_id in self.rooms:
            del self.rooms[room_id]
            return True
        return False

    def check_room_exists(self, room_id: str) -> bool:
        """Vérifie si une room existe."""
        return room_id in self.rooms

    def check_room_password(self, room_id: str, password: str) -> bool:
        """Vérifie si le mot de passe d'une room est correct."""
        room = self.get_room(room_id)
        if not room:
            return False

        if not room.password:
            return True  # Si pas de mot de passe, l'accès est autorisé

        return room.password == password

    def get_all_rooms_info(self) -> List[dict]:
        """Récupère les informations de base sur toutes les rooms."""
        return [room.get_room_info() for room in self.rooms.values()]

    def cleanup_empty_rooms(self):
        """Nettoie les rooms vides."""
        empty_rooms = [
            room_id for room_id, room in self.rooms.items() if room.is_empty()
        ]
        for room_id in empty_rooms:
            del self.rooms[room_id]

        return len(empty_rooms)


# Instance globale du gestionnaire de rooms
room_manager = RoomManager()
