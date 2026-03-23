'use server'

import { createClient } from '@/lib/supabase/server'

export async function getClientsStats() {
  const supabase = await createClient()

  // Get all clients to calculate stats
  const { data: profiles } = await supabase
    .from('profiles_with_email')
    .select(`
      *,
      bookings(id, status, class:classes(date_time, is_cancelled), payment_method),
      session_cards(id, remaining_sessions, total_sessions, expiry_date, created_at)
    `)
    .eq('role', 'user')

  if (!profiles) {
    return {
      totalClients: 0,
      activeClients: 0,
      newClientsThisMonth: 0,
      avgSessionsPerClient: 0
    }
  }

  const now = new Date()
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  let activeCount = 0
  let totalSessions = 0

  for (const p of profiles) {
    const bookings = p.bookings as Array<{
      id: string
      status: string
      class?: { date_time: string; is_cancelled: boolean } | null
      payment_method?: string
    }>

    const cards = p.session_cards as Array<{
      id: string
      remaining_sessions: number
      total_sessions: number
      expiry_date: string | null
      created_at: string
    }>

    // Calculate engaged sessions
    const nowISO = new Date().toISOString()
    const engagedCount = bookings.filter((b) => {
      if (b.status !== 'confirmed' || b.payment_method !== 'card') return false
      const classData = b.class
      return classData && !classData.is_cancelled && classData.date_time > nowISO
    }).length

    // Distribute engaged sessions
    const sortedCards = [...cards].sort((a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )
    let remainingEngaged = engagedCount
    const cardsWithEngaged = sortedCards.map((card) => {
      const deducted = Math.min(card.remaining_sessions, remainingEngaged)
      remainingEngaged -= deducted
      return {
        ...card,
        remaining_sessions: card.remaining_sessions - deducted
      }
    })

    const activeCards = cardsWithEngaged.filter((c) => {
      const isNotExpired = !c.expiry_date || new Date(c.expiry_date) > now
      return c.remaining_sessions > 0 && isNotExpired
    }).length

    const lastBookingDate = bookings
      .filter((b) => b.status === 'confirmed' && b.class?.date_time)
      .map((b) => b.class!.date_time)
      .sort()
      .reverse()[0] || null

    const hasActiveCards = activeCards > 0
    const hasRecentBooking = lastBookingDate && lastBookingDate > thirtyDaysAgo

    if (hasActiveCards || hasRecentBooking) {
      activeCount++
    }

    totalSessions += cardsWithEngaged.reduce((sum, c) => sum + c.remaining_sessions, 0)
  }

  const totalClients = profiles.length
  const activeClients = activeCount
  const newClientsThisMonth = profiles.filter(c =>
    c.created_at && c.created_at >= thisMonthStart
  ).length

  const avgSessionsPerClient = totalClients > 0
    ? Math.round(totalSessions / totalClients * 10) / 10
    : 0

  return {
    totalClients,
    activeClients,
    newClientsThisMonth,
    avgSessionsPerClient
  }
}
