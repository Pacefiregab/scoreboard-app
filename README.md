# Scoreboard App

Scoreboard web pour parties de cartes. L'hôte crée une partie et gère les scores via un lien admin ; les autres joueurs peuvent suivre en lecture seule via un lien spectateur (Phase 2).

**Jeu disponible :** L'Enculette (structure pyramidale, contrainte du dernier joueur, rotation automatique)

Stack : Next.js 15 · React 19 · TypeScript · Tailwind CSS · Shadcn/ui · Prisma 7 · PostgreSQL

---

## Fonctionnalités

- Création de partie avec liste de joueurs ordonnée
- Paris et résultats avec calcul automatique des scores
- Contrainte Enculette : rotation de l'indicateur à chaque manche (M1→dernier, M2→1er…)
- Structure pyramidale : montée libre, descente déclenchée par l'hôte
- Ajout et réordonnancement des joueurs en cours de partie (avec preview du joueur contraint)
- Historique manche par manche (tableau joueurs × manches)
- Page de résumé finale
- Layout responsive : mobile 1 colonne, desktop 2 colonnes
- Menu admin en header (sheet bas d'écran)
- Polling automatique toutes les 4 secondes

---

## Développement local

### Prérequis

- Node.js 20+
- Docker Desktop (ou Docker Engine)

### Installation

```bash
npm install
```

### Démarrer la base de données

```bash
docker compose -f docker-compose.dev.yml up -d
```

Démarre PostgreSQL sur `localhost:5432`.

### Variables d'environnement

Le fichier `.env` est déjà configuré pour le dev local :

```env
DATABASE_URL="postgresql://scoreboard:scoreboard@localhost:5432/scoreboard"
```

### Appliquer le schéma

```bash
npx prisma migrate dev --name init
```

### Lancer l'app

```bash
npm run dev
```

Disponible sur [http://localhost:3000](http://localhost:3000).

### Tests unitaires (logique de scoring)

```bash
npm run test:run
```

---

## Déploiement sur Portainer (Docker)

### Prérequis

- Portainer installé sur le serveur
- Docker Engine actif

### 1. Variables d'environnement

Copier `.env.example` en `.env` sur le serveur :

```bash
cp .env.example .env
```

```env
POSTGRES_USER=scoreboard
POSTGRES_PASSWORD=un_mot_de_passe_solide
POSTGRES_DB=scoreboard
APP_PORT=3000
# Protège /admin par Basic Auth (laisser vide = page ouverte)
ADMIN_PASSWORD=un_autre_mot_de_passe
```

> Ne jamais committer `.env` — il est dans `.gitignore`.

### 2. Créer un stack dans Portainer

1. Portainer → **Stacks** → **Add stack**
2. Nommer le stack (ex: `scoreboard`)
3. Uploader `docker-compose.yml` ou coller son contenu
4. Ajouter les variables d'environnement (`POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `APP_PORT`, `ADMIN_PASSWORD`)
5. **Deploy the stack**

### 3. Appliquer les migrations

Après le premier déploiement, depuis Portainer → **Containers** → conteneur `app` → **Exec console** :

```bash
npx prisma migrate deploy
```

### 4. Mettre à jour l'app

1. Rebuilder l'image via Portainer → **Stacks** → **Update the stack**
2. Si le schéma a changé : relancer `npx prisma migrate deploy` dans le conteneur

L'app est disponible sur `http://ton-serveur:APP_PORT`.

---

## Structure du projet

```
src/
  app/
    api/games/          # API REST (création, manches, paris, résultats…)
    game/[token]/       # Pages admin (scoreboard + résumé)
    new/                # Création de partie
  components/
    game/               # GameBoard, Scoreboard, BettingPhase, PlayingPhase…
    ui/                 # Composants Shadcn/ui
  context/
    GameContext.tsx     # État de partie partagé via React Context
  hooks/
    useGame.ts          # Polling de l'état de partie
  lib/
    enculette.ts        # Logique métier (scores, contraintes, structure pyramidale)
    game-service.ts     # Accès BDD + règles métier
    constrained-player.ts  # Calcul du joueur contraint
prisma/
  schema.prisma         # Modèles Game, Player, Round, Bet, RoundScore
  migrations/
docker-compose.yml      # Production (app + db)
docker-compose.dev.yml  # Dev (db uniquement)
Dockerfile
```
