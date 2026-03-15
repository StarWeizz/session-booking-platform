import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json([], { status: 401 })

  const { data: cards } = await supabase
    .from('session_cards')
    .select('*')
    .eq('user_id', user.id)
    .or(`expiry_date.is.null,expiry_date.gte.${new Date().toISOString().split('T')[0]}`)
    .order('created_at', { ascending: true })

  if (!cards) return NextResponse.json([])

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

  // Calculate total sessions on cards
  const totalOnCards = cards.reduce((sum, card) => sum + card.remaining_sessions, 0)

  // Distribute engaged sessions across cards proportionally
  let remainingEngaged = engagedCount
  const cardsWithAvailable = cards.map((card) => {
    const available = Math.max(0, Math.min(card.remaining_sessions, remainingEngaged))
    remainingEngaged -= available
    return {
      ...card,
      remaining_sessions: card.remaining_sessions - available
    }
  })

  // Filter out cards with no sessions left
  return NextResponse.json(cardsWithAvailable.filter(c => c.remaining_sessions > 0))
}
