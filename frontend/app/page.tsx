"use client";
import SpotifyLoginButton from "@/components/oauth/login";
import SpotifyPlaylists from "@/components/playlist/list";

import { useEffect, useState } from "react";

export default function Home() {
  const [message, setMessage] = useState("");

  useEffect(() => {
    // Test de connexion avec le backend
    fetch("http://localhost:8000/hello")
      .then((res) => res.json())
      .then((data) => setMessage(data.Message));
  }, []);

  return (
    <main className="p-4">
      <h1>Message from backend: {message}</h1>
      <SpotifyLoginButton></SpotifyLoginButton>
      <SpotifyPlaylists />
    </main>
  );
}
