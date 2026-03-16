# Page Profil & Conformité RGPD

## Vue d'ensemble

Une page de profil utilisateur a été ajoutée avec suppression de compte conformément au RGPD.

## Fonctionnalités

### 📋 Informations du profil
- Affichage des données personnelles (nom, email, téléphone)
- Date d'inscription
- Accès en lecture seule

### 📄 Documents légaux
- Téléchargement des Conditions d'Utilisation
- Téléchargement de la Politique de Confidentialité
- Format .docx pour faciliter la lecture

### 🗑️ Suppression de compte (RGPD)
- Bouton "Supprimer mon compte" dans une zone danger
- Confirmation avec saisie de "SUPPRIMER"
- Suppression complète et irréversible de toutes les données:
  - Profil utilisateur
  - Réservations
  - Cartes de séances
  - Historique de paiements
  - Compte d'authentification

## Accès

La page profil est accessible via:
- URL: `/profile`
- Navigation: Icône "Profil" dans la barre de navigation (4ème position)

## Documents légaux requis

⚠️ **Important:** Vous devez ajouter vos documents légaux dans le dossier `public/documents/`

### Fichiers à créer:

1. **`public/documents/conditions-utilisation.docx`**
   - Conditions Générales d'Utilisation
   - Doit inclure: réservations, paiements, annulations, responsabilité

2. **`public/documents/politique-confidentialite.docx`**
   - Politique de Confidentialité (RGPD)
   - Doit inclure: données collectées, droits des utilisateurs, conservation

Consultez `public/documents/README.md` pour plus de détails sur le contenu requis.

## Conformité RGPD

### Droit à l'effacement (Article 17 RGPD)

La fonctionnalité de suppression de compte respecte le droit à l'effacement:

**Données supprimées:**
- ✅ Identité (profil)
- ✅ Historique de réservations
- ✅ Données de paiement
- ✅ Cartes de séances
- ✅ Compte d'authentification

**Processus de suppression:**
1. L'utilisateur clique sur "Supprimer mon compte"
2. Une modale de confirmation s'affiche
3. L'utilisateur doit taper "SUPPRIMER" pour confirmer
4. Le système supprime toutes les données en cascade
5. Le compte d'authentification est supprimé
6. L'utilisateur est déconnecté et redirigé

**Logging:**
Tous les événements de suppression sont loggés pour audit:
```
[DELETE_ACCOUNT] Starting account deletion for user: xxx
[DELETE_ACCOUNT] Account successfully deleted for user: xxx
```

### Transparence (Article 13-14 RGPD)

Les documents légaux sont facilement accessibles:
- Section dédiée dans la page profil
- Liens de téléchargement direct
- Format .docx lisible par tous

## Implémentation technique

### Fichiers créés

1. **`app/(user)/profile/page.tsx`**
   - Page serveur qui récupère les données du profil
   - Passe les données au composant client

2. **`components/ProfileClient.tsx`**
   - Composant client avec interactivité
   - Modal de confirmation
   - Gestion d'état (loading, erreurs)

3. **`lib/actions/auth.ts`** - Nouvelle fonction `deleteAccount()`
   - Suppression en cascade de toutes les données
   - Logging pour audit
   - Gestion d'erreurs robuste

4. **`components/Navigation.tsx`**
   - Ajout de l'icône "Profil" dans la navigation

### Sécurité

- ✅ Authentification requise pour accéder à la page
- ✅ Confirmation obligatoire (saisie "SUPPRIMER")
- ✅ Suppression côté serveur uniquement (Server Action)
- ✅ Utilisation de l'admin API pour supprimer le compte auth
- ✅ Gestion d'erreurs à chaque étape

### Ordre de suppression

```typescript
1. session_usage (dépend de session_cards)
2. payments (dépend de user_id)
3. session_cards (dépend de user_id)
4. bookings (dépend de user_id)
5. profiles (dépend de auth.users)
6. auth.users (compte d'authentification)
```

## Test de la fonctionnalité

### Test de suppression de compte:

1. Créez un compte de test
2. Faites quelques réservations
3. Achetez une carte
4. Allez sur `/profile`
5. Cliquez "Supprimer mon compte"
6. Tapez "SUPPRIMER"
7. Confirmez
8. Vérifiez que:
   - Toutes les données sont supprimées
   - Le compte est déconnecté
   - Le compte n'existe plus

### Vérification base de données:

```sql
-- Vérifier qu'aucune donnée ne reste pour l'utilisateur
SELECT * FROM profiles WHERE id = 'user-id';
SELECT * FROM bookings WHERE user_id = 'user-id';
SELECT * FROM session_cards WHERE user_id = 'user-id';
SELECT * FROM payments WHERE user_id = 'user-id';
```

Toutes les requêtes doivent retourner 0 résultats.

## Recommandations légales

⚠️ **Consultez un avocat spécialisé en droit numérique pour:**

1. **Rédaction des CGU et Politique de Confidentialité**
   - Adapté à votre activité spécifique
   - Conforme au RGPD français
   - Mentions légales appropriées

2. **Durée de conservation des données**
   - Actuellement: suppression immédiate sur demande
   - À adapter selon vos obligations légales (comptabilité, etc.)

3. **Logs d'audit**
   - Les logs de suppression sont conservés
   - Définir une politique de rétention

4. **Données de facturation**
   - Si vous avez des obligations comptables
   - Peut nécessiter une conservation plus longue

## Support utilisateur

### Questions fréquentes

**Q: Puis-je récupérer mon compte après suppression?**
R: Non, la suppression est définitive et irréversible.

**Q: Que devient mon historique de paiements?**
R: Toutes vos données, y compris l'historique de paiements, sont définitivement supprimées.

**Q: Puis-je récupérer mes cartes de séances?**
R: Non, toutes les cartes sont supprimées. Assurez-vous d'avoir utilisé vos séances avant de supprimer votre compte.

## Prochaines étapes recommandées

1. ✅ Ajouter les documents légaux (.docx) dans `public/documents/`
2. ⏭️ Faire valider les documents par un avocat
3. ⏭️ Ajouter une politique de cookies si nécessaire
4. ⏭️ Configurer une page de mentions légales
5. ⏭️ Ajouter un formulaire de contact DPO
6. ⏭️ Documenter la politique de rétention des logs

## Logs et monitoring

Surveillez les logs de suppression de compte:

```bash
# Rechercher les suppressions de compte
grep "DELETE_ACCOUNT" logs.txt

# Exemples de logs:
[DELETE_ACCOUNT] Starting account deletion for user: abc123
[DELETE_ACCOUNT] Account successfully deleted for user: abc123
```

En cas d'erreur, les logs indiqueront quelle étape a échoué.
