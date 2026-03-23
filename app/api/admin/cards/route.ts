import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json([], { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json([], { status: 403 })

  const { data: cards } = await supabase
    .from('session_cards')
    .select('*, profile:profiles(full_name, id)')
    .order('created_at', { ascending: false })

  if (!cards || cards.length === 0) return NextResponse.json([])

  // Get all upcoming bookings paid by card for all users
  const { data: allBookings } = await supabase
    .from('bookings')
    .select('id, user_id, class:classes(date_time, is_cancelled), payment_method')
    .eq('status', 'confirmed')
    .eq('payment_method', 'card')

  const now = new Date().toISOString()

  // Count engaged sessions per user
  const engagedByUser = new Map<string, number>()
  for (const booking of allBookings ?? []) {
    const classData = booking.class as unknown as { date_time: string; is_cancelled: boolean } | null
    if (classData && !classData.is_cancelled && classData.date_time > now) {
      const count = engagedByUser.get(booking.user_id) ?? 0
      engagedByUser.set(booking.user_id, count + 1)
    }
  }

  // Group cards by user and calculate engaged sessions
  const userCards = new Map<string, typeof cards>()
  for (const card of cards) {
    const userId = card.user_id
    if (!userCards.has(userId)) {
      userCards.set(userId, [])
    }
    userCards.get(userId)!.push(card)
  }

  // Distribute engaged sessions across each user's cards (oldest first)
  const cardsWithEngaged = []
  for (const [userId, userCardList] of userCards) {
    let remainingEngaged = engagedByUser.get(userId) ?? 0
    const sortedCards = [...userCardList].sort((a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )

    for (const card of sortedCards) {
      const deducted = Math.min(card.remaining_sessions, remainingEngaged)
      remainingEngaged -= deducted
      cardsWithEngaged.push({
        ...card,
        remaining_sessions: card.remaining_sessions - deducted
      })
    }
  }

  // Re-sort by created_at descending (like original query)
  cardsWithEngaged.sort((a, b) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )

  return NextResponse.json(cardsWithEngaged)
}
