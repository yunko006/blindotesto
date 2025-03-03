import React, { useState, FormEvent, useRef, useEffect } from "react";
import { useWebSocket } from "@/utils/providers/webScoketProvider";

const ChatComponent = () => {
  const [inputMessage, setInputMessage] = useState("");
  const { sendMessage, messages, connected, roomId } = useWebSocket();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    // Ajouter un petit délai pour s'assurer que le DOM est mis à jour
    const timeoutId = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [messages]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (inputMessage.trim()) {
      sendMessage(inputMessage);
      setInputMessage("");
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="mb-4 p-2 rounded bg-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <div
              className={`w-3 h-3 rounded-full inline-block mr-2 ${
                connected ? "bg-green-500" : "bg-red-500"
              }`}
            ></div>
            <span>
              {connected ? `Connecté à la room: ${roomId}` : "Déconnecté"}
            </span>
          </div>
        </div>
      </div>
      <div className="bg-gray-100 rounded p-4 h-60 overflow-y-auto mb-4">
        {messages.length === 0 ? (
          <p className="text-gray-500 italic">Aucun message pour le moment</p>
        ) : (
          <ul>
            {messages.map((message, index) => {
              // Enlever le préfixe "client" s'il existe
              let displayMessage = message;
              if (message.startsWith("client")) {
                // Remplacer "client nom:" par "nom:"
                displayMessage = message.replace(/^client\s+(\w+):/, "$1:");
              }
              return (
                <li key={index} className="mb-2 pb-2 border-b border-gray-200">
                  {displayMessage}
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
          disabled={!connected}
        />
        <button
          type="submit"
          className="bg-blue-500 text-white p-2 rounded-r hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={!connected || !inputMessage.trim()}
        >
          Envoyer
        </button>
      </form>
    </div>
  );
};

export default ChatComponent;
