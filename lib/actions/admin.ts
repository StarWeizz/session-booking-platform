'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getAllClients() {
  const supabase = await createClient()

  const { data: profiles } = await supabase
    .from('profiles')
    .select(`
      *,
      bookings(id, status),
      session_cards(id, remaining_sessions, total_sessions, expiry_date)
    `)
    .eq('role', 'user')
    .order('created_at', { ascending: false })

  if (!profiles) return []

  return profiles.map((p) => ({
    ...p,
    booking_count: (p.bookings as Array<{id: string, status: string}>)
      .filter((b) => b.status === 'confirmed').length,
    total_remaining: (p.session_cards as Array<{remaining_sessions: number}>)
      .reduce((sum, c) => sum + c.remaining_sessions, 0),
    active_cards: (p.session_cards as Array<{remaining_sessions: number}>)
      .filter((c) => c.remaining_sessions > 0).length,
  }))
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
