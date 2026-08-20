# Rosaire · Rosary

Un chapelet guidé, en français et en anglais, qui grandit avec la prière.
A guided rosary, in French and English, that grows with your prayer.

Application web installable (PWA) : on l'ajoute à l'écran d'accueil, elle s'ouvre
en plein écran comme une application native, et les rosaires se synchronisent
sur un compte.

---

## Ce que fait l'application

- **Compte par e-mail et mot de passe.** Session signée dans un cookie
  `httpOnly`, mot de passe haché avec `scrypt`.
- **Chapelet du jour.** Les mystères suivent le cycle liturgique : joyeux le
  lundi et le samedi, douloureux le mardi et le vendredi, glorieux le mercredi
  et le dimanche, lumineux le jeudi.
- **Trois façons de prier.** Le chapelet du jour (cinq dizaines), le rosaire
  complet (les vingt mystères) ou un rosaire libre où l'on écrit soi-même
  l'intention de chaque dizaine.
- **À voix haute ou en écrivant.** En mode écrit, chaque méditation dispose d'un
  espace pour être rédigée avant d'être dite.
- **Grain par grain.** On coche chaque Notre Père, Je vous salue Marie et Gloire
  au Père. Un rosaire peut être découpé dans la journée : la progression est
  reprise exactement où elle s'est arrêtée, sur n'importe quel appareil.
- **Un rosaire dessiné, pas une métaphore.** Le crucifix porte le corps du
  Christ ; viennent ensuite le grain du Notre Père, les trois grains des Je vous
  salue Marie, la médaille où l'on dit le Gloire au Père, puis la boucle de cinq
  fois un Notre Père et dix Je vous salue Marie. Cinquante-neuf grains, comme
  dans la main.
- **Un rosaire qui pousse.** Vingt et une propriétés du dessin — la taille des
  grains, celle de la pierre centrale et sa taille en facettes, l'intensité des
  couleurs, l'or sur la chaîne, les roses, le feuillage, le filigrane, les
  rayons, les auréoles, la patine, la gravure, la colombe, la couronne de douze
  étoiles, la rosace, les lys — sont chacune une fonction de ce qui a été prié.
  Voir « Le modèle » plus bas.
- **Vous voyez ce qui a changé.** À la fin de chaque rosaire, l'application dit
  en toutes lettres ce qui est différent dans le dessin, et combien de dizaines
  vous séparent de la prochaine transformation.
- **Vous pouvez regarder de près.** Touchez le rosaire : il s'ouvre en plein
  écran, on zoome jusqu'au grain, et un panneau détaille ce qui est déjà là et
  ce qui vient.
- **Un rosaire qui se personnalise.** Vous choisissez la forme de la boucle —
  ronde, ovale ou carrée — et vos trois couleurs (la lumière, les grains, la
  chaîne), ou vous laissez la palette venir des mystères que vous priez le plus.
  Huit âges nomment le chemin, de « Semence » à « Couronne ».
- **Statistiques.** Rosaires, dizaines, Je vous salue Marie, série en cours,
  plus longue série, jours de prière, 90 derniers jours, historique.
- **Hors ligne.** La progression est conservée localement et renvoyée au serveur
  dès le retour du réseau.

## Le dessin

Fond crème, encre chaude : le rosaire est montré comme on le voit, en plein
jour, posé sur du tissu. La palette entière — page, cartes, boutons, grains —
descend d'un seul jeu de variables CSS produit par `lib/rosary/growth.ts`, si
bien qu'un changement de couleur ou d'étape traverse toute l'application.

Les trois formes de boucle sont la même courbe : une superellipse dont on change
les rayons et l'exposant. Les grains sont placés par longueur d'arc, sinon
l'ovale les tasserait à ses extrémités.

## Le modèle

Tout ce qui se voit est une fonction de ce qui a été prié. La monnaie est la
dizaine ; la courbe est toujours la même :

```
valeur(D) = depart + (limite − depart) · D / (D + k)
```

Trois propriétés la rendent juste pour cet usage. Elle monte le plus vite au
début, donc les premières semaines sont vivantes. Elle n'arrive jamais, donc il
reste toujours quelque chose devant. Et elle s'inverse en une ligne, donc
l'application sait toujours dire combien de dizaines séparent de la prochaine
transformation visible.

`k` est la demi-vie : à `D = k`, la propriété est à mi-chemin de sa limite.
Donner à chacune son propre `k` est ce qui les décale — la couleur
s'approfondit dans le premier mois, la pierre grandit encore après mille
rosaires. Chaque propriété est découpée en crans perceptibles ; c'est le
franchissement d'un cran qui est annoncé.

À cela s'ajoute la **couronne de mémoire** : un trait fin gravé pour chaque
rosaire achevé, enroulé en anneaux concentriques. Elle change à chaque fois,
sans exception, et devient avec les années une bande dense qu'on découvre en
zoomant.

Le tout est dans `lib/rosary/traits.ts`, sans dépendance ni aléatoire, donc
entièrement testable : les tests vérifient que rien ne recule jamais, que la
courbe s'inverse exactement, qu'il se passe quelque chose à presque chaque
chapelet pendant les premiers mois, et qu'il reste de quoi voir après mille
rosaires.

