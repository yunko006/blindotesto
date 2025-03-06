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
  id: string;
  name: string;
  score: number;
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

// Interface pour l'état complet de la room
interface RoomState {
  id: string;
  name: string;
  has_password: boolean;
  game_state: "waiting" | "playing" | "paused" | "ended";
  buzzer_state: "inactive" | "active" | "buzzed";
  current_buzzer: string | null;
  players: Record<string, { name: string; score: number }>;
  config: {
    playlist: string;
    clipDuration: string;
    clipMoment: string;
    buzzerOffDuration: string;
    cutMusicAfterBuzz: boolean;
  };
  current_song: any;
}

// Interface pour un message de chat
interface ChatMessageData {
  id: string;
  sender_id: string;
  sender_name: string;
  content: string;
  room_id: string;
  sender_role: string;
  is_system: boolean;
  timestamp: string;
}

// Types de base pour le WebSocketContext
interface WebSocketContextType {
  connectToRoom: (roomId: string, clientId: string) => void;
  disconnectFromRoom: () => void;
  sendMessage: (message: string) => void;
  lastMessage: string | null;
  chatMessages: ChatMessageData[];
  isConnected: boolean;
  roomId: string | null;
  players: Player[];
  roomState: RoomState | null;
  roomConfig: RoomConfig | null;
  updateRoomConfig: (config: RoomConfig) => void;
  startGame: () => void;
  sendBuzz: () => void;
  reconnectAttempts: number;
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
  clipDuration: "15",
  clipMoment: "refrain",
  buzzerOffDuration: "3",
  cutMusicAfterBuzz: true,
};

