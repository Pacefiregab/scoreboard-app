/**
 * Nouveautés visibles par les joueurs, de la plus récente à la plus ancienne.
 *
 * `date` sert aussi d'identifiant : la popup se déclenche quand la date de la
 * première entrée dépasse celle que le navigateur a déjà vue. À compléter en
 * même temps que la fonctionnalité, en restant du point de vue de l'usage
 * plutôt que du code.
 */
export interface ChangelogEntry {
  /** Format ISO (AAAA-MM-JJ). */
  date: string
  items: string[]
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    date: '2026-09-17',
    items: [
      'La vue Récap couvre désormais la semaine, une saison, ou toutes les saisons d’un coup — au choix, via le sélecteur de période.',
      'Correction : le récap d’une saison annonçait « joueur de la semaine », et le champion était affiché en victoires alors que le classement se fait sur une autre base.',
    ],
  },
  {
    date: '2026-09-16',
    items: [
      'Chacun peut désormais classer les joueurs selon la méthode de son choix, depuis les statistiques. Celle de l’hôte reste la méthode par défaut.',
      'Le classement s’ouvre sur un podium des trois premiers.',
    ],
  },
  {
    date: '2026-09-15',
    items: [
      'Les saisons arrivent : des périodes de trois mois calées sur le calendrier, avec un classement propre à chacune.',
      'Un sélecteur de saison en haut des statistiques filtre le classement, le détail et l’historique.',
      'Un palmarès liste le champion et le podium de chaque saison.',
      'L’accueil affiche la saison en cours et le temps qu’il reste avant la suivante.',
    ],
  },
  {
    date: '2026-09-14',
    items: [
      'L’historique des parties terminées est enfin consultable : chaque partie mène à son résumé complet.',
      'Un lien « Dernière partie » sur l’accueil pour retrouver le résumé de la partie qui vient de se finir.',
      'Les statistiques se parcourent par vues — classement, stats détaillées, récap de la semaine, historique — via le menu en haut à droite.',
      'Le nombre de lignes par page se règle : 10, 25, 50 ou tout afficher.',
    ],
  },
  {
    date: '2026-09-07',
    items: [
      'La recherche de joueurs ignore les accents : « Jerem » retrouve « Jérémie ».',
      'Un journal des nouveautés, accessible en bas de page.',
    ],
  },
  {
    date: '2026-08-27',
    items: [
      'Le nombre de paquets est demandé à la création et modifiable en cours de partie ; le maximum de cartes distribuables est affiché en permanence.',
      'Le sens de jeu se change dans les deux directions, même pendant les paris — montée, descente, puis remontée si vous voulez.',
      'Dans le graphe, un clic sur un nom isole sa courbe, et l’infobulle classe les joueurs par score.',
    ],
  },
  {
    date: '2026-08-04',
    items: [
      'Deux règles optionnelles à la création : le bonus ×2, qu’un joueur peut armer une fois par partie, et les pénalités que l’hôte retire au montant de son choix.',
      'Le total des plis annoncés s’affiche dès que les paris sont validés.',
      'Ordre, ajout, activation et joueur contraint sont réunis dans un seul écran « Gérer les joueurs ».',
      'À égalité de points, les joueurs partagent le même rang ; leur taux de contrats départage l’ordre d’affichage.',
    ],
  },
  {
    date: '2026-07-15',
    items: [
      'Un récapitulatif de la semaine en tête des statistiques : joueur de la semaine, podium et records.',
      'La méthode de classement général se choisit depuis la page admin (points F1, score composite ou victoires).',
    ],
  },
  {
    date: '2026-07-01',
    items: [
      'Fusion et suppression de joueurs depuis la page admin, pour corriger les doublons.',
      'Correction : le nombre de victoires affiché dans les statistiques était faux.',
    ],
  },
  {
    date: '2026-06-30',
    items: [
      'Thèmes clair, sombre et rose, avec un sélecteur présent sur toutes les pages.',
      'Page de statistiques : classement général et statistiques détaillées par joueur.',
      'Confettis et animation de victoire en fin de partie.',
      'Les noms déjà utilisés sont proposés à la saisie.',
    ],
  },
  {
    date: '2026-06-27',
    items: [
      'Vue spectateur en lecture seule, partageable par lien ou QR code, mise à jour en direct.',
      'Page admin protégée par mot de passe, avec tri et pagination des parties.',
      'Boutons + et − pour saisir paris et plis au doigt.',
    ],
  },
  {
    date: '2026-06-26',
    items: [
      'Première version : création de partie, saisie des paris et des plis, calcul automatique des scores et graphe de progression.',
    ],
  },
]

/** Entrée la plus récente — sert de repère à la popup. */
export const LATEST_CHANGELOG_DATE = CHANGELOG[0]?.date ?? ''
