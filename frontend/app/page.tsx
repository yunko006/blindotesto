"use client";
import SpotifyLoginButton from "@/components/oauth/login";
import SpotifyPlayer from "@/components/spotify/player";
import SpotifyPlaylists from "@/components/spotify/playlist";
import Image from "next/image";

export default function Home() {
  return (
    <main className="p-4">
      <Image src={`/blindotesto.png`} alt={"logo"} width="1200" height="1200" />
      <SpotifyPlayer />
      <SpotifyLoginButton></SpotifyLoginButton>
      <SpotifyPlaylists />
    </main>
  );
}
