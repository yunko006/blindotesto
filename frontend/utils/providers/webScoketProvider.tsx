"use client";
import {
  createContext,
  useContext,
  useRef,
  useState,
  ReactNode,
  useCallback,
  useEffect,
} from "react";

// Définir l'interface pour un joueur
interface Player {
  id: string | number;
  name: string;
}

// Interface pour la configuration de la room
interface RoomConfig {
  roomName: string;
  password: string;
  playlist: string;
  clipDuration: string;
  clipMoment: string;
  buzzerOffDuration: string;
  cutMusicAfterBuzz: boolean;
}

// Types de base pour les messages
interface BaseMessage {
  type: string;
}

// Types spécifiques pour chaque message
interface PlayerListMessage extends BaseMessage {
  type: "player_list";
  players: Player[];
}

interface ChatMessage extends BaseMessage {
  type: "chat_message";
  sender: string;
  content: string;
  timestamp?: string;
}

interface ConfigUpdateMessage extends BaseMessage {
  type: "config_update";
  config: RoomConfig;
  updated_by?: string;
}

interface GetPlayerListMessage extends BaseMessage {
  type: "get_player_list";
}

interface PlayerDisconnectedMessage extends BaseMessage {
  type: "player_disconnected";
  player: string;
}

interface BuzzMessage extends BaseMessage {
  type: "buzz";
  player: string;
}

