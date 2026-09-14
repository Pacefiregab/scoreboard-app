---
name: verify-feature
description: Vérifier une fonctionnalité de bout en bout sur ce projet — choisir le bon serveur sans corrompre le cache, exercer l'API en PowerShell, inspecter le rendu, puis nettoyer les parties de test. À utiliser avant tout commit qui touche au code applicatif.
---

# Vérifier une fonctionnalité

Typecheck et tests unitaires ne suffisent pas : la plupart des régressions de ce
projet sont apparues à l'exécution (routes 404, client Prisma périmé, JSON mal
échappé). Exercer réellement le parcours.

## 1. Choisir le serveur — étape critique

**Ne jamais lancer `npm run build` pendant que le serveur de dev tourne.** Les
deux écrivent dans `.next`, et le build corrompt le manifeste de routes du dev.
Symptôme observé : toutes les sous-routes de `/api/games/[token]/` renvoient un
404 Next.js alors que les fichiers existent, et
`.next/dev/server/app-paths-manifest.json` ne liste plus qu'une poignée de
routes. La réparation impose d'arrêter le dev, supprimer `.next`, relancer.

Vérifier d'abord :

```powershell
Get-CimInstance Win32_Process -Filter "Name='node.exe'" |
  Where-Object { $_.CommandLine -match 'next.*dev|start-server' }
```

- **Un serveur de dev tourne** → vérifier sur `http://localhost:3000`, sans builder.
- **Aucun serveur** → build puis serveur autonome sur un autre port :

```powershell
npm run build
$env:PORT="3001"
Start-Process -FilePath "node" -ArgumentList ".next/standalone/server.js" -WindowStyle Hidden
Start-Sleep -Seconds 6
```

Arrêter ce serveur à la fin :

```powershell
Get-CimInstance Win32_Process -Filter "Name='node.exe'" |
  Where-Object { $_.CommandLine -like '*standalone/server.js*' } |
  ForEach-Object { Stop-Process -Id $_.ProcessId -Force }
```

## 2. Exercer l'API

`Invoke-RestMethod` lie mal ses arguments ici ; utiliser `curl.exe`. **Les
guillemets doivent être échappés `\`"`** — la forme `` `" `` produit un JSON
invalide et un 500 trompeur.

```powershell
$B = "http://localhost:3000"
$g = curl.exe -s -X POST "$B/api/games" -H "Content-Type: application/json" `
  -d '{\"players\":[\"A\",\"B\"],\"rules\":{\"deckCount\":1}}' | ConvertFrom-Json
$T = $g.adminToken
curl.exe -s -o NUL -w "%{http_code}" -X POST "$B/api/games/$T/rounds"
```

Couvrir le cas nominal **et** les refus : valeur hors bornes, champ manquant,
identifiant inconnu, règle désactivée. Vérifier après un refus que l'état n'a
pas bougé.

## 3. Inspecter le rendu

Aucun navigateur n'est disponible. Selon le cas :

- **Page rendue côté serveur** (`/stats`, `/game/<t>/summary`) : `curl.exe` puis
  retirer les balises pour lire le texte.
- **Composant client** (`Scoreboard`, dialogues) : le HTML ne contient rien.
  Chercher une chaîne distinctive dans les chunks servis pour prouver que le
  code part bien au navigateur :

```powershell
Select-String -Path ".next\dev\static\chunks\*.js" -Pattern "une chaine du composant" -List
```

Toujours **dire ce qui n'a pas pu être vu à l'écran**. Ne jamais présenter une
vérification de bundle comme une vérification visuelle.

## 4. Base de données

Les guillemets SQL sont mangés en passant par PowerShell. Passer par un fichier :

```powershell
$f = "$env:TEMP\q.sql"
@'
select count(*) from "Game";
'@ | Set-Content -Path $f -Encoding utf8
docker cp $f scoreboard_app-db-1:/tmp/q.sql | Out-Null
docker exec scoreboard_app-db-1 psql -U scoreboard -d scoreboard -f /tmp/q.sql
```

Si le conteneur a disparu : `docker compose -f docker-compose.dev.yml up -d`.
Le volume `scoreboard_app_postgres_dev_data` conserve les données.

## 5. Nettoyer

Supprimer **uniquement** les parties créées pour le test, en listant d'abord
pour supprimer par identifiant. La base contient les parties réelles de
l'utilisateur, souvent avec des noms de test (`gab`, `aaa`, `bbb`) : ne jamais
supprimer sur un motif de nom seul. Annoncer le compte restant.
