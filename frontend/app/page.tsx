"use client";
import SpotifyLoginButton from "@/components/oauth/login";
import SpotifyPlayer from "@/components/spotify/player";
import SpotifyPlaylists from "@/components/spotify/playlist";
import Image from "next/image";
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
      <Image src={`/blindotesto.png`} alt={"logo"} width="1200" height="1200" />
      <SpotifyPlayer />
      <h1>Message from backend: {message}</h1>
      <SpotifyLoginButton></SpotifyLoginButton>
      <SpotifyPlaylists />
    </main>
  );
}
