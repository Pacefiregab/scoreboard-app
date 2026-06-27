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
- [x] Affichage du classement (tri par score, badge leader)
- [x] Historique des manches : tableau joueurs × manches avec pari, plis et évolution du score
- [x] Header sticky avec retour accueil et menu burger (admin)
- [x] Bouton "Manche suivante"
- [x] Menu contextuel (sheet bas d'écran) avec toutes les options admin
- [x] Layout responsive : 1 colonne mobile, 2 colonnes desktop

### 1.3 Jeu : L'Enculette ✅
- [x] Structure pyramidale (1→N→1), l'hôte déclenche la descente via "Commencer la descente"
- [x] Nombre de cartes non plafonné
- [x] Saisie des paris avec contrainte du dernier joueur (valeur interdite calculée en temps réel)
- [x] Rotation de la contrainte à chaque manche : M1→dernier, M2→1er, M3→2e…
- [x] Calcul automatique : `10 + 10×plis` si contrat rempli, `-10×|écart|` sinon
- [x] Saisie des plis avec validation de la somme (somme = nb de cartes)
- [x] Ajout de joueurs en cours de partie avec choix du score de départ et de la position
- [x] Réorganisation de l'ordre des joueurs en cours de partie
- [x] Preview du joueur contraint lors de l'ajout ou du réordonnancement
- [x] Modification du nombre de cartes pendant la phase de paris
- [x] Détection automatique de fin de partie (retour à 0 carte en descente)

### 1.4 Fin de partie & sauvegarde ✅
- [x] Page résumé : classement final + historique manche par manche
- [x] Bouton "Terminer la partie" (disponible dès qu'il y a des scores, hors phase PLAYING)
- [x] Annulation de partie (suppression complète, avec confirmation renforcée si scores existants)

---

## Phase 2 — Partage & temps réel ✅ Complétée

### 2.1 Vue spectateur (lecture seule) ✅
- [x] Route `/view/[viewToken]` accessible sans mot de passe
- [x] Affichage identique au scoreboard admin mais sans contrôles
- [x] Mise à jour automatique via polling toutes les 4 secondes
- [x] Indicateur "En direct" dans le header spectateur

### 2.2 Partage de la partie ✅
- [x] Bouton "Partager" dans le menu admin (sheet bas d'écran)
- [x] Affichage du lien spectateur avec bouton copier
- [x] QR code scannable généré à la volée (`qrcode.react`)

### 2.3 Découverte des parties ✅
- [x] Liste des parties en cours sur la page d'accueil (joueurs, manche en cours)
- [x] Lien direct vers la vue spectateur depuis la page d'accueil

### 2.4 Saisie mobile ✅
- [x] Boutons +/− pour la saisie des paris et des plis (remplacement des `<input type="number">`)
- [x] Touch targets agrandis (48×48 px)

---

## Phase 2.5 — Administration ✅ Complétée

### 2.5.1 Page admin `/admin` ✅
- [x] Tableau de toutes les parties (actives et terminées)
- [x] Colonnes : joueurs, statut, manches, date de création, dernière activité
- [x] Tri par colonne (clic sur l'en-tête, toggle asc/desc)
- [x] Pagination (20 parties par page)
- [x] Suppression directe avec confirmation
- [x] Liens rapides vers vue admin et vue spectateur de chaque partie
- [x] Protection par mot de passe via Basic Auth (`ADMIN_PASSWORD` env var)

---

## Phase 3 — Expérience & polish

### 3.1 UX / UI
- [x] Design responsive mobile-first
- [ ] Mode sombre / clair (système déjà supporté par Tailwind)
- [ ] Animations de score (points gagnés/perdus visibles)
- [ ] Confettis ou animation de victoire en fin de partie

### 3.2 PWA
- [ ] Manifest + icônes pour installation sur mobile
- [ ] Service worker (cache offline pour la vue scoreboard)

### 3.3 Accessibilité
- [ ] Navigation clavier complète
- [ ] Labels ARIA sur tous les formulaires
- [ ] Contraste suffisant (WCAG AA)

---

## Phase 4 — Historique & stats

### 4.1 Historique des parties
- [ ] Liste des parties terminées accessibles via leur viewToken
- [ ] Accès à la page résumé d'une ancienne partie

### 4.2 Statistiques (optionnel)
- [ ] Statistiques par joueur (taux de réussite des contrats, etc.)
- [ ] Classement général entre amis

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
| Q9 | Fin de partie | Disponible dès qu'il y a des scores, bloqué pendant la phase PLAYING |
| Q10 | Page admin | Protégée par Basic Auth via `ADMIN_PASSWORD` env var ; ouverte si non définie |