export function WebSocketProvider({ children }: WebSocketProviderProps) {
  const [lastMessage, setLastMessage] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessageData[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [clientId, setClientId] = useState<string | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [roomConfig, setRoomConfig] = useState<RoomConfig | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const webSocketRef = useRef<WebSocket | null>(null);

  const MAX_RECONNECT_ATTEMPTS = 3;

  // Mettre à jour la configuration et l'envoyer à tous les clients
  const updateRoomConfig = useCallback(
    (config: RoomConfig) => {
      setRoomConfig(config);

      // Envoyer la mise à jour aux autres clients
      if (webSocketRef.current && isConnected) {
        const message = {
          type: "config_update",
          config: {
            playlist: config.playlist,
            clipDuration: config.clipDuration,
            clipMoment: config.clipMoment,
            buzzerOffDuration: config.buzzerOffDuration,
            cutMusicAfterBuzz: config.cutMusicAfterBuzz,
          },
        };
        webSocketRef.current.send(JSON.stringify(message));
      }
    },
    [isConnected]
  );

  // Connexion à une room
  const connectToRoom = useCallback(
    (newRoomId: string, newClientId: string) => {
      // Limiter les tentatives de reconnexion
      if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
        console.error("Nombre maximum de tentatives de reconnexion atteint");
        return;
      }

      // Ne pas reconnecter si déjà connecté à cette room avec ce client
      if (isConnected && roomId === newRoomId && clientId === newClientId) {
        return;
      }

      // Fermer toute connexion existante
      if (webSocketRef.current) {
        try {
          webSocketRef.current.close();
        } catch (error) {
          console.error("Erreur lors de la fermeture de la connexion:", error);
        }
        webSocketRef.current = null;
      }

      setTimeout(() => {
        try {
          console.log(
            `Tentative de connexion ${
              reconnectAttempts + 1
            } à la room ${newRoomId} en tant que ${newClientId}`
          );

          const ws = new WebSocket(
            `ws://localhost:8000/ws/${newRoomId}?client_id=${newClientId}`
          );

          ws.onopen = () => {
            console.log(`Connecté à la room ${newRoomId}`);
            setIsConnected(true);
            setRoomId(newRoomId);
            setClientId(newClientId);
            setReconnectAttempts(0); // Réinitialiser les tentatives

            // Demander immédiatement la liste des joueurs et l'état de la room
            ws.send(JSON.stringify({ type: "get_player_list" }));
          };

          ws.onmessage = (event) => {
            try {
              // Stocker le message brut
              setLastMessage(event.data);

              // Parser le message
              const data = JSON.parse(event.data);
              console.log("Message reçu:", data);

              // Traiter différents types de messages
              switch (data.type) {
                case "room_state":
                  if (data.state) {
                    setRoomState(data.state);

                    // Mettre à jour la liste des joueurs
                    if (data.state.players) {
                      const playersList = Object.entries(
                        data.state.players
                      ).map(([id, playerData]: [string, any]) => ({
                        id,
                        name: playerData.name,
                        score: playerData.score,
                      }));
                      setPlayers(playersList);
                    }

                    // Mettre à jour la configuration
                    if (data.state.config) {
                      setRoomConfig({
                        roomName: data.state.name,
                        password: data.state.has_password ? "********" : "",
                        playlist: data.state.config.playlist,
                        clipDuration: data.state.config.clipDuration,
                        clipMoment: data.state.config.clipMoment,
                        buzzerOffDuration: data.state.config.buzzerOffDuration,
                        cutMusicAfterBuzz: data.state.config.cutMusicAfterBuzz,
                      });
                    }
                  }
                  break;

                case "player_list":
                  if (data.players) {
                    const playersList = Object.entries(data.players).map(
                      ([id, playerData]: [string, any]) => ({
                        id,
                        name: playerData.name,
                        score: playerData.score || 0,
                      })
                    );
                    setPlayers(playersList);
                  }
                  break;

                case "chat_history":
                  if (data.messages) {
                    setChatMessages(data.messages);
                  }
                  break;

                case "chat_message":
                  if (data.message) {
                    setChatMessages((prev) => [...prev, data.message]);
                  }
                  break;

                case "config_updated":
                  if (data.config) {
                    setRoomConfig((prev) => {
                      if (!prev)
                        return {
                          ...defaultRoomConfig,
                          ...data.config,
                        };

                      return {
                        ...prev,
                        playlist: data.config.playlist || prev.playlist,
                        clipDuration:
                          data.config.clipDuration || prev.clipDuration,
                        clipMoment: data.config.clipMoment || prev.clipMoment,
                        buzzerOffDuration:
                          data.config.buzzerOffDuration ||
                          prev.buzzerOffDuration,
                        cutMusicAfterBuzz:
                          data.config.cutMusicAfterBuzz !== undefined
                            ? data.config.cutMusicAfterBuzz
                            : prev.cutMusicAfterBuzz,
                      };
                    });
                  }
                  break;

                default:
                  console.log("Message de type inconnu:", data);
              }
            } catch (error) {
              console.error("Erreur lors du traitement du message:", error);
              console.log("Message brut:", event.data);
            }
          };

          ws.onclose = (event) => {
            console.log(
              `Déconnecté de la room ${newRoomId}`,
              event.code,
              event.reason
            );

            // Tentative de reconnexion automatique avec un délai exponentiel
            if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
              const timeout = Math.pow(2, reconnectAttempts) * 1000;
              setReconnectAttempts((prev) => prev + 1);

              setTimeout(() => {
                connectToRoom(newRoomId, newClientId);
              }, timeout);
            } else {
              // Réinitialisation complète si max tentatives atteintes
              setIsConnected(false);
              setRoomId(null);
              setClientId(null);
              setPlayers([]);
              setRoomState(null);
              setRoomConfig(null);
              setChatMessages([]);
            }
          };

          ws.onerror = (error) => {
            console.error("WebSocket error:", error);
            setIsConnected(false);

            // Incrémenter les tentatives de reconnexion en cas d'erreur
            if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
              setReconnectAttempts((prev) => prev + 1);
            }
          };

          webSocketRef.current = ws;
        } catch (error) {
          console.error("Erreur lors de la création du WebSocket:", error);
        }
      }, 500); // Délai de 500ms avant de se reconnecter
    },
    [isConnected, roomId, clientId, reconnectAttempts]
  );

  // Déconnexion de la room
  const disconnectFromRoom = useCallback(() => {
    if (webSocketRef.current) {
      try {
        webSocketRef.current.close();
      } catch (error) {
        console.error("Erreur lors de la fermeture de la connexion:", error);
      }
      webSocketRef.current = null;
    }
    setLastMessage(null);
    setChatMessages([]);
    setIsConnected(false);
    setRoomId(null);
    setClientId(null);
    setPlayers([]);
    setRoomState(null);
    setRoomConfig(null);
    setReconnectAttempts(0);
  }, []);

  // Envoyer un message
  const sendMessage = useCallback(
    (message: string) => {
      if (webSocketRef.current && isConnected) {
        try {
          const fullMessage = JSON.stringify({
            type: "chat_message",
            content: message,
          });
          webSocketRef.current.send(fullMessage);
        } catch (error) {
          console.warn("Impossible d'envoyer le message:", error);
        }
      } else {
        console.warn("Impossible d'envoyer le message: WebSocket non connecté");
      }
    },
    [isConnected]
  );

  // Démarrer le jeu
  const startGame = useCallback(() => {
    if (webSocketRef.current && isConnected) {
      webSocketRef.current.send(JSON.stringify({ type: "start_game" }));
    }
  }, [isConnected]);

  // Envoyer un buzz
  const sendBuzz = useCallback(() => {
    if (webSocketRef.current && isConnected) {
      webSocketRef.current.send(JSON.stringify({ type: "buzz" }));
    }
  }, [isConnected]);

  // Ping pour maintenir la connexion active
  useEffect(() => {
    let pingInterval: NodeJS.Timeout | null = null;

    if (isConnected) {
      pingInterval = setInterval(() => {
        try {
          if (
            webSocketRef.current &&
            webSocketRef.current.readyState === WebSocket.OPEN
          ) {
            // Envoyer un ping silencieux pour maintenir la connexion
            webSocketRef.current.send(JSON.stringify({ type: "ping" }));
          }
        } catch (error) {
          console.error("Erreur lors de l'envoi du ping:", error);
        }
      }, 30000); // Ping toutes les 30 secondes
    }

    return () => {
      if (pingInterval) clearInterval(pingInterval);
    };
  }, [isConnected]);

  return (
    <WebSocketContext.Provider
      value={{
        connectToRoom,
        disconnectFromRoom,
        sendMessage,
        lastMessage,
        chatMessages,
        isConnected,
        roomId,
        players,
        roomState,
        roomConfig,
        updateRoomConfig,
        startGame,
        sendBuzz,
        reconnectAttempts,
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
