# blindotesto
 app to create blindtest playlist

# TODO list :

- [ ] ajouter fonction pour créer une api key
- [ ] tester la fonction
- [ ] ajouter Oauth2
- [ ] refractor code pour créer des blindtests
- [ ] voir que les playlists qu'un utilisateur a créer 

# Idée de base : 

Créer une api qui permet de créer et de faire des blindtests ! 

# Idées des fonctionnalités de l'app : 

- prends une playlist spotify 

- raccourcis les chansons de la playlist en extraits de 15 à 30 sec 
    - pendant le refrain = difficulté 1
    - avant le refrain + début du refrain = difficulté 2
    - moment aléatoire de la chanson = difficulté 3

- systeme de points et de leaderboard pour le blindtest en cours

# Endpoints de l'api : 

Endpoint | HTTP Method | CRUD Method | Result
------------ | ------------|------------ | ------------|
/playlist/:playlist_id | GET | READ | récupere les informations d'une playlist spotify
/blindtest | POST | CREATE | créer un nouveau blindtest (peut etre ajouté l'id de la playlist/nb de chansons a inclure/autres options voir fonc)
/blindtest/:blindtest_id | GET | READ | récupere les informations sur un blindtest(chansons/etat actuel du blindtest-chansons deja devinées/score actuel/joueur)
/blindtest/:blindtest_id/submit | POST | CREATE | permet aux participants de soumettre leurs réponses pour le blindtest en cours (id),les parametres pourraient inclure : song_id et la réponse du participant
/blindtest/:blindtest_id/leaderboard | GET | READ | obtenir classement du blindtest en cours
/blindtest/:blindtest_id | DELETE | DELETE | supprime un blindtest spécifique

# Autentification : 

## OAuth2 

todo 

## API key

- user se connecte > bouton pour recevoir une api key 
- utiliser sa key pour créer des blindtests 