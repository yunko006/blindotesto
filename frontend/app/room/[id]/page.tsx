"use client";
import { useEffect, useState, useCallback } from "react";
import { useWebSocket } from "@/utils/providers/webScoketProvider";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import PlayersComponent from "@/components/players/listePlayers";
import RoomConfigComponent from "@/components/rooms/roomConfig";
import ChatComponent from "@/components/rooms/chat";

interface Player {
  id: string;
  name: string;
  score: number;
}

interface RoomState {
  id: string;
  name: string;
  has_password: boolean;
  game_state: "waiting" | "playing" | "paused" | "ended";
  buzzer_state: "inactive" | "active" | "buzzed";
  current_buzzer: string | null;
  players: Record<string, { name: string; score: number }>;
  config: {
    playlist: string;
    clipDuration: string;
    clipMoment: string;
    buzzerOffDuration: string;
    cutMusicAfterBuzz: boolean;
  };
  current_song: any;
}

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
  // États locaux pour stocker les données reçues via WebSocket
  const [players, setPlayers] = useState<Player[]>([]);
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [roomConfig, setRoomConfig] = useState<RoomConfig | null>(null);

  // Utiliser le nouveau provider WebSocket
  const {
    connect,
    disconnect,
    isConnected,
    sendMessage,
    addMessageListener,
    removeMessageListener,
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

  // Gestionnaire de messages pour les mises à jour d'état de la room
  const handleRoomStateMessages = useCallback(
    (data) => {
      if (data.type === "room_state" && data.state) {
        setRoomState(data.state);

        // Extraire les joueurs de l'état de la room
        if (data.state.players) {
          const playersList = Object.entries(data.state.players).map(
            ([id, playerData]: [string, any]) => ({
              id,
              name: playerData.name,
              score: playerData.score || 0,
            })
          );
          setPlayers(playersList);
        }

        // Extraire la configuration
        if (data.state.config) {
          setRoomConfig({
            roomName: data.state.name,
            password: data.state.has_password ? "********" : "",
            playlist: data.state.config.playlist,
            clipDuration: data.state.config.clipDuration,
            clipMoment: data.state.config.clipMoment,
            buzzerOffDuration: data.state.config.buzzerOffDuration,
            cutMusicAfterBuzz: data.state.config.cutMusicAfterBuzz,
          });
        }
      } else if (data.type === "player_list" && data.players) {
        const playersList = Object.entries(data.players).map(
          ([id, playerData]: [string, any]) => ({
            id,
            name: playerData.name,
            score: playerData.score || 0,
          })
        );
        setPlayers(playersList);
      } else if (data.type === "config_update" && data.config) {
        setRoomConfig((prevConfig) => {
          if (!prevConfig) return { ...defaultConfig, ...data.config };
          return { ...prevConfig, ...data.config };
        });
      }
    },
    [defaultConfig]
  );

  // Rediriger vers la page de création si les paramètres sont manquants
  useEffect(() => {
    if (!roomParam || !clientParam) {
      router.push("/create-room");
    }
  }, [roomParam, clientParam, router]);

  // Se connecter à la room avec l'identifiant client
  useEffect(() => {
    if (roomParam && clientParam) {
      // Ajouter un délai pour laisser le temps au serveur de préparer la room
      const timeoutId = setTimeout(() => {
        console.log(
          `Connexion à la room ${roomParam} en tant que ${clientParam}`
        );
        connect(roomParam, clientParam);
      }, 500); // 500ms de délai avant la connexion

      // Nettoyer proprement à la déconnexion
      return () => {
        clearTimeout(timeoutId);
        console.log(`Nettoyage: Déconnexion de la room ${roomParam}`);
        disconnect();
      };
    }
  }, [roomParam, clientParam, connect, disconnect]);

  // Ajouter un écouteur pour les messages d'état de la room
  useEffect(() => {
    const listenerId = addMessageListener(handleRoomStateMessages);

    // Si connecté, demander l'état initial de la room
    if (isConnected) {
      sendMessage({ type: "get_player_list" });
    }

    return () => {
      removeMessageListener(listenerId);
    };
  }, [
    isConnected,
    addMessageListener,
    removeMessageListener,
    handleRoomStateMessages,
    sendMessage,
  ]);

  // Gestionnaire pour mettre à jour la configuration
  const handleConfigChange = (newConfig: RoomConfig) => {
    // Envoyer la mise à jour au serveur
    sendMessage({
      type: "config_update",
      config: {
        playlist: newConfig.playlist,
        clipDuration: newConfig.clipDuration,
        clipMoment: newConfig.clipMoment,
        buzzerOffDuration: newConfig.buzzerOffDuration,
        cutMusicAfterBuzz: newConfig.cutMusicAfterBuzz,
      },
    });

    // Mettre à jour l'état local
    setRoomConfig(newConfig);
  };

  // Gestionnaire pour démarrer la partie
  const handleStartGame = () => {
    sendMessage({ type: "start_game" });
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
              <ChatComponent roomId={roomParam} />
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
