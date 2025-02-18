// hooks/useSpotifyAuth.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

interface SpotifyTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

interface SpotifyError {
  error: string;
  error_description?: string;
}

export const useSpotifyAuth = () => {
  const queryClient = useQueryClient();

  const handleLogout = () => {
    localStorage.removeItem("spotify_access_token");
    localStorage.removeItem("spotify_refresh_token");
    localStorage.removeItem("spotify_token_expiry");
    queryClient.invalidateQueries({ queryKey: ["spotifyAuth"] });
  };

  // Mutation pour rafraîchir le token
  const refreshTokenMutation = useMutation({
    mutationKey: ["refreshToken"],
    mutationFn: async (): Promise<SpotifyTokens> => {
      const refresh_token = localStorage.getItem("spotify_refresh_token");
      if (!refresh_token) throw new Error("NO_REFRESH_TOKEN");

      const response = await fetch(
        "http://localhost:8000/spotify/refresh-token",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ refresh_token }),
        }
      );

      if (!response.ok) {
        // Si on a une erreur 422 ou 400, on déconnecte l'utilisateur
        if (response.status === 422 || response.status === 400) {
          handleLogout();
          throw new Error("INVALID_REFRESH_TOKEN");
        }
        const errorData: SpotifyError = await response.json();
        throw new Error(errorData.error_description || "REFRESH_FAILED");
      }

      return response.json();
    },
    retry: 1, // Limite le nombre de tentatives en cas d'échec
    onSuccess: (data) => {
      localStorage.setItem("spotify_access_token", data.access_token);
      if (data.refresh_token) {
        localStorage.setItem("spotify_refresh_token", data.refresh_token);
      }
      localStorage.setItem(
        "spotify_token_expiry",
        String(Date.now() + data.expires_in * 1000)
      );
    },
    onError: (error: Error) => {
      if (
        error.message === "INVALID_REFRESH_TOKEN" ||
        error.message === "NO_REFRESH_TOKEN"
      ) {
        handleLogout();
      }
    },
  });

  // Query pour vérifier l'état du token
  const { data: authStatus } = useQuery({
    queryKey: ["spotifyAuth"],
    queryFn: async () => {
      const accessToken = localStorage.getItem("spotify_access_token");
      const tokenExpiry = localStorage.getItem("spotify_token_expiry");
      const refreshToken = localStorage.getItem("spotify_refresh_token");

      if (!accessToken || !tokenExpiry || !refreshToken) {
        return { isAuthenticated: false, needsRefresh: false };
      }

      const timeUntilExpiry = Number(tokenExpiry) - Date.now();

      // Token expiré
      if (timeUntilExpiry <= 0) {
        return { isAuthenticated: true, needsRefresh: true };
      }

      // Token proche de l'expiration (5 minutes)
      if (timeUntilExpiry < 5 * 60 * 1000) {
        return { isAuthenticated: true, needsRefresh: true };
      }

      return { isAuthenticated: true, needsRefresh: false };
    },
    // Arrête les vérifications si l'utilisateur n'est pas authentifié
    refetchInterval: () => {
      return 30 * 1000;
    },
  });

  // Effet pour gérer le rafraîchissement automatique
  useEffect(() => {
    if (authStatus?.isAuthenticated && authStatus.needsRefresh) {
      refreshTokenMutation.mutate();
    }
  }, [authStatus, refreshTokenMutation]);

  return {
    isAuthenticated: authStatus?.isAuthenticated ?? false,
    isLoading: refreshTokenMutation.isPending,
    logout: handleLogout,
    refreshToken: () => refreshTokenMutation.mutate(),
  };
};