// Type générique de message JSON
interface WebSocketContextType {
  connectToRoom: (roomId: string, clientId: string) => void;
  disconnectFromRoom: () => void;
  sendMessage: (message: string) => void;
  messages: string[];
  connected: boolean;
  roomId: string | null;
  connectedPlayers: Player[];
  roomConfig: RoomConfig | null;
  updateRoomConfig: (config: RoomConfig) => void;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

interface WebSocketProviderProps {
  children: ReactNode;
}

// Configuration par défaut
const defaultRoomConfig: RoomConfig = {
  roomName: "",
  password: "",
  playlist: "Pop",
  clipDuration: "15 sec",
  clipMoment: "refrain",
  buzzerOffDuration: "3 sec",
  cutMusicAfterBuzz: true,
};

export function WebSocketProvider({ children }: WebSocketProviderProps) {
  const [messages, setMessages] = useState<string[]>([]);
  const [connected, setConnected] = useState(false);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [connectedPlayers, setConnectedPlayers] = useState<Player[]>([]);
  const [roomConfig, setRoomConfig] = useState<RoomConfig | null>(null);
  const webSocketRef = useRef<WebSocket | null>(null);

  // Mettre à jour la configuration et l'envoyer à tous les clients
  const updateRoomConfig = useCallback(
    (config: RoomConfig) => {
      setRoomConfig(config);

      // Envoyer la mise à jour aux autres clients
      if (webSocketRef.current && connected) {
        const message: ConfigUpdateMessage = {
          type: "config_update",
          config: config,
        };
        webSocketRef.current.send(JSON.stringify(message));
      }

      // Sauvegarder localement si nécessaire
      if (roomId) {
        localStorage.setItem(`roomConfig_${roomId}`, JSON.stringify(config));
      }
    },
    [connected, roomId]
  );

  // Utiliser useCallback pour mémoriser la fonction
  const connectToRoom = useCallback(
    (newRoomId: string, clientId: string) => {
      // Ne reconnectez pas si déjà connecté à cette room
      if (connected && roomId === newRoomId) {
        return;
      }

      // Définir le roomId pour pouvoir l'utiliser dans d'autres fonctions
      setRoomId(newRoomId);

      // Essayer de récupérer la configuration depuis le localStorage
      const savedConfig = localStorage.getItem(`roomConfig_${newRoomId}`);
      if (savedConfig) {
        try {
          const parsedConfig = JSON.parse(savedConfig) as RoomConfig;
          setRoomConfig(parsedConfig);
        } catch (e) {
          console.error(
            "Erreur lors du parsing de la configuration sauvegardée:",
            e
          );
          setRoomConfig({
            ...defaultRoomConfig,
            roomName: newRoomId,
          });
        }
      } else {
        // Configuration par défaut si aucune configuration n'est trouvée
        setRoomConfig({
          ...defaultRoomConfig,
          roomName: newRoomId,
        });
      }

      // Fermer toute connexion existante
      if (webSocketRef.current) {
        webSocketRef.current.close();
        webSocketRef.current = null; // Assurez-vous de réinitialiser la référence
      }

      // Ajoutez un délai avant de vous reconnecter
      setTimeout(() => {
        try {
          console.log(
            `Tentative de connexion à la room ${newRoomId} en tant que ${clientId}`
          );

          // Créer une nouvelle connexion
          const ws = new WebSocket(
            `ws://localhost:8000/ws/${newRoomId}?client_id=${clientId}`
          );

          ws.onopen = () => {
            console.log(`Connecté à la room ${newRoomId}`);
            setConnected(true);

            // Demander immédiatement la liste des joueurs et la configuration
            const message: GetPlayerListMessage = { type: "get_player_list" };
            ws.send(JSON.stringify(message));
          };

          ws.onmessage = (event) => {
            try {
              // Essayer de parser le message comme JSON
              const data = JSON.parse(event.data) as BaseMessage;

              // Traiter différents types de messages
              switch (data.type) {
                case "player_list": {
                  // Le cast est sûr ici car on a vérifié le type
                  const playerListData = data as PlayerListMessage;
                  setConnectedPlayers(playerListData.players);
                  console.log(
                    "Liste des joueurs mise à jour:",
                    playerListData.players
                  );
                  break;
                }
                case "chat_message": {
                  const chatData = data as ChatMessage;
                  // Ajouter le message au chat
                  setMessages((prev) => [
                    ...prev,
                    `${chatData.sender}: ${chatData.content}`,
                  ]);
                  break;
                }
                case "config_update": {
                  const configData = data as ConfigUpdateMessage;
                  // Mise à jour de la configuration de la room
                  console.log(
                    "Configuration de la room mise à jour:",
                    configData.config
                  );
                  setRoomConfig(configData.config);

                  // Sauvegarder localement
                  localStorage.setItem(
                    `roomConfig_${newRoomId}`,
                    JSON.stringify(configData.config)
                  );
                  break;
                }
                case "player_disconnected": {
                  const disconnectData = data as PlayerDisconnectedMessage;
                  console.log(`Joueur déconnecté: ${disconnectData.player}`);
                  // Vous pourriez ajouter une notification ici
                  break;
                }
                case "buzz": {
                  const buzzData = data as BuzzMessage;
                  console.log(`Buzz reçu du joueur: ${buzzData.player}`);
                  // Traiter le buzz ici
                  break;
                }
                default:
                  // Ajouter d'autres types de messages selon vos besoins
                  console.log("Message reçu de type inconnu:", data);
                  // Par défaut, traiter comme un message brut
                  setMessages((prev) => [...prev, event.data]);
              }
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
            } catch (_error) {
              // error pas use dans le code c'est normal
              // Si ce n'est pas du JSON valide, traiter comme un message simple
              console.log("Message texte reçu:", event.data);
              setMessages((prev) => [...prev, event.data]);
            }
          };

          ws.onclose = (event) => {
            console.log(
              `Déconnecté de la room ${newRoomId}`,
              event.code,
              event.reason
            );
            setConnected(false);
            setRoomId(null);
            setConnectedPlayers([]); // Vider la liste des joueurs à la déconnexion
          };

          ws.onerror = (error) => {
            console.error("WebSocket error:", error);
            setConnected(false);
          };

          webSocketRef.current = ws;
        } catch (error) {
          console.error("Erreur lors de la création du WebSocket:", error);
        }
      }, 500); // Délai de 500ms avant de se reconnecter
    },
    [connected, roomId]
  );

  // Mémoriser les autres fonctions aussi
  const disconnectFromRoom = useCallback(() => {
    if (webSocketRef.current) {
      webSocketRef.current.close();
      webSocketRef.current = null;
    }
    setMessages([]);
    setConnected(false);
    setRoomId(null);
    setConnectedPlayers([]);
    setRoomConfig(null);
  }, []);

  const sendMessage = useCallback(
    (message: string) => {
      if (webSocketRef.current && connected) {
        webSocketRef.current.send(message);
      }
    },
    [connected]
  );

  // Demander la liste des joueurs périodiquement (optionnel)
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (connected && roomId) {
      interval = setInterval(() => {
        const message: GetPlayerListMessage = { type: "get_player_list" };
        sendMessage(JSON.stringify(message));
      }, 10000); // Toutes les 10 secondes
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [connected, roomId, sendMessage]);

  return (
    <WebSocketContext.Provider
      value={{
        connectToRoom,
        disconnectFromRoom,
        sendMessage,
        messages,
        connected,
        roomId,
        connectedPlayers,
        roomConfig,
        updateRoomConfig,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
}

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error("useWebSocket must be used within a WebSocketProvider");
  }
  return context;
};
