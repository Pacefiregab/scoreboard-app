<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Scoreboard — L'Enculette

Application de suivi de scores pour un jeu de cartes à plis. Un hôte crée la
partie et saisit paris et plis ; les autres suivent en lecture seule via un lien
partageable.

**Stack** : Next.js 16 (App Router, Turbopack) · Prisma 7 + PostgreSQL ·
Tailwind v4 · shadcn/ui · Recharts · Vitest.

**Interface et messages d'erreur en français.** Le code, les commentaires et les
noms de variables en anglais.

```bash
npm run dev        # serveur de dev (port 3000)
npm run test:run   # vitest, une passe
npm run lint       # eslint
npx tsc --noEmit   # typecheck
```

## Travailler avec Gabin

**Ne pas s'engager seul dans une piste.** Quand une demande peut se comprendre
de plusieurs façons, ou qu'un choix de conception change ce qui sera construit,
proposer les options avant d'écrire le code — avec pour chacune ce qu'elle
implique, et une recommandation. Une demande formulée en une phrase cache
souvent deux lectures possibles.

Poser la question quand :

- deux demandes successives peuvent se combiner de plusieurs manières ;
- le choix engage le schéma de base, une migration, ou une suppression ;
- il faut arbitrer entre deux comportements également défendables.

Décider seul quand il s'agit de nommage, de mise en forme, d'organisation
interne du code, ou d'un détail qu'un changement d'avis rendrait trivial à
reprendre.

**Signaler les décisions prises en chemin.** Tout choix non dicté par la demande
se dit explicitement dans la réponse finale, avec son alternative. Exemple vécu :
le bonus ×2 double aussi les pertes — c'était une interprétation, pas une
évidence, et elle devait être soumise.

**Confirmer l'interprétation avant de coder quand deux demandes se superposent.**
Vécu : « les ex æquo doivent partager le même rang », puis « classer les ex æquo
par leur taux de réussite ». Ces deux phrases se combinent de deux façons — le
taux comme critère de rang, ou comme simple ordre d'affichage à l'intérieur du
groupe. La mauvaise lecture a été implémentée, testée, livrée, puis défaite.

**Ne pas toucher aux processus de Gabin.** Ne jamais tuer son serveur de dev ni
supprimer son cache sans son accord : lui donner la commande et le laisser
faire.

**Être exact sur ce qui a été vérifié.** Ne jamais présenter comme testé ce qui
n'a été que relu. Quand un diagnostic repose sur une supposition, le dire — un
500 attribué à tort à un client Prisma périmé était en réalité une base
injoignable, faute d'avoir lu le détail de l'erreur.

## Conventions d'interface

**Aucune couleur en dur.** Utiliser les tokens du thème (`primary`, `popover`,
`muted-foreground`, `destructive`, `border`…). Trois thèmes coexistent — clair,
sombre, rose — et une couleur figée casse dans au moins l'un des trois. Seule
exception : les séries du graphe, qui encodent l'identité des joueurs et ont
besoin de teintes distinctes.

Les variables du projet sont en **oklch**. Écrire `hsl(var(--border))` produit
une couleur invalide, silencieusement remplacée par un défaut.

**Infobulles via `@/components/ui/tooltip`**, jamais l'attribut `title` natif,
dont le rendu est celui du système. Pour une icône seule sans libellé, un
`aria-label` suffit.

**Les libellés permanents restent courts.** Le détail va dans l'infobulle, où il
sert au moment de décider, plutôt que d'occuper la place en continu.

**Pas de texte redondant** à côté d'un contrôle qui dit déjà la même chose. Un
encadré expliquant « le paquet est épuisé, passer en descente ? » posé au-dessus
d'un bouton « Commencer la descente (2 cartes) » a été retiré pour cette raison.

**Un réglage sans effet visible vaut moins que pas de réglage.** Si une option
n'a pas de conséquence que l'utilisateur puisse percevoir et relier au réglage,
soit la rendre lisible, soit la retirer.

**Préférer replier une information dans un élément existant** plutôt qu'en
ajouter un : le plafond de cartes tient dans le badge de manche
(`Manche 4 · 4/13 cartes`) au lieu d'occuper un quatrième badge.

## Conventions de code

- Les commentaires expliquent **pourquoi**, pas quoi. Ceux qui méritent d'être
  écrits documentent un piège, une contrainte du modèle, ou un choix non évident.
- La logique de jeu pure vit dans `src/lib/` et se teste unitairement
  (`enculette.ts`, `ranking.ts`, `constrained-player.ts`, `text.ts`). Toute règle
  calculatoire ajoutée là vient avec ses cas limites.
- Les opérations qui touchent plusieurs lignes passent par une transaction. Des
  `PATCH` concurrents recalculant chacun depuis son propre instantané se
  marchaient dessus — d'où `PUT /players` qui réassigne tout l'ordre d'un coup.
- Le lint a **6 problèmes préexistants** (2 erreurs dans `ThemeContext` et
  `useGame`, 4 variables inutilisées). Ne pas en ajouter. La règle
  `react-hooks/set-state-in-effect` interdit un `setState` synchrone dans un
  effet : pour lire `localStorage`, utiliser `useSyncExternalStore`.
- Tenir `ROADMAP.md` à jour, et `src/data/changelog.ts` quand la nouveauté est
  visible des joueurs.

## Procédures

Trois compétences couvrent les gestes répétitifs, avec les pièges rencontrés :

- **`verify-feature`** — vérifier de bout en bout sans corrompre le cache `.next`,
  exercer l'API en PowerShell, nettoyer les parties de test.
- **`db-change`** — modifier le schéma Prisma, écrire la migration, réparer les
  fixtures, revenir en arrière proprement.
- **`ship`** — commiter et pousser, et ce qu'il faut dire en livrant.

Les charger avant d'agir plutôt que de reconstituer la procédure.
