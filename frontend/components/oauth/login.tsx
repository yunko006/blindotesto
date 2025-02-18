import React from "react";
import { Music } from "lucide-react";
import { useMutation } from "@tanstack/react-query";

// Types
interface SpotifyTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

const SpotifyLoginButton = () => {
  // Mutation pour le callback
  const callbackMutation = useMutation({
    mutationFn: async (code: string): Promise<SpotifyTokenResponse> => {
      const response = await fetch(
        `http://localhost:8000/spotify/callback?code=${code}`
      );
      if (!response.ok) {
        throw new Error("Erreur lors de la récupération du token");
      }
      return response.json();
    },
    onSuccess: (data) => {
      // Stockage des tokens
      localStorage.setItem("spotify_access_token", data.access_token);
      localStorage.setItem("spotify_refresh_token", data.refresh_token);
      localStorage.setItem(
        "spotify_token_expiry",
        String(Date.now() + data.expires_in * 1000)
      );

      // Redirection vers la page principale
      window.location.href = "/";
    },
    onError: (error) => {
      console.error("Erreur lors de l'authentification:", error);
    },
  });

  const handleLogin = () => {
    // Redirection vers l'endpoint FastAPI /login
    window.location.href = "http://localhost:8000/spotify/login";
  };

  return (
    <button
      onClick={handleLogin}
      className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      disabled={callbackMutation.isPending}
    >
      <Music size={20} />
      <span>
        {callbackMutation.isPending
          ? "Connexion en cours..."
          : "Se connecter avec Spotify"}
      </span>
    </button>
  );
};

export default SpotifyLoginButton;
