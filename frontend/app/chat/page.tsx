"use client";

import { useState, FormEvent, useEffect } from "react";
import { useWebSocket } from "@/utils/providers/webScoketProvider";
import { useSearchParams } from "next/navigation";

export default function ChatPage() {
  const [inputMessage, setInputMessage] = useState("");
  const { connectToRoom, sendMessage, messages, connected, roomId } =
    useWebSocket();
  const searchParams = useSearchParams();
  const roomParam = searchParams.get("room") || "general";

  // Se connecter à la room spécifiée dans l'URL
  useEffect(() => {
    // Utilisez une variable pour empêcher une deuxième connexion
    let isFirstRender = true;

    if (isFirstRender) {
      console.log(`Connexion à la room: ${roomParam}`);
      connectToRoom(roomParam);
      isFirstRender = false;
    }
  }, [connectToRoom, roomParam]); // Tableau de dépendances vide = exécuté une seule fois

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (inputMessage.trim()) {
      sendMessage(inputMessage);
      setInputMessage("");
    }
  };

  return (
    <div className="max-w-md mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">WebSocket Chat</h1>

      <div className="mb-4 p-2 rounded bg-gray-100">
        <div className="flex items-center">
          <div
            className={`w-3 h-3 rounded-full mr-2 ${
              connected ? "bg-green-500" : "bg-red-500"
            }`}
          ></div>
          <span>
            {connected ? `Connected to room: ${roomId}` : "Disconnected"}
          </span>
        </div>
      </div>

      <div className="bg-gray-100 rounded p-4 h-80 overflow-y-auto mb-4">
        {messages.length === 0 ? (
          <p className="text-gray-500 italic">No messages yet</p>
        ) : (
          <ul>
            {messages.map((message, index) => (
              <li key={index} className="mb-2 pb-2 border-b border-gray-200">
                {message}
              </li>
            ))}
          </ul>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          className="flex-1 p-2 border border-gray-300 rounded-l focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Type a message..."
          disabled={!connected}
        />
        <button
          type="submit"
          className="bg-blue-500 text-white p-2 rounded-r hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={!connected || !inputMessage.trim()}
        >
          Send
        </button>
      </form>
    </div>
  );
}
