// app/room/[id]/page.tsx
"use client";
import { useEffect } from "react";
import { useWebSocket } from "@/utils/providers/webScoketProvider";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import PlayersComponent from "@/components/players/listePlayers";
import RoomConfigComponent from "@/components/rooms/roomConfig";
import ChatComponent from "@/components/rooms/chat";

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
  const {
    connectToRoom,
    disconnectFromRoom,
    connectedPlayers,
    roomConfig, // Utiliser la config du provider
    updateRoomConfig, // Utiliser la méthode de mise à jour
  } = useWebSocket();

  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const roomParam = params.id as string;
  const clientParam = searchParams.get("client");

  // Configuration locale par défaut (utilisée seulement si roomConfig est null)
  const defaultConfig: RoomConfig = {
    roomName: roomParam || "nomdelaromm",
    password: "voir le pwd",
    playlist: "Pop",
    clipDuration: "15 sec",
    clipMoment: "refrain",
    buzzerOffDuration: "3 sec",
    cutMusicAfterBuzz: true,
  };

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomParam, clientParam]); // On retire connectToRoom et disconnectFromRoom des dépendances

  // Gestionnaire pour mettre à jour la configuration
  const handleConfigChange = (newConfig: RoomConfig) => {
    // Utiliser la méthode updateRoomConfig du provider
    // qui se charge d'envoyer la mise à jour à tous les clients
    updateRoomConfig(newConfig);
  };

  // Si les paramètres sont manquants, afficher un message de chargement
  if (!roomParam || !clientParam) {
    return (
      <div className="p-4 text-center">
        Redirection vers la création de room...
      </div>
    );
  }

  // Utiliser la configuration du provider ou la configuration par défaut
  const currentConfig = roomConfig || defaultConfig;

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <div className="border-2 border-black rounded-lg p-6">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold">
            Room : {currentConfig.roomName}
          </h1>
          <p className="text-md">pwd : {currentConfig.password}</p>
        </div>
        <div className="flex flex-wrap -mx-2">
          {/* Joueurs connectés */}
          <div className="w-full md:w-1/3 px-2 mb-4">
            <div className="border-2 border-black rounded-lg h-full p-4">
              <h2 className="text-xl font-bold mb-3">
                joueurs connectés ({connectedPlayers.length})
              </h2>
              <PlayersComponent players={connectedPlayers} />
            </div>
          </div>
          {/* Configuration de la room */}
          <div className="w-full md:w-1/3 px-2 mb-4">
            <div className="border-2 border-black rounded-lg h-full p-4">
              <h2 className="text-xl font-bold mb-3">reglès</h2>
              <RoomConfigComponent
                config={currentConfig}
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
