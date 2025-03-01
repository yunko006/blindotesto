"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

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
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [messages, setMessages] = useState<string[]>([]);
  const [connected, setConnected] = useState(false);
  const [roomId, setRoomId] = useState<string | null>(null);

  const connectToRoom = (id: string) => {
    if (socket) {
      socket.close();
    }

    const ws = new WebSocket(`ws://localhost:8000/ws/${id}`);

    ws.onopen = () => {
      setConnected(true);
      setRoomId(id);
      console.log(`Connecté à la room ${id}`);
    };

    ws.onmessage = (event) => {
      const message = event.data;
      setMessages((prev) => [...prev, message]);
    };

    ws.onclose = () => {
      setConnected(false);
      console.log("Déconnecté de la room");
    };

    setSocket(ws);
  };

  const sendMessage = (message: string) => {
    if (socket && connected) {
      socket.send(message);
    }
  };

  const disconnectFromRoom = () => {
    if (socket) {
      socket.close();
      setSocket(null);
      setRoomId(null);
      setMessages([]);
    }
  };

  // Nettoyage à la déconnexion
  useEffect(() => {
    return () => {
      if (socket) {
        socket.close();
      }
    };
  }, [socket]);

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
