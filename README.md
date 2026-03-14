# Studio Yoga — Plateforme de réservation

MVP de réservation de cours de yoga. Remplace un carnet papier pour gérer clients, réservations et cartes de séances.

## Stack

- **Next.js 16** (App Router) + TypeScript
- **Tailwind CSS 3**
- **Supabase** — PostgreSQL + Auth (magic link)
- **Stripe** — paiement des cartes de séances
- **Resend** — emails transactionnels
- **Vercel** — déploiement + cron jobs

## Fonctionnalités

### Côté élève
- Connexion sans mot de passe (magic link)
- Planning des cours à venir avec nombre de places restantes
- Réservation en un clic (nécessite une carte active)
- Annulation gratuite jusqu'à 24h avant le cours
- Achat de cartes de séances via Stripe (10 ou 20 séances)
- Dashboard avec séances disponibles et prochains cours

### Côté admin (professeure)
- Liste des clients avec séances restantes
- Création et annulation de cours
- Gestion des cartes (ajout manuel, modification du solde)
- Confirmation de présence après chaque cours → déduction de la séance

### Automatique
- Email de confirmation à la réservation
- Email de rappel 12h avant le cours (cron horaire)
- Email d'annulation (avec ou sans perte de séance)
- Liste d'attente automatique si cours complet

## Démarrage rapide

```bash
cp .env.example .env.local
# Remplir les variables dans .env.local

npm install
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

## Structure du projet

```
app/
├── (auth)/login/          # Connexion magic link
├── (user)/
│   ├── dashboard/         # Espace élève
│   ├── classes/           # Planning et réservations
│   └── cards/             # Cartes de séances
├── (admin)/admin/
│   ├── page.tsx           # Dashboard stats
│   ├── clients/           # Liste des élèves
│   ├── classes/           # Gestion du planning
│   ├── cards/             # Gestion des cartes
│   └── attendance/[id]/   # Confirmation de présence
├── api/
│   ├── stripe/            # Checkout + webhook
│   └── cron/reminders/    # Rappels email
└── auth/callback/         # Callback Supabase Auth

lib/
├── actions/               # Server actions (auth, bookings, cards, classes, admin)
├── supabase/              # Client browser / server / middleware
├── stripe.ts
└── resend.ts

supabase/
├── migrations/001_initial.sql      # Schéma + RLS
└── email-templates/                # Templates Supabase Auth
```

## Variables d'environnement

Voir `.env.example` pour la liste complète. Les variables essentielles :

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL du projet Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clé publique Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé service role (webhook, cron) |
| `STRIPE_SECRET_KEY` | Clé secrète Stripe |
| `STRIPE_WEBHOOK_SECRET` | Secret du webhook Stripe |
| `STRIPE_PRICE_10_SESSIONS` | Price ID Stripe — carte 10 séances |
| `STRIPE_PRICE_20_SESSIONS` | Price ID Stripe — carte 20 séances |
| `RESEND_API_KEY` | Clé API Resend |
| `CRON_SECRET` | Token d'auth pour le cron job |

## Déploiement

Voir [DEPLOYMENT.md](./DEPLOYMENT.md) pour le guide complet (Supabase → Stripe → Resend → Vercel).

### Résumé

1. Créer le projet Supabase et exécuter `supabase/migrations/001_initial.sql`
2. Configurer les redirects Auth dans Supabase
3. Créer les produits Stripe et le webhook
4. Vérifier le domaine email sur Resend
5. Déployer sur Vercel avec les variables d'environnement
6. Passer son compte en `role = 'admin'` via SQL

## Logique métier

- Les séances sont déduites des cartes **après le cours**, quand l'admin confirme la présence
- L'affichage "séances disponibles" = séances sur les cartes − cours réservés à venir
- La carte la plus ancienne est utilisée en priorité (FIFO)
- Annulation < 24h → séance perdue
- Cours complet → liste d'attente automatique, promotion si annulation
