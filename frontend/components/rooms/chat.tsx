import React, { useState, FormEvent, useRef, useEffect } from "react";
import { useWebSocket } from "@/utils/providers/webScoketProvider";

// Props du composant Chat
interface ChatComponentProps {
  roomId: string;
}

// Définir les types pour les messages chat
interface ChatMessage {
  id: string;
  sender_id: string;
  sender_name: string;
  content: string;
  room_id: string;
  sender_role: string;
  is_system: boolean;
  timestamp: string;
  is_self?: boolean;
}

// Interface pour les messages WebSocket entrants
interface WebSocketChatMessage {
  type: string;
  messages?: ChatMessage[];
  message?: ChatMessage;
}

const ChatComponent = ({ roomId }: ChatComponentProps) => {
  const [inputMessage, setInputMessage] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  // Utiliser les nouvelles propriétés du provider
  const {
    sendMessage,
    isConnected,
    addMessageListener,
    removeMessageListener,
  } = useWebSocket();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // S'abonner aux messages de chat
  useEffect(() => {
    // Gestionnaire de messages
    const handleChatMessages = (data: WebSocketChatMessage) => {
      if (data.type === "chat_history" && Array.isArray(data.messages)) {
        setChatMessages(data.messages);
      } else if (data.type === "chat_message" && data.message) {
        // Créer explicitement un nouvel objet ChatMessage pour éviter les problèmes de typage
        const newMessage: ChatMessage = { ...data.message };
        setChatMessages((prev) => [...prev, newMessage]);
      } else if (data.type === "system_message" && data.message) {
        // Vérifier explicitement que data.message n'est pas undefined
        const systemMessage: ChatMessage = {
          ...data.message,
          is_system: true,
        };
        setChatMessages((prev) => [...prev, systemMessage]);
      }
    };

    // Ajouter le listener et stocker son ID
    const listenerId = addMessageListener(handleChatMessages);

    // Nettoyer à la désinscription
    return () => {
      removeMessageListener(listenerId);
    };
  }, [addMessageListener, removeMessageListener]);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    // Ajouter un petit délai pour s'assurer que le DOM est mis à jour
    const timeoutId = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
    return () => clearTimeout(timeoutId);
  }, [chatMessages]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (inputMessage.trim()) {
      // Envoyer un message formaté au format JSON avec le type chat_message
      sendMessage({
        type: "chat_message",
        content: inputMessage.trim(),
      });
      setInputMessage("");
    }
  };

  // Fonction pour formater l'heure à partir d'un timestamp ISO
  const formatTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      return "";
    }
  };

  // Fonction pour obtenir une couleur pour un utilisateur spécifique (pour différencier visuellement)
  const getUserColor = (senderId: string) => {
    // Générer une couleur pseudoaléatoire basée sur l'ID de l'expéditeur
    const hash = senderId
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const hue = hash % 360;
    return `hsl(${hue}, 70%, 40%)`;
  };

  return (
    <div className="flex flex-col h-full">
      <div className="mb-4 p-2 rounded bg-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <div
              className={`w-3 h-3 rounded-full inline-block mr-2 ${
                isConnected ? "bg-green-500" : "bg-red-500"
              }`}
            ></div>
            <span>
              {isConnected ? `Connecté à la room: ${roomId}` : "Déconnecté"}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-gray-100 rounded p-4 h-60 overflow-y-auto mb-4">
        {chatMessages.length === 0 ? (
          <p className="text-gray-500 italic">Aucun message pour le moment</p>
        ) : (
          <ul>
            {chatMessages.map((message) => {
              const isSystem = message.is_system;
              const isCurrentUser = message.sender_id === "you"; // Adapter selon votre logique

              return (
                <li
                  key={message.id}
                  className={`mb-2 pb-2 border-b border-gray-200 ${
                    isSystem ? "text-blue-600 italic" : ""
                  }`}
                >
                  {/* Temps du message */}
                  <span className="text-xs text-gray-500 mr-1">
                    {formatTime(message.timestamp)}
                  </span>

                  {/* Nom de l'expéditeur */}
                  {!isSystem && (
                    <span
                      className="font-semibold mr-1"
                      style={{ color: getUserColor(message.sender_id) }}
                    >
                      {message.sender_name}:
                    </span>
                  )}

                  {/* Contenu du message */}
                  <span className={isCurrentUser ? "font-medium" : ""}>
                    {message.content}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
        {/* Élément invisible pour le scroll automatique */}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="flex">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          className="flex-1 p-2 border border-gray-300 rounded-l focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Tapez un message..."
          disabled={!isConnected}
        />
        <button
          type="submit"
          className="bg-blue-500 text-white p-2 rounded-r hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={!isConnected || !inputMessage.trim()}
        >
          Envoyer
        </button>
      </form>
    </div>
  );
};

export default ChatComponent;
