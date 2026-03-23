'use server'

import { createClient } from '@/lib/supabase/server'

export interface GetCardsParams {
  page?: number
  limit?: number
  search?: string
  status?: 'active' | 'inactive' | 'all'
  cardType?: string
  dateFrom?: string
  dateTo?: string
}

export async function getCards(params: GetCardsParams = {}) {
  const {
    page = 1,
    limit = 25,
    search = '',
    status = 'all',
    cardType = 'all',
    dateFrom = '',
    dateTo = ''
  } = params

  const supabase = await createClient()

  // Build query for cards with email lookup
  let query = supabase
    .from('session_cards')
    .select(`
      *,
      profile:profiles!inner(full_name, id, email)
    `)

  // Filter by search (name or email)
  if (search) {
    query = query.or(`profile.full_name.ilike.%${search}%,profile.email.ilike.%${search}%`)
  }

  // Filter by card type
  if (cardType !== 'all') {
    query = query.eq('total_sessions', parseInt(cardType))
  }

  // Filter by date range
  if (dateFrom) {
    query = query.gte('created_at', dateFrom)
  }
  if (dateTo) {
    query = query.lte('created_at', dateTo)
  }

  // Fetch ALL filtered cards
  query = query.order('created_at', { ascending: false })

  const { data: cards } = await query

  if (!cards || cards.length === 0) {
    return {
      cards: [],
      totalCount: 0,
      page,
      limit
    }
  }

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

  // Re-sort by created_at descending
  cardsWithEngaged.sort((a, b) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )

  // Filter by status after calculating engaged sessions
  let filteredCards = cardsWithEngaged
  if (status === 'active') {
    filteredCards = cardsWithEngaged.filter(card => {
      const isNotExpired = !card.expiry_date || new Date(card.expiry_date) > new Date()
      return card.remaining_sessions > 0 && isNotExpired
    })
  } else if (status === 'inactive') {
    filteredCards = cardsWithEngaged.filter(card => {
      const isExpired = card.expiry_date && new Date(card.expiry_date) <= new Date()
      return card.remaining_sessions === 0 || isExpired
    })
  }

  // Apply manual pagination
  const totalCount = filteredCards.length
  const from = (page - 1) * limit
  const to = from + limit
  const paginatedCards = filteredCards.slice(from, to)

  return {
    cards: paginatedCards,
    totalCount,
    page,
    limit
  }
}

export async function getCardsStats() {
  const supabase = await createClient()

  // Get all cards
  const { data: cards } = await supabase
    .from('session_cards')
    .select('*')

  if (!cards) {
    return {
      totalCards: 0,
      activeCards: 0,
      totalSessionsSold: 0,
      totalSessionsRemaining: 0,
      expiringSoon: 0,
      totalRevenue: 0
    }
  }

  // Get all upcoming bookings paid by card
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

  // Distribute engaged sessions
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

  return {
    totalCards,
    activeCards,
    totalSessionsSold,
    totalSessionsRemaining,
    expiringSoon,
    totalRevenue
  }
}
