// app/callback/page.tsx
"use client";
import { useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";

interface SpotifyTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

export default function CallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

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
      localStorage.setItem("spotify_access_token", data.access_token);
      localStorage.setItem("spotify_refresh_token", data.refresh_token);
      localStorage.setItem(
        "spotify_token_expiry",
        String(Date.now() + data.expires_in * 1000)
      );
      router.push("/");
    },
    onError: (error) => {
      console.error("Erreur:", error);
      router.push("/");
    },
  });

  useEffect(() => {
    const code = searchParams.get("code");
    const error = searchParams.get("error");

    if (error) {
      console.error("Erreur Spotify:", error);
      router.push("/");
      return;
    }

    if (code) {
      callbackMutation.mutate(code);
    }
  }, [callbackMutation, router, searchParams]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-pulse">Authentification en cours...</div>
    </div>
  );
}