## Textes : Symbole des Apôtres, Notre Père dans la traduction liturgique de
2017 (« et ne nous laisse pas entrer en tentation »), Je vous salue Marie,
Gloire au Père, prière de Fatima, Salve Regina.
Anglais : les formes traditionnelles du rite romain.
Le cycle des mystères suit l'usage confirmé par la lettre apostolique
*Rosarium Virginis Mariae* (2002), qui ajoute les mystères lumineux.

---

## Démarrer en local

```bash
npm install
cp .env.example .env.local     # puis renseignez SESSION_SECRET
npm run dev                    # http://localhost:3000
```

Sans `DATABASE_URL`, l'application crée un fichier SQLite dans `data/rosary.db`.
Rien d'autre à installer.

Générez un secret de session avec :

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Mettre en ligne

L'application est un projet Next.js standard : elle se déploie telle quelle sur
Vercel, Fly.io, Railway ou dans un conteneur.

1. Créez une base Postgres (Neon, Supabase, Railway…).
2. Renseignez deux variables d'environnement :

   | Variable         | Rôle                                                            |
   | ---------------- | --------------------------------------------------------------- |
   | `SESSION_SECRET` | Signature des cookies de session. 32 octets aléatoires. Requis.  |
   | `DATABASE_URL`   | `postgres://…`. Absent ⇒ SQLite local (développement seulement). |

3. `npm run db:init` crée les tables (facultatif : elles sont créées à la
   première requête).

> Sur un hébergement dont le disque est éphémère — Vercel notamment — SQLite
> serait effacé à chaque déploiement. Utilisez Postgres en production.

## Installer sur le téléphone

- **iPhone / iPad** : ouvrir le site dans Safari → Partager → « Sur l'écran
  d'accueil ».
- **Android** : Chrome propose « Installer l'application », ou depuis l'écran
  Réglages de l'application.

L'icône, le mode plein écran et l'écran de démarrage sont fournis par
`public/manifest.webmanifest`.

---

## Structure

```
app/                     Routes Next.js (App Router)
  page.tsx               Accueil public + création de compte / connexion
  home/                  Tableau de bord : l'œuvre, l'étape, le départ d'un rosaire
  pray/[id]/             Le déroulé guidé, grain par grain
  journey/               Statistiques, étapes et historique
  settings/              Langue, prénom, apparence, installation, compte
  api/                   Authentification, rosaires, statistiques
components/              Interface ; RosaryArt.tsx dessine le rosaire génératif,
                         Crucifix.tsx le crucifix qui le termine, et
                         RosaryViewer.tsx la vue rapprochée
lib/rosary/              Prières, mystères, séquence, traits de croissance,
                         formes, couleurs, statistiques
lib/db/                  Accès aux données (SQLite ou Postgres)
lib/auth/                Mots de passe et sessions
lib/i18n/                Dictionnaire français / anglais
scripts/                 Génération des icônes, initialisation de la base
tests/                   Tests unitaires (Vitest)
```

Le déroulé d'un rosaire n'est jamais stocké : il est reconstruit à l'identique
par `lib/rosary/sequence.ts` à partir du type, des mystères et de la langue. La
base ne garde que les étapes cochées, ce qui rend la reprise portable d'un
appareil à l'autre et empêche un client de gonfler ses statistiques — le serveur
recompte toujours lui-même.

## Scripts

| Commande           | Effet                                             |
| ------------------ | ------------------------------------------------- |
| `npm run dev`      | Serveur de développement                          |
| `npm run build`    | Build de production                               |
| `npm start`        | Serveur de production                             |
| `npm test`         | Tests unitaires                                   |
| `npm run typecheck`| Vérification TypeScript                           |
| `npm run icons`    | Régénère les icônes PNG (sans dépendance externe) |
| `npm run db:init`  | Crée le schéma sur la base configurée             |

---

## In English

A guided rosary web app, installable to the home screen, in French and English.

Pray the chaplet of the day (its mysteries follow the liturgical cycle), the
full twenty-mystery rosary, or a free rosary where you write your own intention
for each decade — aloud or in writing. Tick every Our Father, Hail Mary and
Glory Be; a rosary can be spread across the day and resumed exactly where it
was left, on any device.

The rosary is drawn as it is held: a crucifix with the body of Christ on it,
then the Our Father bead, three Hail Mary beads, the centre medal, and a loop of
five decades — fifty-nine beads in all.

Twenty-one properties of the drawing — the size of the beads, the size and cut
of the centre stone, the depth of colour, gold along the chain, roses, foliage,
filigree, rays, haloes, patina, engraving, a dove, a crown of twelve stars, a
rose window, lilies — are each a function of what has actually been prayed, on
one saturating curve that rises fastest at the start and never finishes. At the
end of every rosary the app says in plain words what is different in the
picture, and how many decades remain before the next change. Tap the rosary to
open it full screen and zoom in on any bead.

Choose the shape of the loop — round, oval or square — and your own three
colours, or let the palette come from the mysteries you pray most. Statistics
cover rosaries, decades, Hail Marys, current and longest streak, days prayed and
the last ninety days.

Getting started:

```bash
npm install
cp .env.example .env.local     # set SESSION_SECRET
npm run dev
```

With no `DATABASE_URL` the app uses a local SQLite file; set it to a Postgres
connection string for production. Both `SESSION_SECRET` and `DATABASE_URL` are
the only variables needed to deploy.
