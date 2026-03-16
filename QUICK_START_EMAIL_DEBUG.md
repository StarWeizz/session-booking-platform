# 🚀 Démarrage rapide - Débogage email

## Installation

```bash
npm install
```

## Test immédiat de votre configuration email

```bash
npm run test:email votre-email@example.com
```

Exemple:
```bash
npm run test:email contact@ayur-jyotish.fr
```

## Ce que vous allez voir

### ✅ Si tout fonctionne

```
🔍 Test de configuration email

Configuration SMTP:
- Host: smtp.gmail.com
- Port: 587
- User: votre-email@gmail.com
- Password: ✅ Configuré
- Studio: Studio Yoga
- Destinataire: test@example.com

📧 Envoi d'un email de test...

✅ Email envoyé avec succès !

Détails de l'envoi:
- Message ID: <xxx@smtp.gmail.com>
- Response: 250 2.0.0 OK

📬 Vérifiez la boîte email de: test@example.com
   (Pensez à vérifier les spams si vous ne le trouvez pas)
```

### ❌ Si ça ne fonctionne pas

```
🔍 Test de configuration email

Configuration SMTP:
- Host: ❌ NON CONFIGURÉ
- Port: ❌ NON CONFIGURÉ
...

❌ Configuration SMTP incomplète. Vérifiez votre .env.local
```

## Configuration requise (.env.local)

```env
# Gmail
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=votre-email@gmail.com
SMTP_PASSWORD=votre-mot-de-passe-app  # Pas votre mot de passe Gmail!

# Autres serveurs (exemples)
# OVH
# SMTP_HOST=ssl0.ovh.net
# SMTP_PORT=587

# Outlook
# SMTP_HOST=smtp-mail.outlook.com
# SMTP_PORT=587

# Studio
STUDIO_NAME=Nom de votre studio
```

## Mot de passe d'application Gmail

⚠️ N'utilisez PAS votre mot de passe Gmail normal!

### Comment créer un mot de passe d'application:

1. Allez sur https://myaccount.google.com/security
2. Activez la validation en 2 étapes (si pas déjà fait)
3. Allez dans "Mots de passe des applications"
4. Créez un mot de passe pour "Mail"
5. Copiez le mot de passe généré (16 caractères)
6. Utilisez-le dans `SMTP_PASSWORD`

## Vérifier les logs en production

Une fois déployé, quand un email d'annulation est envoyé, vous verrez:

```
[CANCELLATION] Attempting to send cancellation email to: user@example.com
[CANCELLATION] SMTP_HOST configured: true
[CANCELLATION] Class info: { title: 'Cours de yoga', ... }
[CANCELLATION] Session lost: false
[EMAIL] sendCancellationEmail called { to: 'user@example.com', ... }
[EMAIL] Preparing to send cancellation email with subject: Annulation confirmée
[EMAIL] Cancellation email sent successfully to: user@example.com
[CANCELLATION] Cancellation email sent successfully to: user@example.com
```

## Dépannage rapide

### Problème: "SMTP not configured"
**Solution**: Vérifiez que toutes les variables SMTP sont dans `.env.local` ET en production

### Problème: "Authentication failed"
**Solution**:
- Gmail: Utilisez un mot de passe d'application, pas votre mot de passe normal
- Vérifiez que l'email SMTP_USER est correct

### Problème: "Connection timeout"
**Solution**:
- Vérifiez le port (587 pour TLS, 465 pour SSL)
- Vérifiez votre firewall
- Essayez un autre serveur SMTP

### Problème: Email reçu mais en spam
**Solution**:
- Normal pour les emails de test
- En production, configurez SPF/DKIM/DMARC
- Utilisez un domaine professionnel

## Déploiement en production

Après avoir testé localement:

1. Ajoutez les variables SMTP dans votre plateforme (Vercel, etc.)
2. Redéployez
3. Testez une vraie annulation
4. Vérifiez les logs de production

## Documentation complète

- 📖 Guide complet: `DEBUG_EMAIL.md`
- 📊 Résumé des changements: `EMAIL_DEBUG_SUMMARY.md`

## Support

Si le test échoue malgré une configuration correcte:

1. Vérifiez les logs détaillés
2. Testez avec un autre compte email destinataire
3. Testez avec `telnet smtp.gmail.com 587`
4. Consultez les docs de votre fournisseur SMTP
