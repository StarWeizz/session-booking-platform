# 📅 Limites de réservation

## Vue d'ensemble

Pour éviter les abus et garantir une distribution équitable des places, des limites de réservation ont été mises en place selon le mode de paiement.

## Règles de réservation

### 🎁 Séance d'essai (Trial)
- **Limite :** 1 seule réservation active à la fois
- **Restrictions :** Uniquement pour les nouveaux utilisateurs (jamais réservé avant)
- **Avantage :** Gratuit, aucune restriction de délai

### 💳 Paiement sur place (On-site)
- **Limite :** Maximum 2 réservations à l'avance
- **Restrictions :** Aucune limite de temps
- **Usage :** Pour les utilisateurs occasionnels ou ceux qui préfèrent payer au studio

### 🎫 Paiement par carte (Card)
- **Limite :** Maximum 4 réservations à l'avance
- **Restrictions :**
  - Ne peut réserver que 2 semaines (14 jours) à l'avance maximum
  - Nécessite d'avoir des séances disponibles sur une carte active
- **Usage :** Pour les utilisateurs réguliers avec des cartes de séances

## Implémentation technique

### Fichiers modifiés

1. **`lib/actions/bookings.ts`**
   - Nouvelle fonction `getUpcomingBookingsCounts()` - Compte les réservations par méthode de paiement
   - Modification de `bookClass()` - Validation des limites avant création de réservation

2. **`app/(user)/classes/page.tsx`**
   - Récupération des compteurs de réservations
   - Affichage d'un encadré informatif avec le statut des réservations
   - Passage des données aux ClassCards

3. **`components/ClassCard.tsx`**
   - Calcul de `onSiteLimit`, `cardLimit`, `isBeyondTwoWeeks`
   - Affichage de messages d'avertissement avant les boutons
   - Désactivation des boutons si limite atteinte

### Logique de validation

```typescript
// Paiement sur place
if (paymentMethod === 'on_site' && bookingCounts.onSite >= 2) {
  return { error: 'Limite atteinte : 2 réservations max en paiement sur place' }
}

// Paiement par carte
if (paymentMethod === 'card') {
  // Limite de 4 réservations
  if (bookingCounts.card >= 4) {
    return { error: 'Limite atteinte : 4 séances max à l\'avance' }
  }

  // Limite de 2 semaines
  const twoWeeksFromNow = new Date()
  twoWeeksFromNow.setDate(twoWeeksFromNow.getDate() + 14)
  if (classDate > twoWeeksFromNow) {
    return { error: 'Réservation limitée à 2 semaines à l\'avance' }
  }
}

// Séance d'essai
if (paymentMethod === 'trial' && bookingCounts.trial >= 1) {
  return { error: 'Vous avez déjà une séance d\'essai en cours' }
}
```

## Affichage UI

### Encadré informatif (haut de page)

Visible seulement si l'utilisateur a des réservations en cours:

```
📋 Vos réservations en cours
• Avec carte : 2/4 réservations (max 2 semaines à l'avance)
• Paiement sur place : 1/2 réservations
```

### Messages d'avertissement (sur les cartes de cours)

Affichés juste avant les boutons si limite proche ou atteinte:

- **Paiement sur place :**
  ```
  ⚠️ Limite atteinte : 2 réservations max en paiement sur place
  ```

- **Paiement par carte :**
  ```
  ⚠️ Limite atteinte : 4 réservations max avec carte · Réservation limitée à 2 semaines à l'avance
  ```

### Désactivation des boutons

Les boutons sont désactivés avec les textes suivants:
- "Limite atteinte" - Si le nombre max de réservations est atteint
- "Trop tôt" - Si le cours est à plus de 2 semaines (carte uniquement)

## Scénarios de test

### ✅ Scénario 1: Utilisateur avec carte (limite OK)
- Utilisateur a 2 réservations avec carte
- Peut réserver 2 cours supplémentaires
- Ne peut pas réserver au-delà de 2 semaines
- ✓ Boutons actifs pour les cours dans les 2 semaines

