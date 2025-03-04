// app/room/[id]/page.tsx
"use client";
import { useEffect, useState } from "react";
import { useWebSocket } from "@/utils/providers/webScoketProvider";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import PlayersComponent from "@/components/players/listePlayers";
import RoomConfigComponent from "@/components/rooms/roomConfig";
import ChatComponent from "@/components/rooms/chat";

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

export default function RoomPage() {
  const { connectToRoom, disconnectFromRoom } = useWebSocket();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const roomParam = params.id as string;
  const clientParam = searchParams.get("client");

  // État pour stocker la configuration actuelle de la room
  const [roomConfig, setRoomConfig] = useState<RoomConfig>({
    roomName: roomParam || "nomdelaromm",
    password: "voir le pwd",
    playlist: "Pop",
    clipDuration: "15 sec",
    clipMoment: "refrain",
    buzzerOffDuration: "3 sec",
    cutMusicAfterBuzz: true,
  });

  // État pour les joueurs connectés
  const [connectedPlayers, setConnectedPlayers] = useState([
    { id: 1, name: "matthieu" },
    { id: 2, name: "benoit" },
    { id: 3, name: "aude" },
    { id: 4, name: "momo" },
    { id: 5, name: "thomas" },
  ]);

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
  }, [roomParam, clientParam]); // On retire connectToRoom et disconnectFromRoom des dépendances

  // Gestionnaire pour mettre à jour la configuration
  const handleConfigChange = (newConfig: RoomConfig) => {
    setRoomConfig(newConfig);

    // Vous pouvez également sauvegarder la configuration localement si nécessaire
    localStorage.setItem(`roomConfig_${roomParam}`, JSON.stringify(newConfig));
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
    <div className="container mx-auto p-4 max-w-6xl">
      <div className="border-2 border-black rounded-lg p-6">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold">Room : {roomConfig.roomName}</h1>
          <p className="text-md">pwd : {roomConfig.password}</p>
        </div>
        <div className="flex flex-wrap -mx-2">
          {/* Joueurs connectés */}
          <div className="w-full md:w-1/3 px-2 mb-4">
            <div className="border-2 border-black rounded-lg h-full p-4">
              <h2 className="text-xl font-bold mb-3">joueurs connectés</h2>
              <PlayersComponent players={connectedPlayers} />
            </div>
          </div>
          {/* Configuration de la room */}
          <div className="w-full md:w-1/3 px-2 mb-4">
            <div className="border-2 border-black rounded-lg h-full p-4">
              <h2 className="text-xl font-bold mb-3">reglès</h2>
              <RoomConfigComponent
                config={roomConfig}
                onConfigChange={handleConfigChange}
              />
            </div>
          </div>
          {/* Chat */}
          <div className="w-full md:w-1/3 px-2 mb-4">
            <div className="border-2 border-black rounded-lg h-full p-4">
              <h2 className="text-xl font-bold mb-3">chat</h2>
              <ChatComponent />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
