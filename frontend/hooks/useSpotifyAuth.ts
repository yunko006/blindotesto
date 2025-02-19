import { useCallback, useEffect, useState, useRef } from "react";

interface SpotifyTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export const useSpotifyAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const clearRefreshTimeout = useCallback(() => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
      refreshTimeoutRef.current = null;
    }
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem("spotify_access_token");
    localStorage.removeItem("spotify_refresh_token");
    localStorage.removeItem("spotify_token_expiry");
    setIsAuthenticated(false);
    clearRefreshTimeout();
  }, [clearRefreshTimeout]);

  const scheduleNextRefresh = useCallback(
    (expiryTime: number) => {
      clearRefreshTimeout();

      const timeUntilExpiry = expiryTime - Date.now();
      // Rafraîchir 7 minutes avant l'expiration
      const timeUntilRefresh = timeUntilExpiry - 7 * 60 * 1000;

      console.log(
        `🕒 Prochain rafraîchissement dans ${Math.floor(
          timeUntilRefresh / 60000
        )} minutes`
      );

      return timeUntilRefresh;
    },
    [clearRefreshTimeout]
  );

  const refreshAccessToken = useCallback(async () => {
    const refresh_token = localStorage.getItem("spotify_refresh_token");
    if (!refresh_token) {
      console.log("❌ Pas de refresh token trouvé");
      handleLogout();
      return;
    }

    try {
      console.log("🔄 Début du rafraîchissement du token...");
      setIsLoading(true);

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
        throw new Error("Failed to refresh token");
      }

      const data: SpotifyTokens = await response.json();

      localStorage.setItem("spotify_access_token", data.access_token);
      if (data.refresh_token) {
        localStorage.setItem("spotify_refresh_token", data.refresh_token);
      }

      const expiryTime = Date.now() + data.expires_in * 1000;
      localStorage.setItem("spotify_token_expiry", String(expiryTime));

      const expiryDate = new Date(expiryTime);
      console.log(
        `✅ Token rafraîchi avec succès! Expire le: ${expiryDate.toLocaleString()}`
      );
      console.log(
        `⏳ Durée de validité: ${Math.floor(data.expires_in / 60)} minutes`
      );

      setIsAuthenticated(true);

      // Calculer et programmer le prochain rafraîchissement
      const timeUntilRefresh = scheduleNextRefresh(expiryTime);
      if (timeUntilRefresh > 0) {
        refreshTimeoutRef.current = setTimeout(
          refreshAccessToken,
          timeUntilRefresh
        );
      }
    } catch (error) {
      console.error("❌ Erreur lors du rafraîchissement:", error);
      handleLogout();
    } finally {
      setIsLoading(false);
    }
  }, [handleLogout, scheduleNextRefresh]);

  // Vérifier l'authentification au montage du composant
  useEffect(() => {
    const initAuth = () => {
      const accessToken = localStorage.getItem("spotify_access_token");
      const refreshToken = localStorage.getItem("spotify_refresh_token");
      const expiryTime = localStorage.getItem("spotify_token_expiry");

      if (!accessToken || !refreshToken || !expiryTime) {
        console.log("🔑 Tokens manquants, déconnexion nécessaire");
        handleLogout();
        return;
      }

      const timeUntilExpiry = Number(expiryTime) - Date.now();
      console.log(
        `🕒 Temps restant avant expiration: ${Math.floor(
          timeUntilExpiry / 60000
        )} minutes`
      );

      setIsAuthenticated(true);

      // Programmer le prochain rafraîchissement
      const timeUntilRefresh = scheduleNextRefresh(Number(expiryTime));
      if (timeUntilRefresh > 0) {
        refreshTimeoutRef.current = setTimeout(
          refreshAccessToken,
          timeUntilRefresh
        );
      } else {
        refreshAccessToken();
      }
    };

    initAuth();

    return clearRefreshTimeout;
  }, [
    clearRefreshTimeout,
    scheduleNextRefresh,
    refreshAccessToken,
    handleLogout,
  ]);

  return {
    isAuthenticated,
    isLoading,
    logout: handleLogout,
    refreshToken: refreshAccessToken,
    getAccessToken: useCallback(
      () => localStorage.getItem("spotify_access_token"),
      []
    ),
  };
};
