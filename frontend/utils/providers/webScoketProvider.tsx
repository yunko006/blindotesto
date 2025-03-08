"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  ReactNode,
} from "react";

// Define message types based on your app's communication protocol
interface BaseMessage {
  type: string;
}

// Message from server to client
interface ServerMessage extends BaseMessage {
  [key: string]: unknown;
}

// Message from client to server
interface ClientMessage extends BaseMessage {
  [key: string]: unknown;
}

// Define the WebSocket context type
interface WebSocketContextType {
  // Connection management
  connect: (roomId: string, clientId: string) => void;
  disconnect: () => void;
  isConnected: boolean;

  // Basic WebSocket methods
  sendMessage: (messageObj: ClientMessage | string) => boolean;

  // Message handling
  lastMessage: ServerMessage | null;
  addMessageListener: (listener: (data: ServerMessage) => void) => number;
  removeMessageListener: (id: number) => void;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

// Simple message listener type
interface MessageListener {
  id: number;
  callback: (data: ServerMessage) => void;
}

interface WebSocketProviderProps {
  children: ReactNode;
  serverUrl?: string;
}

export function WebSocketProvider({
  children,
  serverUrl = "ws://localhost:8000/ws",
}: WebSocketProviderProps) {
  // WebSocket reference
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<ServerMessage | null>(null);

  // Track listeners with useRef to avoid dependency issues
  const listeners = useRef<MessageListener[]>([]);
  const nextListenerId = useRef<number>(1);

  // Connect to a room
  const connect = useCallback(
    (roomId: string, clientId: string) => {
      // Close existing connection if any
      if (wsRef.current) {
        wsRef.current.close();
      }

      try {
        // Create new WebSocket connection
        const ws = new WebSocket(
          `${serverUrl}/${roomId}?client_id=${clientId}`
        );

        // Set up event handlers
        ws.onopen = () => {
          console.log(`Connected to room ${roomId} as ${clientId}`);
          setIsConnected(true);
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data) as ServerMessage;
            // Update last message
            setLastMessage(data);

            // Notify all listeners
            listeners.current.forEach((listener) => {
              try {
                listener.callback(data);
              } catch (error) {
                console.error("Error in message listener:", error);
              }
            });
          } catch (error) {
            console.error("Error parsing message:", error);
          }
        };

        ws.onclose = () => {
          console.log(`Disconnected from room ${roomId}`);
          setIsConnected(false);
        };

        ws.onerror = (error) => {
          console.error("WebSocket error:", error);
          setIsConnected(false);
        };

        // Store the WebSocket reference
        wsRef.current = ws;
      } catch (error) {
        console.error("Error connecting to WebSocket:", error);
      }
    },
    [serverUrl]
  );

  // Disconnect from the room
  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
    setLastMessage(null);
  }, []);

  // Send a message to the server
  const sendMessage = useCallback(
    (messageObj: ClientMessage | string): boolean => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        console.warn("Cannot send message: WebSocket not connected");
        return false;
      }

      try {
        const message =
          typeof messageObj === "string"
            ? messageObj
            : JSON.stringify(messageObj);

        wsRef.current.send(message);
        return true;
      } catch (error) {
        console.error("Error sending message:", error);
        return false;
      }
    },
    []
  );

  // Add a message listener
  const addMessageListener = useCallback(
    (callback: (data: ServerMessage) => void): number => {
      const id = nextListenerId.current++;
      listeners.current.push({ id, callback });
      return id;
    },
    []
  );

  // Remove a message listener
  const removeMessageListener = useCallback((id: number): void => {
    listeners.current = listeners.current.filter(
      (listener) => listener.id !== id
    );
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  return (
    <WebSocketContext.Provider
      value={{
        connect,
        disconnect,
        isConnected,
        sendMessage,
        lastMessage,
        addMessageListener,
        removeMessageListener,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
}

// Custom hook to use the WebSocket context
export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error("useWebSocket must be used within a WebSocketProvider");
  }
  return context;
}
