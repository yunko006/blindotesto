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
    players, // Nouveau nom pour les joueurs connectés
    roomState, // Nouvel état pour toutes les données de la room
    roomConfig, // Configuration de la room
    updateRoomConfig, // Méthode pour mettre à jour la config
    startGame, // Nouvelle méthode pour démarrer le jeu
    isConnected, // État de connexion
  } = useWebSocket();

  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const roomParam = params.id as string;
  const clientParam = searchParams.get("client");

  // Configuration locale par défaut (utilisée seulement si roomConfig est null)
  const defaultConfig: RoomConfig = {
    roomName: roomParam || "Room sans nom",
    password: "",
    playlist: "Pop",
    clipDuration: "15",
    clipMoment: "refrain",
    buzzerOffDuration: "3",
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
    if (roomParam && clientParam) {
      console.log(
        `Connexion à la room ${roomParam} en tant que ${clientParam}`
      );
      connectToRoom(roomParam, clientParam);

      // Nettoyer proprement à la déconnexion
      return () => {
        console.log(`Nettoyage: Déconnexion de la room ${roomParam}`);
        disconnectFromRoom();
      };
    }
  }, [roomParam, clientParam, connectToRoom, disconnectFromRoom]);

  // Gestionnaire pour mettre à jour la configuration
  const handleConfigChange = (newConfig: RoomConfig) => {
    updateRoomConfig(newConfig);
  };

  // Gestionnaire pour démarrer la partie
  const handleStartGame = () => {
    startGame();
  };

  // Si les paramètres sont manquants, afficher un message de chargement
  if (!roomParam || !clientParam) {
    return (
      <div className="p-4 text-center">
        Redirection vers la création de room...
      </div>
    );
  }

  // Si pas encore connecté, afficher un indicateur de chargement
  if (!isConnected) {
    return (
      <div className="p-4 text-center">
        <div className="animate-pulse">Connexion à la room en cours...</div>
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
          {currentConfig.password && (
            <p className="text-md">Protégée par mot de passe</p>
          )}

          {/* Informations sur l'état du jeu */}
          {roomState && (
            <p className="mt-2 text-blue-600">
              État :{" "}
              {roomState.game_state === "waiting"
                ? "En attente de joueurs"
                : roomState.game_state === "playing"
                ? "Partie en cours"
                : roomState.game_state === "paused"
                ? "Partie en pause"
                : "Partie terminée"}
            </p>
          )}
        </div>

        <div className="flex flex-wrap -mx-2">
          {/* Joueurs connectés */}
          <div className="w-full md:w-1/3 px-2 mb-4">
            <div className="border-2 border-black rounded-lg h-full p-4">
              <h2 className="text-xl font-bold mb-3">
                Joueurs connectés ({players.length})
              </h2>
              <PlayersComponent players={players} />
            </div>
          </div>

          {/* Configuration de la room */}
          <div className="w-full md:w-1/3 px-2 mb-4">
            <div className="border-2 border-black rounded-lg h-full p-4">
              <h2 className="text-xl font-bold mb-3">Règles</h2>
              <RoomConfigComponent
                config={currentConfig}
                onConfigChange={handleConfigChange}
              />
            </div>
          </div>

          {/* Chat */}
          <div className="w-full md:w-1/3 px-2 mb-4">
            <div className="border-2 border-black rounded-lg h-full p-4">
              <h2 className="text-xl font-bold mb-3">Chat</h2>
              <ChatComponent />
            </div>
          </div>
        </div>

        {/* Bouton pour démarrer la partie (visible seulement en état d'attente) */}
        {roomState && roomState.game_state === "waiting" && (
          <div className="mt-4 text-center">
            <button
              onClick={handleStartGame}
              className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-6 rounded"
            >
              Démarrer la partie
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
