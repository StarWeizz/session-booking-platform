import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ cards: [], totalCount: 0 }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ cards: [], totalCount: 0 }, { status: 403 })

  // Extract query parameters
  const searchParams = request.nextUrl.searchParams
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '25')
  const search = searchParams.get('search') || ''
  const status = searchParams.get('status') || 'all'
  const cardType = searchParams.get('cardType') || 'all'
  const dateFrom = searchParams.get('dateFrom') || ''
  const dateTo = searchParams.get('dateTo') || ''

  // Build query for cards with email lookup
  let query = supabase
    .from('session_cards')
    .select(`
      *,
      profile:profiles!inner(full_name, id, email)
    `, { count: 'exact' })

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

  // Fetch ALL filtered cards (without pagination yet)
  // We need all cards to properly calculate engaged sessions
  query = query.order('created_at', { ascending: false })

  const { data: cards } = await query

  if (!cards || cards.length === 0) {
    return NextResponse.json({
      cards: [],
      totalCount: 0,
      page,
      limit
    })
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

  // Re-sort by created_at descending (like original query)
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

  // Apply manual pagination after all filtering
  const totalCount = filteredCards.length
  const from = (page - 1) * limit
  const to = from + limit
  const paginatedCards = filteredCards.slice(from, to)

  return NextResponse.json({
    cards: paginatedCards,
    totalCount,
    page,
    limit
  })
}
