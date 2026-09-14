---
name: db-change
description: Modifier le schéma Prisma de ce projet — écrire la migration, régénérer le client, réparer les fixtures de test, et savoir revenir en arrière sur une migration non déployée. À utiliser dès qu'une fonctionnalité touche à prisma/schema.prisma.
---

# Changer le schéma

## Séquence

1. **Modifier `prisma/schema.prisma`**, avec un commentaire `///` sur les champs
   dont le sens n'est pas évident (unité, signe, valeur par défaut).

2. **Écrire la migration à la main** dans
   `prisma/migrations/<AAAAMMJJHHMMSS>_<nom>/migration.sql`. Ne pas utiliser
   `prisma migrate dev`, qui peut proposer de réinitialiser la base.
   Toute colonne ajoutée à une table existante a besoin d'un défaut, sinon les
   lignes déjà présentes bloquent la migration.

3. **Régénérer et appliquer** :

   ```powershell
   npx prisma generate
   npx prisma migrate deploy
   npx prisma migrate status   # doit dire « Database schema is up to date! »
   ```

4. **Redémarrer le serveur de dev.** Il garde l'ancien client Prisma en mémoire
   et échoue sinon avec `PrismaClientValidationError` sur un champ inconnu.
   C'est à demander à l'utilisateur, pas à faire en tuant son processus.

5. **Réparer les fixtures de test.** Tout ajout à `GameState`, `GameRules`,
   `PlayerState` ou `BetState` casse les objets construits dans
   `src/lib/ranking.test.ts` et `src/lib/constrained-player.test.ts`. Le
   typecheck les signale ; les mettre à jour fait partie du changement.

## Exposer le champ

Un champ ajouté n'est visible nulle part tant qu'il n'est pas :

- mappé dans `buildGameState` (`src/lib/game-service.ts`) ;
- ajouté au type correspondant dans `src/types/game.ts` ;
- validé dans la route API qui l'accepte, avec un refus explicite hors bornes.

Garder l'API tolérante à l'absence du champ : un client non rechargé continue
d'envoyer l'ancienne forme.

## Revenir sur une migration non déployée

Si la migration n'est jamais partie en production, la supprimer vaut mieux
qu'en écrire une de compensation. Il faut alors réaligner la base locale, sinon
Prisma détecte une dérive :

```sql
ALTER TABLE "Game" DROP COLUMN IF EXISTS "maColonne";
DELETE FROM "_prisma_migrations" WHERE migration_name = '<dossier supprimé>';
```

Puis vérifier que le nombre de migrations sur disque égale celui enregistré, et
que `prisma migrate status` est propre.

## Déploiement

Watchtower ne rafraîchit que l'image : il **ne joue pas les migrations**. Une
migration impose un **Update the stack** dans Portainer. Le signaler dans le
message de commit et dans la réponse finale.
