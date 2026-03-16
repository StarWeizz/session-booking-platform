# 📧 Amélioration du débogage des emails

## Problème identifié

Les emails d'annulation ne fonctionnaient pas toujours, et il était difficile de savoir pourquoi car le logging était insuffisant.

## Solutions apportées

### ✅ 1. Logging détaillé pour les annulations

**Fichier: `lib/actions/bookings.ts`**

Ajout de logs avant, pendant et après l'envoi d'emails d'annulation:

- ✅ Log de tentative d'envoi avec email destinataire
- ✅ Vérification et log de la configuration SMTP
- ✅ Log des informations du cours
- ✅ Log du statut (session perdue ou non)
- ✅ Log de succès après envoi
- ✅ Log d'erreur détaillé avec JSON stringify
- ✅ Log si email utilisateur manquant
- ✅ Log si SMTP non configuré

### ✅ 2. Logging dans la fonction d'envoi

**Fichier: `lib/resend.ts`**

Amélioration de 3 fonctions:
- `sendCancellationEmail()` - Emails d'annulation
- `sendBookingReminder()` - Emails de rappel
- `sendBookingConfirmation()` - Déjà bon

Chaque fonction a maintenant:
- ✅ Log au début de l'appel
- ✅ Log avant l'envoi avec sujet
- ✅ Try/catch pour capturer les erreurs
- ✅ Log de succès après envoi
- ✅ Log d'erreur détaillé

### ✅ 3. Logging de la promotion waitlist

**Fichier: `lib/actions/bookings.ts`**

Ajout de logs pour la promotion des utilisateurs en liste d'attente:
- ✅ Log de vérification de waitlist
- ✅ Log de promotion réussie
- ✅ Log d'erreur si échec
- ✅ Log si pas d'utilisateurs à promouvoir

### ✅ 4. Script de test email

**Fichier: `scripts/test-email.ts`**

Script pour tester manuellement la configuration SMTP:

```bash
npx tsx scripts/test-email.ts votre-email@example.com
```

Le script:
- Vérifie toute la configuration SMTP
- Envoie un email de test
- Affiche des erreurs détaillées en cas d'échec
- Suggère des solutions si problème

### ✅ 5. Documentation

**Fichier: `DEBUG_EMAIL.md`**

Guide complet de débogage avec:
- Exemples de logs de succès/erreur
- Liste des problèmes courants et solutions
- Instructions de test manuel
- Recommandations de monitoring

## Comment utiliser ces améliorations

### 1. Tester votre configuration SMTP

```bash
npx tsx scripts/test-email.ts votre-email@example.com
```

Si le test échoue, vérifiez votre `.env.local`:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=votre-email@gmail.com
SMTP_PASSWORD=votre-mot-de-passe-app
STUDIO_NAME=Nom de votre studio
```

### 2. Vérifier les logs en production

Quand un email ne part pas, cherchez dans vos logs:

**Pour une annulation:**
```
[CANCELLATION] Attempting to send cancellation email
[CANCELLATION] SMTP_HOST configured: true
[EMAIL] sendCancellationEmail called
[EMAIL] Preparing to send cancellation email
```

**Pour une confirmation:**
```
[BOOKING] Attempting to send confirmation email
[BOOKING] SMTP_HOST configured: true
[EMAIL] sendBookingConfirmation called
```

### 3. Messages d'erreur courants

**"SMTP not configured"**
```
[CANCELLATION] SMTP_HOST configured: false
[CANCELLATION] SMTP not configured, skipping email
```
→ Ajouter les variables SMTP dans l'environnement de production

**"No email for user"**
```
[CANCELLATION] No email for user, skipping cancellation email
```
→ L'utilisateur n'a pas d'email dans auth.users

**"Failed to send"**
```
[EMAIL] Failed to send cancellation email: Error: ...
```
→ Vérifier les identifiants SMTP, le port, les limites d'envoi

## Avant / Après

### Avant ❌

```typescript
sendCancellationEmail({...}).catch((err) => {
  console.error('Failed to send cancellation email:', err)
})
```

**Problèmes:**
- Pas de log avant la tentative
- Pas de vérification SMTP
- Erreur peu détaillée
- Pas de log de succès

### Après ✅

```typescript
if (user.email) {
  console.log('[CANCELLATION] Attempting to send email to:', user.email)
  console.log('[CANCELLATION] SMTP_HOST configured:', !!process.env.SMTP_HOST)

  if (process.env.SMTP_HOST) {
    try {
      const result = await sendCancellationEmail({...})
      console.log('[CANCELLATION] Email sent successfully')
      console.log('[CANCELLATION] Result:', result)
    } catch (err) {
      console.error('[CANCELLATION] Failed:', err)
      console.error('[CANCELLATION] Details:', JSON.stringify(err, null, 2))
    }
  } else {
    console.warn('[CANCELLATION] SMTP not configured')
  }
} else {
  console.warn('[CANCELLATION] No email for user')
}
```

**Améliorations:**
- ✅ Log avant la tentative
- ✅ Vérification SMTP explicite
- ✅ Erreurs détaillées avec JSON
- ✅ Log de succès
- ✅ Gestion de tous les cas

## Prochaines étapes recommandées

1. **Monitoring**: Configurer des alertes sur les logs `[EMAIL] Failed`
2. **Métriques**: Tracker le ratio emails envoyés / tentés
3. **Tests automatiques**: Script qui teste périodiquement l'envoi
4. **Dashboard**: Vue centralisée des emails envoyés/échoués

## Tester immédiatement

1. Déployez ces changements en production
2. Testez avec le script: `npx tsx scripts/test-email.ts votre-email@example.com`
3. Créez une réservation et annulez-la
4. Vérifiez les logs pour voir tous les détails
5. Vérifiez votre boîte email

Vous devriez maintenant voir exactement ce qui se passe à chaque étape!
