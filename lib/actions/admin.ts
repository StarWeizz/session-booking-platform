'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getAllClients() {
  const supabase = await createClient()

  const { data: profiles } = await supabase
    .from('profiles_with_email')
    .select(`
      *,
      bookings(id, status, class:classes(date_time, is_cancelled), payment_method),
      session_cards(id, remaining_sessions, total_sessions, expiry_date, created_at)
    `)
    .eq('role', 'user')
    .order('created_at', { ascending: false })

  if (!profiles) return []

  const now = new Date().toISOString()

  return profiles.map((p) => {
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

    // Count engaged sessions (upcoming confirmed bookings paid by card)
    const engagedCount = bookings.filter((b) => {
      if (b.status !== 'confirmed' || b.payment_method !== 'card') return false
      const classData = b.class
      return classData && !classData.is_cancelled && classData.date_time > now
    }).length

    // Distribute engaged sessions across cards (oldest first)
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

    return {
      ...p,
      booking_count: bookings.filter((b) => b.status === 'confirmed').length,
      total_remaining: cardsWithEngaged.reduce((sum, c) => sum + c.remaining_sessions, 0),
      active_cards: cardsWithEngaged.filter((c) => c.remaining_sessions > 0).length,
    }
  })
}

export async function confirmAttendance({
  bookingId,
  classId,
}: {
  bookingId: string
  classId: string
}) {
  const supabase = await createClient()

  // Get booking with user
  const { data: booking } = await supabase
    .from('bookings')
    .select('*, profile:profiles(id)')
    .eq('id', bookingId)
    .single()

  if (!booking) return { error: 'Réservation introuvable' }

  // Check if already confirmed
  const { data: existingUsage } = await supabase
    .from('session_usage')
    .select('id')
    .eq('booking_id', bookingId)
    .single()

  if (existingUsage) return { error: 'Présence déjà confirmée' }

  // Find oldest active card
  const { data: card } = await supabase
    .from('session_cards')
    .select('*')
    .eq('user_id', booking.user_id)
    .gt('remaining_sessions', 0)
    .order('created_at', { ascending: true })
    .limit(1)
    .single()

  if (!card) return { error: 'Aucune séance disponible sur les cartes de cet élève' }

  // Deduct session
  const { error: updateError } = await supabase
    .from('session_cards')
    .update({ remaining_sessions: card.remaining_sessions - 1 })
    .eq('id', card.id)

  if (updateError) return { error: 'Impossible de déduire la séance' }

  // Record usage
  await supabase.from('session_usage').insert({
    card_id: card.id,
    booking_id: bookingId,
    class_id: classId,
  })

  revalidatePath(`/admin/attendance/${classId}`)
  revalidatePath('/admin/clients')
  revalidatePath('/admin/cards')
  return { success: true }
}

export async function getAttendanceStats() {
  const supabase = await createClient()

  const { data: bookings } = await supabase
    .from('bookings')
    .select('status, created_at')
    .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

  const { data: cards } = await supabase
    .from('session_cards')
    .select('total_sessions, remaining_sessions, created_at')

  const { count: clientCount } = await supabase
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .eq('role', 'user')

  const totalBookings = (bookings ?? []).filter((b) => b.status === 'confirmed').length
  const totalSessions = (cards ?? []).reduce((sum, c) => sum + c.total_sessions, 0)
  const usedSessions = (cards ?? []).reduce(
    (sum, c) => sum + (c.total_sessions - c.remaining_sessions),
    0
  )

  return {
    clientCount: clientCount ?? 0,
    bookingsThisMonth: totalBookings,
    totalSessions,
    usedSessions,
  }
}
