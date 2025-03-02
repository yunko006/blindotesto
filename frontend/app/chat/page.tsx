// app/chat/page.tsx
"use client";

import { useState, FormEvent, useEffect } from "react";
import { useWebSocket } from "@/utils/providers/webScoketProvider";
import { useRouter, useSearchParams } from "next/navigation";

export default function ChatPage() {
  const [inputMessage, setInputMessage] = useState("");
  const {
    connectToRoom,
    disconnectFromRoom,
    sendMessage,
    messages,
    connected,
    roomId,
  } = useWebSocket();
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomParam = searchParams.get("room");
  const clientParam = searchParams.get("client");

  // Rediriger vers la page de création si les paramètres sont manquants
  useEffect(() => {
    if (!roomParam || !clientParam) {
      router.push("/create-room");
    }
  }, [roomParam, clientParam, router]);

  // Se connecter à la room avec l'identifiant client
  useEffect(() => {
    let isFirstRender = true;

    if (roomParam && clientParam && isFirstRender) {
      console.log(
        `Connexion à la room ${roomParam} en tant que ${clientParam}`
      );
      connectToRoom(roomParam, clientParam);
      isFirstRender = false;

      // Nettoyer proprement à la déconnexion
      return () => {
        console.log(`Nettoyage: Déconnexion de la room ${roomParam}`);
        disconnectFromRoom();
      };
    }
  }, [roomParam, clientParam]); // Retirez connectToRoom et disconnectFromRoom des dépendances

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (inputMessage.trim()) {
      sendMessage(inputMessage);
      setInputMessage("");
    }
  };

  // Si les paramètres sont manquants, afficher un message de chargement
  if (!roomParam || !clientParam) {
    return (
      <div className="p-4 text-center">
        Redirection vers la création de room...
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">WebSocket Chat</h1>

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
          <div className="text-sm text-gray-600">Client: {clientParam}</div>
        </div>
      </div>

      <div className="bg-gray-100 rounded p-4 h-80 overflow-y-auto mb-4">
        {messages.length === 0 ? (
          <p className="text-gray-500 italic">Aucun message pour le moment</p>
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

      <div className="mt-4 text-center">
        <button
          onClick={() => router.push("/create-room")}
          className="text-blue-500 hover:underline"
        >
          Rejoindre une autre room
        </button>
      </div>
    </div>
  );
}
