# Utiliser une image plus légère
FROM python:3.13-slim

# Définir le répertoire de travail
WORKDIR /app

# Variables d'environnement
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Installer les dépendances système nécessaires
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copier requirements et installer les dépendances
COPY ./requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# Copier le reste du code
COPY ./app /app/app