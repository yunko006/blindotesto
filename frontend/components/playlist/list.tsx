import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useSpotifyAuth } from "@/hooks/useSpotifyAuth";

interface PlaylistItem {
  id: string;
  name: string;
  description: string;
  images: { url: string }[];
  tracks: { total: number };
}

interface PlaylistResponse {
  items: PlaylistItem[];
  total: number;
}

const SpotifyPlaylists = () => {
  const { isAuthenticated } = useSpotifyAuth();

  const {
    data: playlists,
    isLoading,
    error,
  } = useQuery<PlaylistResponse>({
    queryKey: ["playlists"],
    queryFn: async () => {
      const accessToken = localStorage.getItem("spotify_access_token");

      const response = await fetch("http://localhost:8000/spotify/playlists", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la récupération des playlists");
      }

      return response.json();
    },
    enabled: isAuthenticated, // La requête ne se fait que si l'utilisateur est authentifié
  });

  if (!isAuthenticated) {
    return <div>Veuillez vous connecter pour voir vos playlists</div>;
  }

  if (isLoading) {
    return <div>Chargement des playlists...</div>;
  }

  if (error) {
    return <div>Erreur: {error.message}</div>;
  }

  return (
    <pre className="p-4 bg-gray-100 rounded-lg overflow-auto max-h-[80vh]">
      {JSON.stringify(playlists, null, 2)}
    </pre>
  );
};

export default SpotifyPlaylists;
