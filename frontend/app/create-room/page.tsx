// app/create-room/page.tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateRoomPage() {
  const [roomId, setRoomId] = useState("");
  const [clientId, setClientId] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const router = useRouter();

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    // Générer un ID client aléatoire si non fourni
    const finalClientId =
      clientId || `user_${Math.floor(Math.random() * 10000)}`;

    // Rediriger vers la page de chat avec les paramètres
    router.push(`/chat?room=${roomId}&client=${finalClientId}`);
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md mt-10">
      <h1 className="text-2xl font-bold mb-6 text-center">
        Créer ou rejoindre une room
      </h1>

      <form onSubmit={handleCreateRoom} className="space-y-4">
        <div>
          <label
            htmlFor="roomId"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            ID de la Room
          </label>
          <input
            type="text"
            id="roomId"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            placeholder="Entrez l'ID de la room"
            required
            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label
            htmlFor="clientId"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Votre pseudonyme (optionnel)
          </label>
          <input
            type="text"
            id="clientId"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            placeholder="Entrez votre pseudo"
            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          type="submit"
          disabled={isCreating || !roomId}
          className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {isCreating ? "Création en cours..." : "Rejoindre la Room"}
        </button>
      </form>
    </div>
  );
}
