# Scoreboard App — Roadmap

## Vue d'ensemble

PWA web de suivi de scores pour parties de cartes. Un hôte crée et gère la partie via un lien admin, les autres joueurs peuvent suivre le score en lecture seule via un lien spectateur. Les parties terminées sont sauvegardées sur un serveur.

---

## Phase 1 — MVP L'Enculette ✅ Complétée

### 1.1 Création de partie ✅

- [x] Saisie des noms de joueurs avec réorganisation (flèches haut/bas)
- [x] Génération d'un token admin (secret) et d'un token spectateur (public)
- [x] Redirection vers la vue admin après création

### 1.2 Vue admin — Scoreboard ✅

- [x] Classement en temps réel (tri par score, badge leader)
- [x] Graphe de progression des scores (Recharts, mis à jour par polling)
- [x] Historique manche par manche : tableau joueurs × manches (pari, plis, évolution du score)
- [x] Header sticky avec retour accueil et menu burger (admin uniquement)
- [x] Bouton "Commencer la partie" / "Manche suivante" + "Terminer la partie"
- [x] Menu contextuel (sheet bas d'écran) avec toutes les options admin
- [x] Layout responsive : 1 colonne mobile, 2 colonnes desktop

### 1.3 Jeu : L'Enculette ✅

- [x] Structure pyramidale (1→N→1), l'hôte déclenche la descente
- [x] Nombre de cartes non plafonné
- [x] Saisie des paris avec contrainte du dernier joueur (valeur interdite en temps réel)
- [x] Rotation de la contrainte : M1→dernier joueur, M2→1er, M3→2e…
- [x] Calcul automatique : `10 + 10×plis` si contrat rempli, `-10×|écart|` sinon
- [x] Saisie des plis avec validation de la somme (somme = nb de cartes)
- [x] Steppers +/− pour la saisie mobile (touch targets 48×48px)
- [x] Ajout de joueurs en cours de partie (score de départ + position)
- [x] Désactivation/réactivation d'un joueur en cours de partie (exclus des manches suivantes, score conservé)
- [x] Réorganisation de l'ordre des joueurs en cours de partie
- [x] Preview du joueur contraint lors de l'ajout ou du réordonnancement
- [x] Modification du nombre de cartes pendant la phase de paris
- [x] Détection automatique de fin de partie (retour à 0 carte en descente)

### 1.4 Fin de partie & sauvegarde ✅

- [x] Page résumé : classement final + historique + graphe
- [x] Confettis de victoire animés (canvas-confetti)
- [x] Bouton "Terminer la partie" (dès qu'il y a des scores, hors phase PLAYING)
- [x] Annulation de partie (suppression complète, confirmation renforcée si scores)

---

## Phase 2 — Partage & temps réel ✅ Complétée

### 2.1 Vue spectateur ✅

- [x] Route `/view/[viewToken]` (lecture seule, sans contrôles admin)
- [x] Indicateur "En direct" dans le header
- [x] Mise à jour automatique toutes les 4 secondes (polling)
- [x] Polling stoppé automatiquement quand la partie est terminée

### 2.2 Partage ✅

- [x] Bouton "Partager" dans le menu admin
- [x] Affichage du lien spectateur avec bouton copier
- [x] QR code scannable généré à la volée (`qrcode.react`)

### 2.3 Découverte ✅

- [x] Liste des parties en cours sur la page d'accueil (joueurs, manche)
- [x] Lien direct vers la vue spectateur depuis la page d'accueil

---

## Phase 2.5 — Administration ✅ Complétée

### Page admin `/admin` ✅

- [x] Tableau de toutes les parties (actives et terminées)
- [x] Colonnes : joueurs, statut, manches, créée le, dernière activité
- [x] Tri par colonne (clic sur l'en-tête, toggle asc/desc)
- [x] Pagination (20 parties par page)
- [x] Suppression avec confirmation
- [x] Liens rapides vers vue admin et vue spectateur
- [x] Protection par mot de passe Basic Auth (`ADMIN_PASSWORD` env var, ouvert si non définie)

### Page stats `/stats` ✅

- [x] Classement général par joueur (victoires, taux de victoire, score moyen, record)
- [x] Stats détaillées : manches jouées, contrats réussis, taux de contrat
- [x] Médailles 🥇🥈🥉 sur le podium
- [x] Tri par colonne (desktop table + chips mobile)
- [x] Pagination

---

## Phase 3 — Expérience & polish (en cours)

### 3.1 UX / UI

- [x] Design responsive mobile-first (1 col mobile, 2 cols desktop)
- [x] Mode sombre / clair / rose (ThemeToggle dans le header, 3 thèmes)
- [x] Confettis de victoire en fin de partie
- [x] Animations (trophée rebondissant, pop du nom du gagnant)
- [x] Favicon ninja wizard (bleu marine + or)

### 3.2 PWA

- [ ] Manifest + icônes pour installation sur mobile
- [ ] Service worker (cache offline pour la vue scoreboard)

### 3.3 Accessibilité

- [ ] Navigation clavier complète
- [ ] Labels ARIA sur tous les formulaires
- [ ] Contraste suffisant (WCAG AA)

---

## Phase 4 — Historique & stats avancées

### 4.1 Historique des parties

- [ ] Accès au résumé des parties terminées depuis la page d'accueil
- [ ] Recherche/filtre dans la liste des parties

### 4.2 Statistiques avancées (optionnel)

- [ ] Évolution du taux de contrat dans le temps
- [ ] Statistiques de rivalité entre joueurs
- [ ] Classement par période

---

## Phase 5 — Jeux supplémentaires

- [ ] Belote (contrat + chute + capot + belote-rebelote, coinche hors scope)
- [ ] Jeu simple (score libre additionnel/soustractif, score cible optionnel)
- [ ] Tarot français (4-5 joueurs, prises, bouts, chelem, poignée…)
- [ ] Moteur de jeu générique + système de règles personnalisables

---

## Décisions actées

| # | Question | Décision |
|---|----------|----------|
| Q1 | Enculette — structure des manches | Pyramidale (1→N→1), l'hôte déclenche la descente |
| Q2 | Enculette — nombre max de cartes | Pas de plafond |
| Q3 | Belote | Mis de côté — Phase 5 |
| Q4 | Rotation contrainte Enculette | L'indicateur tourne (pas les joueurs) : M1→dernier, M2→1er… |
| Q5 | Nombre de joueurs | Pas de minimum ni maximum |
| Q6 | Égalité | Ex-æquo accepté, pas de départage |
| Q7 | Ajout joueur en cours | L'admin choisit le score de départ et la position |
| Q8 | Menu admin | Sheet bas d'écran, déclenché depuis le header |
| Q9 | Fin de partie | Disponible dès qu'il y a des scores, bloqué pendant PLAYING |
| Q10 | Page admin | Basic Auth via `ADMIN_PASSWORD` env var ; ouverte si non définie |
| Q11 | Thèmes | 3 thèmes : clair, sombre, rose — toggle dans le header |
| Q12 | Désactivation joueur | Exclut des manches suivantes, score conservé, réactivable |
| Q13 | Stats | Basées sur le nom du joueur, agrégées sur toutes les parties terminées |
