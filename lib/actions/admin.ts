'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

interface GetAllClientsParams {
  page?: number
  limit?: number
  search?: string
  status?: 'active' | 'inactive' | 'all'
  sortBy?: 'created_at' | 'booking_count' | 'total_remaining'
  sortOrder?: 'asc' | 'desc'
}

export async function getAllClients(params: GetAllClientsParams = {}) {
  const supabase = await createClient()
  const {
    page = 1,
    limit = 1000, // Default to large number for backward compatibility
    search = '',
    status = 'all',
    sortBy = 'created_at',
    sortOrder = 'desc'
  } = params

  let query = supabase
    .from('profiles_with_email')
    .select(`
      *,
      bookings(id, status, class:classes(date_time, is_cancelled), payment_method),
      session_cards(id, remaining_sessions, total_sessions, expiry_date, created_at)
    `, { count: 'exact' })
    .eq('role', 'user')

  // Filter by search (name or email)
  if (search) {
    query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`)
  }

  // Apply sorting
  const ascending = sortOrder === 'asc'
  if (sortBy === 'created_at') {
    query = query.order('created_at', { ascending })
  }

  const { data: profiles, count: totalCount } = await query

  if (!profiles) return { clients: [], totalCount: 0 }

  const now = new Date().toISOString()
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const clients = profiles.map((p) => {
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

    const activeCards = cardsWithEngaged.filter((c) => {
      const isNotExpired = !c.expiry_date || new Date(c.expiry_date) > new Date()
      return c.remaining_sessions > 0 && isNotExpired
    }).length

    // Get most recent booking date
    const lastBookingDate = bookings
      .filter((b) => b.status === 'confirmed' && b.class?.date_time)
      .map((b) => b.class!.date_time)
      .sort()
      .reverse()[0] || null

    return {
      ...p,
      booking_count: bookings.filter((b) => b.status === 'confirmed').length,
      total_remaining: cardsWithEngaged.reduce((sum, c) => sum + c.remaining_sessions, 0),
      active_cards: activeCards,
      last_booking_date: lastBookingDate
    }
  })

  // Filter by status
  let filteredClients = clients
  if (status === 'active') {
    filteredClients = clients.filter(c => {
      const hasActiveCards = c.active_cards > 0
      const hasRecentBooking = c.last_booking_date && c.last_booking_date > thirtyDaysAgo
      return hasActiveCards || hasRecentBooking
    })
  } else if (status === 'inactive') {
    filteredClients = clients.filter(c => {
      const hasActiveCards = c.active_cards > 0
      const hasRecentBooking = c.last_booking_date && c.last_booking_date > thirtyDaysAgo
      return !hasActiveCards && !hasRecentBooking
    })
  }

  // Sort by booking_count or total_remaining if specified
  if (sortBy === 'booking_count' || sortBy === 'total_remaining') {
    filteredClients.sort((a, b) => {
      const valA = a[sortBy]
      const valB = b[sortBy]
      return sortOrder === 'asc' ? valA - valB : valB - valA
    })
  }

  // Apply pagination
  const from = (page - 1) * limit
  const to = from + limit
  const paginatedClients = filteredClients.slice(from, to)

  return {
    clients: paginatedClients,
    totalCount: filteredClients.length
  }
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
