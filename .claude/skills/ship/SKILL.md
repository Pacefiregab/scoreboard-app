---
name: ship
description: Commiter et pousser sur ce projet — rédaction du message via fichier temporaire, convention de contenu, et ce qu'il faut dire à l'utilisateur au moment de livrer. À utiliser à chaque commit.
---

# Livrer

## Rédiger le message

Les here-strings PowerShell cassent sur les guillemets et les accents. **Passer
par un fichier**, jamais par `git commit -m` multiligne :

```powershell
# écrire .git/COMMIT_MSG_TMP avec l'outil Write, puis :
git add -A src prisma ROADMAP.md
git status --short          # relire ce qui part
git commit -F .git/COMMIT_MSG_TMP
Remove-Item .git/COMMIT_MSG_TMP
git push origin master
```

Le push affiche un avertissement « Bypassed rule violations for refs/heads/master » :
c'est attendu sur ce dépôt, ce n'est pas une erreur.

## Contenu du message

En français, **sans accents dans le corps** (ils sont mal encodés en passant par
Git sous Windows). Le sujet en une ligne, puis un corps qui explique :

- **le problème ou le besoin**, pas seulement le changement ;
- **les décisions de conception** et leur raison, surtout quand un autre choix
  était défendable ;
- **ce qui a été vérifié**, concrètement, avec les valeurs observées ;
- **ce qui n'a pas pu l'être**, et pourquoi.

Terminer par :

```
Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
```

Un commit par intention. Une correction trouvée en chemin qui n'a rien à voir
avec la demande mérite son propre commit.

## Ce qu'il faut dire en livrant

La réponse finale n'est pas un résumé du diff. Elle doit contenir :

- ce qui change **pour l'utilisateur de l'application**, en français courant ;
- les **choix à valider** — formulés comme tels, avec l'alternative ;
- les **résultats de vérification**, en tableau quand il y a plusieurs cas ;
- ce qui **n'a pas été vérifié**, sans l'enterrer ;
- les **actions requises de son côté** : redémarrage du serveur de dev après un
  changement de schéma, **Update the stack** dans Portainer s'il y a une
  migration.

Ne jamais annoncer comme vérifié ce qui n'a été que relu.
