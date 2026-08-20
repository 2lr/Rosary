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
- **Un rosaire qui se personnalise.** L'illustration est générée à partir de
  votre historique : plus vous priez, plus la couronne s'orne (roses, filigrane,
  rayons, halo, grains taillés), et la palette se teinte des mystères que vous
  priez le plus. Huit étapes, de « Semence » à « Couronne ».
- **Statistiques.** Rosaires, dizaines, Je vous salue Marie, série en cours,
  plus longue série, jours de prière, 90 derniers jours, historique.
- **Hors ligne.** La progression est conservée localement et renvoyée au serveur
  dès le retour du réseau.

## Textes

Français : Symbole des Apôtres, Notre Père dans la traduction liturgique de
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
  settings/              Langue, prénom, installation, compte
  api/                   Authentification, rosaires, statistiques
components/              Interface ; RosaryArt.tsx dessine le rosaire génératif
lib/rosary/              Prières, mystères, séquence, croissance, statistiques
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

The artwork on the home screen is generated from your own history: the more you
pray, the more the crown is adorned, and its palette takes the colour of the
mysteries you pray most. Statistics cover rosaries, decades, Hail Marys, current
and longest streak, days prayed and the last ninety days.

Getting started:

```bash
npm install
cp .env.example .env.local     # set SESSION_SECRET
npm run dev
```

With no `DATABASE_URL` the app uses a local SQLite file; set it to a Postgres
connection string for production. Both `SESSION_SECRET` and `DATABASE_URL` are
the only variables needed to deploy.
