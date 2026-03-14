# Guide de déploiement — Studio Yoga

## Prérequis

- Compte [Vercel](https://vercel.com)
- Compte [Supabase](https://supabase.com)
- Compte [Stripe](https://stripe.com)
- Compte [Resend](https://resend.com)

---

## 1. Supabase

### Créer le projet
1. Créez un nouveau projet sur supabase.com
2. Notez l'URL et les clés API (Dashboard → Settings → API)

### Appliquer le schéma SQL
1. Allez dans **SQL Editor** dans le dashboard Supabase
2. Copiez-collez le contenu de `supabase/migrations/001_initial.sql`
3. Exécutez

### Configurer Auth
1. Dashboard → Authentication → URL Configuration
2. **Site URL** : `https://votre-domaine.vercel.app`
3. **Redirect URLs** : `https://votre-domaine.vercel.app/auth/callback`
4. Pour les emails Magic Link, activez le fournisseur Email (activé par défaut)

### Créer le premier compte admin
Après avoir créé votre compte via magic link :
```sql
UPDATE public.profiles
SET role = 'admin'
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'votre-email@exemple.fr'
);
```
Exécutez dans SQL Editor.

---

## 2. Stripe

### Créer les produits
1. Dashboard → Products → Add product

**Carte 10 séances**
- Nom : `Carte 10 séances`
- Prix : `120.00 EUR` — paiement unique
- Notez le **Price ID** (`price_...`)

**Carte 20 séances**
- Nom : `Carte 20 séances`
- Prix : `220.00 EUR` — paiement unique
- Notez le **Price ID** (`price_...`)

### Configurer le webhook
1. Dashboard → Developers → Webhooks → Add endpoint
2. URL : `https://votre-domaine.vercel.app/api/stripe/webhook`
3. Events à écouter : `checkout.session.completed`
4. Notez le **Signing secret** (`whsec_...`)

---

## 3. Resend

1. Créez un compte sur resend.com
2. Vérifiez votre domaine email (Dashboard → Domains)
3. Créez une clé API (Dashboard → API Keys)
4. Mettez à jour `RESEND_FROM_EMAIL` avec votre email vérifié

---

## 4. Vercel

### Déployer le projet
```bash
# Installer Vercel CLI
npm i -g vercel

# Dans le dossier du projet
vercel

# Suivre les instructions
```

Ou connectez votre repo GitHub à Vercel (recommandé pour le CI/CD automatique).

### Variables d'environnement
Dans Vercel Dashboard → Settings → Environment Variables, ajoutez toutes les variables de `.env.example` :

| Variable | Valeur |
|----------|--------|
| `NEXT_PUBLIC_SITE_URL` | `https://votre-domaine.vercel.app` |
| `NEXT_PUBLIC_SUPABASE_URL` | URL Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clé anon Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key |
| `STRIPE_SECRET_KEY` | `sk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` |
| `STRIPE_PRICE_10_SESSIONS` | `price_...` |
| `STRIPE_PRICE_20_SESSIONS` | `price_...` |
| `RESEND_API_KEY` | `re_...` |
| `RESEND_FROM_EMAIL` | `noreply@votredomaine.fr` |
| `STUDIO_NAME` | `Studio Yoga` |
| `CRON_SECRET` | Chaîne aléatoire longue |

### Cron job (rappels email)
Le fichier `vercel.json` configure un cron qui s'exécute toutes les heures.
Il nécessite le plan **Vercel Pro** (ou Hobby avec limitations).

Alternative gratuite : utilisez [cron-job.org](https://cron-job.org) ou Supabase Edge Functions pour appeler `/api/cron/reminders` avec le header `Authorization: Bearer <CRON_SECRET>`.

---

## 5. Vérification post-déploiement

- [ ] Magic Link fonctionne (tester depuis l'interface)
- [ ] Réservation d'un cours fonctionne
- [ ] Paiement Stripe en mode test fonctionne
- [ ] Webhook Stripe reçu et carte créée
- [ ] Email de confirmation reçu
- [ ] Admin peut voir les clients et créer des cours
- [ ] Confirmation de présence fonctionne

---

## Domaine personnalisé

1. Vercel Dashboard → Settings → Domains → Add
2. Configurez les DNS selon les instructions Vercel
3. Mettez à jour `NEXT_PUBLIC_SITE_URL` dans les env vars Vercel
4. Mettez à jour l'URL dans Supabase Auth Settings
5. Mettez à jour l'URL dans Stripe Webhooks

---

## Développement local

```bash
# Copier les variables d'environnement
cp .env.example .env.local
# Remplir les valeurs dans .env.local

# Installer les dépendances
npm install

# Lancer le serveur
npm run dev

# Pour tester les webhooks Stripe en local
stripe listen --forward-to localhost:3000/api/stripe/webhook
```
