import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSpotifyAuth } from "@/hooks/useSpotifyAuth";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

interface TrackItem {
  track: {
    id: string;
    name: string;
    artists: { name: string }[];
    album: {
      name: string;
      images: { url: string }[];
    };
  };
}

interface TracksResponse {
  items: TrackItem[];
  total: number;
}

const SpotifyPlaylists = () => {
  const { isAuthenticated } = useSpotifyAuth();
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string>("");

  const {
    data: playlists,
    isLoading: isLoadingPlaylists,
    error: playlistsError,
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
    enabled: isAuthenticated,
  });

  const {
    data: tracks,
    isLoading: isLoadingTracks,
    error: tracksError,
  } = useQuery<TracksResponse>({
    queryKey: ["playlist-tracks", selectedPlaylistId],
    queryFn: async () => {
      const accessToken = localStorage.getItem("spotify_access_token");
      const response = await fetch(
        `http://localhost:8000/spotify/playlists/${selectedPlaylistId}/tracks`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      if (!response.ok) {
        throw new Error("Erreur lors de la récupération des chansons");
      }
      return response.json();
    },
    enabled: isAuthenticated && !!selectedPlaylistId,
  });

  if (!isAuthenticated) {
    return <div>Veuillez vous connecter pour voir vos playlists</div>;
  }

  if (isLoadingPlaylists) {
    return <div>Chargement des playlists...</div>;
  }

  if (playlistsError) {
    return <div>Erreur: {playlistsError.message}</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Mes Playlists Spotify</CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            value={selectedPlaylistId}
            onValueChange={setSelectedPlaylistId}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Sélectionnez une playlist" />
            </SelectTrigger>
            <SelectContent>
              {playlists?.items.map((playlist) => (
                <SelectItem key={playlist.id} value={playlist.id}>
                  {playlist.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedPlaylistId && (
            <div className="mt-6">
              {isLoadingTracks ? (
                <div>Chargement des chansons...</div>
              ) : tracksError ? (
                <div>Erreur: {tracksError.message}</div>
              ) : (
                <pre className="p-4 bg-gray-100 rounded-lg overflow-auto max-h-[60vh]">
                  {JSON.stringify(tracks, null, 2)}
                </pre>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SpotifyPlaylists;
