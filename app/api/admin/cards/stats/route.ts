import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({}, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({}, { status: 403 })

  // Get all cards
  const { data: cards } = await supabase
    .from('session_cards')
    .select('*')

  if (!cards) {
    return NextResponse.json({
      totalCards: 0,
      activeCards: 0,
      totalSessionsSold: 0,
      totalSessionsRemaining: 0,
      expiringSoon: 0,
      totalRevenue: 0
    })
  }

  // Get all upcoming bookings paid by card to calculate engaged sessions
  const { data: allBookings } = await supabase
    .from('bookings')
    .select('id, user_id, class:classes(date_time, is_cancelled), payment_method')
    .eq('status', 'confirmed')
    .eq('payment_method', 'card')

  const now = new Date()
  const nowISO = now.toISOString()

  // Count engaged sessions per user
  const engagedByUser = new Map<string, number>()
  for (const booking of allBookings ?? []) {
    const classData = booking.class as unknown as { date_time: string; is_cancelled: boolean } | null
    if (classData && !classData.is_cancelled && classData.date_time > nowISO) {
      const count = engagedByUser.get(booking.user_id) ?? 0
      engagedByUser.set(booking.user_id, count + 1)
    }
  }

  // Group cards by user
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

  // Calculate statistics
  const totalCards = cardsWithEngaged.length

  const activeCards = cardsWithEngaged.filter(card => {
    const isNotExpired = !card.expiry_date || new Date(card.expiry_date) > now
    return card.remaining_sessions > 0 && isNotExpired
  }).length

  const totalSessionsSold = cardsWithEngaged.reduce(
    (sum, card) => sum + (card.total_sessions || 0),
    0
  )

  const totalSessionsRemaining = cardsWithEngaged.reduce(
    (sum, card) => sum + (card.remaining_sessions || 0),
    0
  )

  const thirtyDaysFromNow = new Date()
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)

  const expiringSoon = cardsWithEngaged.filter(card => {
    if (!card.expiry_date) return false
    const expiryDate = new Date(card.expiry_date)
    return expiryDate > now && expiryDate <= thirtyDaysFromNow && card.remaining_sessions > 0
  }).length

  const totalRevenue = cardsWithEngaged.reduce(
    (sum, card) => sum + (card.purchase_price || 0),
    0
  )

  return NextResponse.json({
    totalCards,
    activeCards,
    totalSessionsSold,
    totalSessionsRemaining,
    expiringSoon,
    totalRevenue
  })
}
