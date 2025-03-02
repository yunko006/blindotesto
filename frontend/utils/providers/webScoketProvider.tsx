"use client";
import { createContext, useContext, useRef, useState, ReactNode } from "react";

interface WebSocketContextType {
  connectToRoom: (id: string) => void;
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

  const connectToRoom = (id: string) => {
    // Ne reconnectez pas si déjà connecté à cette room
    if (connected && roomId === id) {
      return;
    }

    // Fermer toute connexion existante
    if (webSocketRef.current) {
      webSocketRef.current.close();
    }

    console.log(`Connexion à la room ${id}`);

    // Créer une nouvelle connexion
    const ws = new WebSocket(`ws://localhost:8000/ws/${id}`);

    ws.onopen = () => {
      console.log(`Connecté à la room ${id}`);
      setConnected(true);
      setRoomId(id);
    };

    ws.onmessage = (event) => {
      const message = event.data;
      setMessages((prev) => [...prev, message]);
    };

    ws.onclose = () => {
      console.log(`Déconnecté de la room ${id}`);
      setConnected(false);
      setRoomId(null);
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      setConnected(false);
    };

    webSocketRef.current = ws;
  };

  const disconnectFromRoom = () => {
    if (webSocketRef.current) {
      webSocketRef.current.close();
      webSocketRef.current = null;
    }
    setMessages([]);
    setConnected(false);
    setRoomId(null);
  };

  const sendMessage = (message: string) => {
    if (webSocketRef.current && connected) {
      webSocketRef.current.send(message);
    }
  };

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
