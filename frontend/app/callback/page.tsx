"use client";
import { useEffect, useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";

interface SpotifyTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

export default function CallbackPage() {
  const [isClient, setIsClient] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const hasProcessedCode = useRef(false); // Pour tracker si le code a déjà été traité
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    setIsClient(true);
  }, []);

  const callbackMutation = useMutation({
    mutationFn: async (code: string): Promise<SpotifyTokenResponse> => {
      if (isProcessing || hasProcessedCode.current) {
        console.log("Évitement d'un traitement multiple du code");
        return Promise.reject("Code déjà traité");
      }

      setIsProcessing(true);
      hasProcessedCode.current = true;

      try {
        const response = await fetch(
          `http://localhost:8000/auth/callback?code=${encodeURIComponent(code)}`
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Erreur de l'API:", errorText);
          throw new Error(errorText);
        }

        return response.json();
      } finally {
        setIsProcessing(false);
      }
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
    onError: (error: Error) => {
      console.error("Erreur d'authentification:", error);
      router.push(`/?auth_error=${encodeURIComponent(error.message)}`);
    },
  });

  useEffect(() => {
    if (!isClient) return;

    const code = searchParams.get("code");
    const error = searchParams.get("error");

    if (error) {
      router.push(`/?auth_error=${encodeURIComponent(error)}`);
      return;
    }

    if (code && !hasProcessedCode.current) {
      callbackMutation.mutate(code);
    }
  }, [callbackMutation, isClient, router, searchParams]); // Retiré isProcessing des dépendances

  return (
    <div className="flex items-center justify-center min-h-screen">
      {callbackMutation.isError ? (
        <div className="text-red-500 p-4 rounded-lg bg-red-50">
          <h3 className="font-bold mb-2">Erreur d&apos;authentification</h3>
          <p>{callbackMutation.error.message}</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
          <div>Authentification en cours...</div>
        </div>
      )}
    </div>
  );
}