### ✅ Scénario 2: Utilisateur avec carte (limite atteinte)
- Utilisateur a 4 réservations avec carte
- Ne peut plus réserver avec carte
- Peut encore réserver avec paiement sur place (si < 2)
- ✓ Bouton carte désactivé avec "Limite atteinte"

### ✅ Scénario 3: Paiement sur place (limite atteinte)
- Utilisateur a 2 réservations paiement sur place
- Ne peut plus réserver avec ce mode
- Peut réserver avec carte s'il en a une
- ✓ Bouton "Paiement sur place" désactivé

### ✅ Scénario 4: Séance d'essai
- Nouvel utilisateur sans réservation
- Peut réserver 1 séance d'essai gratuite
- Après réservation, option essai disparaît
- ✓ Bouton essai visible puis disparaît

### ✅ Scénario 5: Cours au-delà de 2 semaines
- Utilisateur avec carte veut réserver un cours dans 3 semaines
- Réservation refusée pour paiement carte
- Peut réserver avec paiement sur place
- ✓ Bouton carte désactivé avec "Trop tôt"

## Messages d'erreur

Les erreurs sont retournées par l'API et affichées dans l'UI:

| Situation | Message |
|-----------|---------|
| Trop de réservations sur place | "Limite atteinte : vous ne pouvez réserver que 2 cours maximum en paiement sur place." |
| Trop de réservations carte | "Limite atteinte : vous ne pouvez réserver que 4 séances maximum à l'avance." |
| Cours trop loin (carte) | "Vous ne pouvez réserver que 2 semaines à l'avance maximum avec une carte." |
| Essai déjà utilisé | "Vous avez déjà une séance d'essai en cours." |

## Comportement avec annulation

Quand un utilisateur annule une réservation:
- Le compteur est automatiquement décrémenté
- L'utilisateur peut immédiatement réserver un autre cours
- Les limites sont recalculées en temps réel

## Exemples de flux utilisateur

### Utilisateur régulier avec carte

1. Achète une carte de 10 séances
2. Réserve 4 cours dans les 2 prochaines semaines ✅
3. Tente de réserver un 5ème cours → ❌ "Limite atteinte"
4. Annule un cours
5. Peut maintenant réserver un nouveau cours ✅

### Utilisateur occasionnel (paiement sur place)

1. Réserve 2 cours en paiement sur place ✅
2. Tente de réserver un 3ème cours → ❌ "Limite atteinte"
3. Assiste à un cours (réservation dans le passé)
4. Peut réserver un nouveau cours ✅

### Nouvel utilisateur (essai)

1. Première visite sur la plateforme
2. Voit "🎁 Séance d'essai gratuite" ✅
3. Réserve sa première séance
4. L'option essai disparaît
5. Doit acheter une carte ou payer sur place

## Monitoring recommandé

Pour s'assurer que les limites fonctionnent correctement:

1. **Logs à surveiller:**
   ```
   [BOOKING] User X attempting to book with Y payment method
   [BOOKING] Current counts: onSite=A, card=B, trial=C
   [BOOKING] Validation failed: limit reached
   ```

2. **Métriques à suivre:**
   - Nombre de tentatives de réservation bloquées par jour
   - Répartition des réservations par méthode de paiement
   - Taux d'annulation par méthode de paiement

3. **Alertes recommandées:**
   - Si > 10% des réservations sont bloquées → les limites sont peut-être trop strictes
   - Si de nombreuses annulations après blocage → utilisateurs contournent les limites

## Configuration future (optionnel)

Si vous souhaitez rendre les limites configurables:

```typescript
// config/booking-limits.ts
export const BOOKING_LIMITS = {
  ON_SITE: 2,
  CARD: 4,
  CARD_WEEKS_ADVANCE: 2, // en semaines
  TRIAL: 1,
}
```

Cela permettrait de modifier facilement les limites sans changer le code.
