'use server'

import { createClient } from '@/lib/supabase/server'
import type { CardType } from '@/types'

export async function getUserCards() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('session_cards')
    .select('*')
    .eq('user_id', user.id)
    .or(`expiry_date.is.null,expiry_date.gte.${new Date().toISOString().split('T')[0]}`)
    .order('created_at', { ascending: true })

  if (error) return []
  return data ?? []
}

export async function getTotalRemainingSession() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return 0

  const cards = await getUserCards()
  const totalOnCards = cards.reduce((sum, card) => sum + card.remaining_sessions, 0)

  // Subtract upcoming confirmed bookings not yet attended (sessions "engaged")
  const { data: upcoming } = await supabase
    .from('bookings')
    .select('id, class:classes(date_time)')
    .eq('user_id', user.id)
    .eq('status', 'confirmed')

  const now = new Date().toISOString()
  const engagedCount = (upcoming ?? []).filter(
    (b) => b.class && (b.class as { date_time: string }).date_time > now
  ).length

  return Math.max(0, totalOnCards - engagedCount)
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
  const sessions = cardType === '10' ? 10 : 20

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
