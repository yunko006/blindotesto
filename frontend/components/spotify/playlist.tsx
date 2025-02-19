import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSpotifyAuth } from "@/hooks/useSpotifyAuth";
import { Play } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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
    uri: string;
    artists: { name: string }[];
    album: {
      name: string;
      images: { url: string }[];
    };
  };
}

interface SpotifyDevice {
  id: string;
  is_active: boolean;
  is_private_session: boolean;
  is_restricted: boolean;
  name: string;
  type: string;
  volume_percent: number;
}

interface DevicesResponse {
  devices: SpotifyDevice[];
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

  const playTrack = async (uri: string) => {
    const accessToken = localStorage.getItem("spotify_access_token");
    if (!accessToken) return;

    try {
      // D'abord, récupérer le device actif
      const deviceResponse = await fetch(
        "https://api.spotify.com/v1/me/player/devices",
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      const devices: DevicesResponse = await deviceResponse.json();
      const webPlayer = devices.devices.find(
        (device: SpotifyDevice) =>
          device.name === "Web Playback SDK Quick Start Player"
      );

      if (!webPlayer) {
        console.error("Web player not found");
        return;
      }

      await fetch(
        "https://api.spotify.com/v1/me/player/play?device_id=" + webPlayer.id,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            uris: [uri],
          }),
        }
      );
    } catch (error: unknown) {
      console.error(
        "Error playing track:",
        error instanceof Error ? error.message : "Unknown error"
      );
    }
  };

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
                <div className="space-y-4">
                  {tracks?.items.map(({ track }) => (
                    <div
                      key={track.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100"
                    >
                      <div className="flex items-center space-x-4">
                        <img
                          src={track.album.images[0]?.url}
                          alt={track.album.name}
                          className="w-12 h-12 rounded-md"
                        />
                        <div>
                          <h3 className="font-medium">{track.name}</h3>
                          <p className="text-sm text-gray-600">
                            {track.artists
                              .map((artist) => artist.name)
                              .join(", ")}
                          </p>
                        </div>
                      </div>
                      <Button
                        onClick={() => playTrack(track.uri)}
                        variant="ghost"
                        size="icon"
                      >
                        <Play className="h-6 w-6" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SpotifyPlaylists;
