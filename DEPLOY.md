# Mettre le rosaire en ligne

Deux variables suffisent, partout :

| Variable         | Rôle                                                                   |
| ---------------- | ---------------------------------------------------------------------- |
| `SESSION_SECRET` | Signature des cookies de session. 32 octets aléatoires. **Requis.**     |
| `DATABASE_URL`   | `postgres://…`. Absent ⇒ fichier SQLite local, pour le développement.   |

Pour en générer un :

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Railway — l'application et sa base au même endroit

Le plus simple si vous avez déjà un compte : Railway héberge les deux, dans un
seul projet. Il n'y a rien d'autre à ouvrir.

1. **New Project → Deploy from GitHub repo → `2lr/Rosary`.** Railway reconnaît
   Next.js ; `railway.json` fixe déjà la commande de build et celle de
   démarrage.
2. **Ajouter la base.** Dans le même projet : **+ New → Database → Add
   PostgreSQL**.
3. **Brancher les deux.** Sur le service de l'application, onglet **Variables** :
   - `DATABASE_URL` = `${{Postgres.DATABASE_URL}}` — Railway remplace la
     référence tout seul, il n'y a pas de mot de passe à recopier ;
   - `SESSION_SECRET` = la valeur générée plus haut.
4. **Settings → Networking → Generate Domain** pour obtenir l'adresse publique.

Les tables se créent à la première requête. Le conteneur est persistant, donc
les connexions à la base sont réutilisées — pas de pooler à configurer.

### Redéployer tout seul à chaque changement

Railway le fait déjà si vous l'avez branché sur le dépôt GitHub. Si vous
préférez que ce soit la CI qui pousse — utile pour ne déployer qu'une fois les
tests verts — le workflow `.github/workflows/deploy.yml` est prêt :

1. Dans Railway : **Project Settings → Tokens → Create Token**. Prenez un jeton
   *de projet*, pas un jeton de compte : il ne peut toucher que ce projet-là.
2. Dans GitHub : **Settings → Secrets and variables → Actions → New repository
   secret**, nommé `RAILWAY_TOKEN`, et collez-y le jeton.
   Collez-le directement dans GitHub — un jeton qui passe par une conversation
   ou un e-mail est un jeton à changer.
3. Si votre service Railway ne s'appelle pas `Rosary`, ajoutez une *variable*
   (pas un secret) `RAILWAY_SERVICE` avec son nom.

Sans ce secret, le workflow ne fait rien et n'échoue pas.

---

## Vercel + Neon — l'autre chemin

Si vous préférez Vercel. **Neon** est simplement un hébergeur de bases
PostgreSQL : Postgres est le moteur, Neon est la société qui vous en loue une,
gérée et sauvegardée, avec un palier gratuit. Il ne sert qu'à ça — stocker les
comptes et les rosaires. Vercel n'héberge pas de base de données, d'où le
couple. Sur Railway, la question ne se pose pas : les deux sont au même endroit.

1. **Importer le dépôt.** Sur [vercel.com/new](https://vercel.com/new), choisir
   `2lr/Rosary`. Vercel reconnaît Next.js tout seul : ne rien changer aux
   réglages de build.
2. **Ajouter la base.** Une fois le projet créé : onglet **Storage** →
   **Create Database** → **Neon (Serverless Postgres)** → région Europe. Vercel
   pose `DATABASE_URL` dans le projet à votre place.
   Si vous créez la base directement chez Neon, prenez la chaîne **pooled**
   (celle dont l'hôte contient `-pooler`) : les fonctions serverless ouvrent
   beaucoup de connexions courtes.
3. **Ajouter le secret.** Onglet **Settings → Environment Variables** :
   `SESSION_SECRET`, la valeur générée ci-dessus, pour les trois environnements.
4. **Redéployer** (onglet Deployments → ⋯ → Redeploy) pour que les variables
   soient prises en compte.

Les tables se créent toutes seules à la première requête. Rien d'autre à faire.

> Ne laissez pas `DATABASE_URL` vide sur Vercel : le disque y est éphémère, le
> fichier SQLite serait effacé à chaque déploiement.

### Le domaine

Onglet **Settings → Domains**. Sans domaine à vous, l'adresse en
`.vercel.app` fonctionne parfaitement — c'est celle que vous enverrez.

---

## Sur une machine à vous — Docker

Tout, base comprise, en une commande :

```bash
export SESSION_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
docker compose up --build
```

Puis <http://localhost:3000>. Les données vivent dans le volume `rosary-db` et
survivent aux redémarrages.

## Sans Docker

```bash
npm ci
npm run build
DATABASE_URL=postgres://…  SESSION_SECRET=…  npm start
```

`npm run db:init` crée le schéma d'avance si vous préférez le faire à la main ;
sinon l'application s'en charge à la première requête.

---

## Vérifier que c'est bon

1. Ouvrir l'adresse, créer un compte.
2. Prier un chapelet jusqu'au bout — l'écran de fin doit annoncer « 5 grains de
   plus au cœur de la rose ».
3. Recharger la page : le rosaire et les statistiques doivent être là. C'est la
   preuve que la base est bien branchée et persistante.

## Sur le téléphone

- **iPhone** : ouvrir l'adresse dans Safari → Partager → « Sur l'écran
  d'accueil ».
- **Android** : Chrome propose « Installer l'application ».

C'est cette adresse-là que vous envoyez aux gens.
