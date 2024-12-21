// frontend/app/page.tsx
"use client";
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
      <p>test docker hot reload windows</p>
    </main>
  );
}
