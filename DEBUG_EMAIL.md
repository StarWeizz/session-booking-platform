# Guide de débogage des emails

## Problème: Les emails d'annulation ne fonctionnent pas toujours

### Améliorations apportées

J'ai ajouté un logging détaillé pour mieux identifier les problèmes d'envoi d'emails.

### Comment débugger

#### 1. Vérifier les logs en production

Lorsqu'un utilisateur annule une réservation, vous devriez voir ces logs dans votre console:

**Logs de succès:**
```
[CANCELLATION] Attempting to send cancellation email to: user@example.com
[CANCELLATION] SMTP_HOST configured: true
[CANCELLATION] Class info: { title: 'Cours de yoga', date_time: '...' }
[CANCELLATION] Session lost: false
[EMAIL] sendCancellationEmail called { to: 'user@example.com', ... }
[EMAIL] Preparing to send cancellation email with subject: Annulation confirmée — Cours de yoga
[EMAIL] Cancellation email sent successfully to: user@example.com
[CANCELLATION] Cancellation email sent successfully to: user@example.com
```

**Logs d'erreur (SMTP non configuré):**
```
[CANCELLATION] Attempting to send cancellation email to: user@example.com
[CANCELLATION] SMTP_HOST configured: false
[CANCELLATION] SMTP not configured, skipping email
```

**Logs d'erreur (pas d'email utilisateur):**
```
[CANCELLATION] No email for user, skipping cancellation email
```

**Logs d'erreur (échec d'envoi):**
```
[CANCELLATION] Failed to send cancellation email: Error: ...
[CANCELLATION] Error details: { ... }
[EMAIL] Failed to send cancellation email: Error: ...
```

#### 2. Vérifier la configuration SMTP

Assurez-vous que ces variables d'environnement sont définies:

```bash
SMTP_HOST=smtp.gmail.com  # ou autre serveur SMTP
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
STUDIO_NAME=Studio Yoga
```

#### 3. Problèmes courants

**a) SMTP_HOST non configuré**
- Symptôme: Log `SMTP not configured, skipping email`
- Solution: Ajouter les variables SMTP dans votre environnement de production

**b) Email utilisateur manquant**
- Symptôme: Log `No email for user`
- Cause: L'utilisateur n'a pas d'email dans `auth.users`
- Solution: Vérifier la base de données

**c) Échec SMTP**
- Symptôme: Logs `Failed to send cancellation email`
- Causes possibles:
  - Mot de passe SMTP incorrect
  - Port SMTP bloqué
  - Limite d'envoi atteinte
  - Email destinataire invalide

**d) Timeout ou latence réseau**
- Symptôme: Email arrive en retard ou pas du tout
- Solution: Vérifier les logs réseau de votre hébergeur

#### 4. Test manuel

Pour tester l'envoi d'emails d'annulation:

1. Créer une réservation
2. L'annuler immédiatement
3. Vérifier les logs (console de production)
4. Vérifier la boîte email

#### 5. Différence avec les emails de confirmation

Les emails de confirmation ont toujours eu un bon logging. Les emails d'annulation en manquaient.

**Maintenant les deux ont:**
- ✅ Logging avant tentative d'envoi
- ✅ Vérification SMTP_HOST
- ✅ Logging détaillé des erreurs
- ✅ Logging de succès
- ✅ Gestion des erreurs avec try/catch

### Logs de promotion waitlist

J'ai aussi ajouté du logging pour la promotion des utilisateurs en liste d'attente:

```
[CANCELLATION] Checking for waitlisted users to promote
[CANCELLATION] Promoting waitlisted user: user-id-xxx
[CANCELLATION] Waitlisted user promoted successfully
```

### Monitoring recommandé

Pour éviter les problèmes futurs:

1. **Alertes sur les logs d'erreur**: Configurer des alertes sur les logs `[EMAIL] Failed`
2. **Dashboard de métriques**: Suivre le ratio emails envoyés / emails tentés
3. **Test automatisé**: Script qui teste l'envoi d'emails périodiquement

### Contact en cas de problème persistant

Si après vérification des logs le problème persiste:

1. Partager les logs complets (incluant `[EMAIL]` et `[CANCELLATION]`)
2. Vérifier la config SMTP avec un outil comme `telnet smtp.gmail.com 587`
3. Tester avec un autre compte email destinataire
