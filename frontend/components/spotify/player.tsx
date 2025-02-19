"use client";

import Script from "next/script";
import { useEffect, useState } from "react";

// Types pour le SDK Spotify
interface SpotifyPlayer {
  name: string;
  getOAuthToken: (callback: (token: string) => void) => void;
  volume: number;
}

interface WebPlaybackPlayer {
  device_id: string;
}

interface WebPlaybackState {
  paused: boolean;
  track_window: {
    current_track: {
      name: string;
      album: {
        name: string;
        images: { url: string }[];
      };
      artists: { name: string }[];
    };
  };
}

interface SpotifyError {
  message: string;
}

interface SpotifyWebPlaybackInstance {
  addListener(
    event: "ready",
    callback: (state: WebPlaybackPlayer) => void
  ): void;
  addListener(
    event: "not_ready",
    callback: (state: WebPlaybackPlayer) => void
  ): void;
  addListener(
    event: "player_state_changed",
    callback: (state: WebPlaybackState) => void
  ): void;
  addListener(
    event: "initialization_error",
    callback: (error: SpotifyError) => void
  ): void;
  addListener(
    event: "authentication_error",
    callback: (error: SpotifyError) => void
  ): void;
  addListener(
    event: "account_error",
    callback: (error: SpotifyError) => void
  ): void;
  connect(): Promise<boolean>;
  disconnect(): Promise<void>;
  togglePlay(): Promise<void>;
  seek(position_ms: number): Promise<void>;
  setVolume(volume: number): Promise<void>;
  pause(): Promise<void>;
  resume(): Promise<void>;
  getCurrentState(): Promise<WebPlaybackState | null>;
  getVolume(): Promise<number>;
}

// Étendre Window pour inclure l'API Spotify
declare global {
  interface Window {
    onSpotifyWebPlaybackSDKReady: () => void;
    Spotify: {
      Player: new (config: SpotifyPlayer) => SpotifyWebPlaybackInstance;
    };
  }
}

const SpotifyPlayer = () => {
  const [player, setPlayer] = useState<SpotifyWebPlaybackInstance | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [status, setStatus] = useState("Initializing...");
  const [currentTrack, setCurrentTrack] = useState<
    WebPlaybackState["track_window"]["current_track"] | null
  >(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    console.log("🎵 Composant monté, attente du SDK Spotify...");
    window.onSpotifyWebPlaybackSDKReady = () => {
      console.log("✅ SDK Spotify chargé");
      const token = localStorage.getItem("spotify_access_token");
      if (!token) {
        setStatus("No access token found!");
        return;
      }
      console.log("🎫 Token trouvé");
      const player = new window.Spotify.Player({
        name: "Web Playback SDK Quick Start Player",
        getOAuthToken: (cb: (token: string) => void) => {
          console.log("🔑 Callback OAuth appelé");
          cb(token);
        },
        volume: 0.5,
      });

      // Ready
      player.addListener("ready", ({ device_id }) => {
        console.log("🚀 Player prêt avec Device ID:", device_id);
        setStatus("Ready!");
        setIsReady(true);
        setPlayer(player);
        // Définir ce player comme device actif
        fetch("https://api.spotify.com/v1/me/player", {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            device_ids: [device_id],
            play: false,
          }),
        });
      });

      // Not Ready
      player.addListener("not_ready", ({ device_id }) => {
        console.log("⚠️ Device ID hors ligne:", device_id);
        setStatus("Device went offline");
        setIsReady(false);
      });

      player.addListener("initialization_error", ({ message }) => {
        console.error("❌ Erreur initialisation:", message);
        setStatus(`Init error: ${message}`);
      });

      player.addListener("authentication_error", ({ message }) => {
        console.error("❌ Erreur auth:", message);
        setStatus(`Auth error: ${message}`);
      });

      player.addListener("account_error", ({ message }) => {
        console.error("❌ Erreur compte:", message);
        setStatus(`Account error: ${message}`);
      });

      // État du lecteur
      player.addListener("player_state_changed", (state) => {
        if (state) {
          setCurrentTrack(state.track_window.current_track);
          setIsPlaying(!state.paused);
        }
      });

      console.log("🔌 Tentative de connexion au player...");
      player.connect().then((success) => {
        if (success) {
          console.log("✅ Connexion réussie au player");
        } else {
          console.log("❌ Échec de la connexion au player");
          setStatus("Failed to connect");
        }
      });
    };
  }, []);

  const handleTogglePlay = () => {
    if (player) {
      console.log("⏯️ Toggle play appelé");
      player.togglePlay();
    }
  };
  // fonction pas sur pour le moment.
  //   const playTrack = async (uri: string) => {
  //     if (!player || !isReady) return;

  //     const accessToken = localStorage.getItem("spotify_access_token");
  //     if (!accessToken) return;

  //     try {
  //       await fetch("https://api.spotify.com/v1/me/player/play", {
  //         method: "PUT",
  //         headers: {
  //           Authorization: `Bearer ${accessToken}`,
  //           "Content-Type": "application/json",
  //         },
  //         body: JSON.stringify({
  //           uris: [uri],
  //         }),
  //       });
  //     } catch (error: unknown) {
  //       if (error instanceof Error) {
  //         console.error("Error playing track:", error.message);
  //       } else {
  //         console.error("Unknown error playing track");
  //       }
  //     }
  //   };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4">
      <Script
        src="https://sdk.scdn.co/spotify-player.js"
        strategy="afterInteractive"
      />
      <div className="flex items-center justify-between max-w-screen-xl mx-auto">
        <div className="flex items-center gap-4">
          {currentTrack && (
            <>
              <img
                src={currentTrack.album.images[0]?.url}
                alt={currentTrack.album.name}
                className="w-12 h-12 rounded"
              />
              <div>
                <p className="font-medium">{currentTrack.name}</p>
                <p className="text-sm text-gray-600">
                  {currentTrack.artists[0].name}
                </p>
              </div>
            </>
          )}
        </div>
        <div>
          <button
            onClick={handleTogglePlay}
            disabled={!isReady}
            className="px-4 py-2 bg-green-500 text-white rounded-full disabled:opacity-50"
          >
            {isPlaying ? "Pause" : "Play"}
          </button>
        </div>
        {!isReady && <p className="text-sm text-gray-500">{status}</p>}
      </div>
    </div>
  );
};

export default SpotifyPlayer;
