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

## Vercel + Neon — le chemin le plus court

Environ dix minutes, sans carte bancaire (les paliers gratuits suffisent
largement pour un rosaire partagé entre amis).

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
