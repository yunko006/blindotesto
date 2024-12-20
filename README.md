# blindotesto

use your spotify playlist as a blindtest!

# Stack de l'app

- backend : python avec fastapi
- frontend : nextjs

# Idée de base :

Use spotify api to create an app to use your playlist as a blindtest

# Idées des fonctionnalités de l'app :

- prends une playlist spotify

- raccourcis les chansons de la playlist en extraits de 15 à 30 sec

  - pendant le refrain = difficulté 1
  - avant le refrain + début du refrain = difficulté 2
  - moment aléatoire de la chanson = difficulté 3

- systeme de points et de leaderboard pour le blindtest en cours

# Diagramme :

```mermaid
sequenceDiagram
participant U as Utilisateur
participant F as Frontend
participant B as Backend
participant S as Spotify API

    U->>F: Visite l'app
    F->>S: Demande d'authentification Spotify
    S-->>U: Fenêtre de login Spotify
    U->>S: Se connecte
    S-->>F: Retourne access token
    F->>B: Stocke session utilisateur

    U->>F: Demande ses playlists
    F->>B: Requête playlists
    B->>S: Récupère playlists
    S-->>B: Liste des playlists
    B-->>F: Playlists affichées

    U->>F: Sélectionne playlist pour blindtest
    F->>B: Démarre nouveau blindtest
    B->>S: Récupère détails des tracks
    S-->>B: Infos des tracks
    B-->>F: Config du blindtest

    Note over F,B: Début du jeu

    F->>S: Joue morceau via Web Playback SDK
    U->>F: Propose une réponse
    F->>B: Vérifie réponse
    B-->>F: Résultat
    F-->>U: Affiche score/résultat
```

# API

spotify api

## comment consume l'API avec python ?

utilisation de requests
