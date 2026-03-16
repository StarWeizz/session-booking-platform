'use server'

import { createClient } from '@/lib/supabase/server'
import type { CardType } from '@/types'

export async function getUserCards() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data: cards, error } = await supabase
    .from('session_cards')
    .select('*')
    .eq('user_id', user.id)
    .or(`expiry_date.is.null,expiry_date.gte.${new Date().toISOString().split('T')[0]}`)
    .order('created_at', { ascending: true })

  if (error || !cards) return []

  // Get upcoming bookings paid by card to calculate engaged sessions
  const { data: upcomingBookings } = await supabase
    .from('bookings')
    .select('id, class:classes(date_time), payment_method')
    .eq('user_id', user.id)
    .eq('status', 'confirmed')
    .eq('payment_method', 'card')

  const now = new Date().toISOString()
  const engagedCount = (upcomingBookings ?? []).filter(
    (b) => b.class && (b.class as unknown as { date_time: string }).date_time > now
  ).length

  // Distribute engaged sessions across cards
  let remainingEngaged = engagedCount
  const cardsWithAvailable = cards.map((card) => {
    const deducted = Math.min(card.remaining_sessions, remainingEngaged)
    remainingEngaged -= deducted
    return {
      ...card,
      remaining_sessions: card.remaining_sessions - deducted
    }
  })

  return cardsWithAvailable
}

export async function getTotalRemainingSession() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return 0

  // getUserCards() already deducts engaged sessions, so just sum them up
  const cards = await getUserCards()
  return cards.reduce((sum, card) => sum + card.remaining_sessions, 0)
}

export async function getAllCards() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('session_cards')
    .select('*, profile:profiles(full_name, id)')
    .order('created_at', { ascending: false })

  return data ?? []
}

export async function createCardManually({
  userId,
  cardType,
  expiryDate,
}: {
  userId: string
  cardType: CardType
  expiryDate?: string
}) {
  const supabase = await createClient()
  const sessionsMap: Record<CardType, number> = {
    '1': 1,
    '10': 10,
    '20': 20,
  }
  const sessions = sessionsMap[cardType]

  const { error } = await supabase.from('session_cards').insert({
    user_id: userId,
    total_sessions: sessions,
    remaining_sessions: sessions,
    expiry_date: expiryDate ?? null,
  })

  if (error) return { error: 'Impossible de créer la carte' }
  return { success: true }
}

export async function updateCardSessions({
  cardId,
  remainingSessions,
}: {
  cardId: string
  remainingSessions: number
}) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('session_cards')
    .update({ remaining_sessions: Math.max(0, remainingSessions) })
    .eq('id', cardId)

  if (error) return { error: 'Impossible de modifier la carte' }
  return { success: true }
}

/**
 * Find an active multi-session card (10 or 20 sessions) for a user
 * Returns the card if found, null otherwise
 */
export async function getActiveMultiSessionCard(userId?: string) {
  const supabase = await createClient()

  // If no userId provided, get current user
  let targetUserId = userId
  if (!targetUserId) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    targetUserId = user.id
  }

  const today = new Date().toISOString().split('T')[0]

  const { data: cards } = await supabase
    .from('session_cards')
    .select('*')
    .eq('user_id', targetUserId)
    .gte('remaining_sessions', 1)
    .in('total_sessions', [10, 20])
    .or(`expiry_date.is.null,expiry_date.gte.${today}`)
    .order('created_at', { ascending: true })
    .limit(1)

  return cards && cards.length > 0 ? cards[0] : null
}

/**
 * Validate if a user can purchase a new card
 * Returns null if purchase is allowed, or an error object if blocked
 */
export async function validateCardPurchase(
  cardType: CardType,
  userId?: string
): Promise<{ error: string; details: string } | null> {
  // Single sessions are always allowed
  if (cardType === '1') {
    return null
  }

  // Check for existing active multi-session card
  const activeCard = await getActiveMultiSessionCard(userId)

  if (activeCard) {
    return {
      error: 'Limite de carte atteinte',
      details: `Vous avez déjà une carte active avec ${activeCard.remaining_sessions} séance${activeCard.remaining_sessions > 1 ? 's' : ''} restante${activeCard.remaining_sessions > 1 ? 's' : ''}. Utilisez vos séances avant d'acheter une nouvelle carte.`,
    }
  }

  return null
}
