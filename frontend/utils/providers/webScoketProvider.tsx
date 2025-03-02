"use client";
import {
  createContext,
  useContext,
  useRef,
  useState,
  ReactNode,
  useCallback,
} from "react";

interface WebSocketContextType {
  connectToRoom: (roomId: string, clientId: string) => void;
  disconnectFromRoom: () => void;
  sendMessage: (message: string) => void;
  messages: string[];
  connected: boolean;
  roomId: string | null;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

interface WebSocketProviderProps {
  children: ReactNode;
}

export function WebSocketProvider({ children }: WebSocketProviderProps) {
  const [messages, setMessages] = useState<string[]>([]);
  const [connected, setConnected] = useState(false);
  const [roomId, setRoomId] = useState<string | null>(null);
  const webSocketRef = useRef<WebSocket | null>(null);

  // Utiliser useCallback pour mémoriser la fonction
  const connectToRoom = useCallback(
    (newRoomId: string, clientId: string) => {
      // Ne reconnectez pas si déjà connecté à cette room
      if (connected && roomId === newRoomId) {
        return;
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
            setRoomId(newRoomId);
          };

          ws.onmessage = (event) => {
            const message = event.data;
            setMessages((prev) => [...prev, message]);
          };

          ws.onclose = (event) => {
            console.log(
              `Déconnecté de la room ${newRoomId}`,
              event.code,
              event.reason
            );
            setConnected(false);
            setRoomId(null);
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
  }, []);

  const sendMessage = useCallback(
    (message: string) => {
      if (webSocketRef.current && connected) {
        webSocketRef.current.send(message);
      }
    },
    [connected]
  );

  return (
    <WebSocketContext.Provider
      value={{
        connectToRoom,
        disconnectFromRoom,
        sendMessage,
        messages,
        connected,
        roomId,
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
