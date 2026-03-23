'use server'

import { createClient } from '@/lib/supabase/server'

export interface GetClassesParams {
  page?: number
  limit?: number
  search?: string
  status?: 'upcoming' | 'past' | 'cancelled' | 'all'
  occupancy?: 'full' | 'available' | 'all'
  dateFrom?: string
  dateTo?: string
}

export async function getClasses(params: GetClassesParams = {}) {
  const {
    page = 1,
    limit = 25,
    search = '',
    status = 'all',
    occupancy = 'all',
    dateFrom = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    dateTo = ''
  } = params

  const supabase = await createClient()

  // Build query
  let query = supabase
    .from('classes')
    .select('*, bookings!left(id, status)')

  // Filter by search (title)
  if (search) {
    query = query.ilike('title', `%${search}%`)
  }

  // Filter by date range
  if (dateFrom) {
    query = query.gte('date_time', dateFrom)
  }
  if (dateTo) {
    query = query.lte('date_time', dateTo)
  }

  // Filter by status
  const now = new Date().toISOString()
  if (status === 'upcoming') {
    query = query.gte('date_time', now).eq('is_cancelled', false)
  } else if (status === 'past') {
    query = query.lt('date_time', now)
  } else if (status === 'cancelled') {
    query = query.eq('is_cancelled', true)
  }

  // Order
  query = query.order('date_time', { ascending: false })

  const { data } = await query

  if (!data) {
    return {
      classes: [],
      totalCount: 0,
      page,
      limit
    }
  }

  // Add booking count to each class
  let classes = data.map((c) => ({
    ...c,
    booking_count: (c.bookings as Array<{id: string, status: string}>)
      .filter((b) => b.status === 'confirmed').length,
  }))

  // Filter by occupancy
  if (occupancy === 'full') {
    classes = classes.filter(c => c.booking_count >= c.max_participants)
  } else if (occupancy === 'available') {
    classes = classes.filter(c => c.booking_count < c.max_participants)
  }

  // Apply manual pagination
  const totalCount = classes.length
  const from = (page - 1) * limit
  const to = from + limit
  const paginatedClasses = classes.slice(from, to)

  return {
    classes: paginatedClasses,
    totalCount,
    page,
    limit
  }
}

export async function getClassesStats() {
  const supabase = await createClient()

  const now = new Date()
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  // Get all classes with bookings
  const { data: classes } = await supabase
    .from('classes')
    .select('*, bookings!left(id, status)')
    .gte('date_time', thisMonthStart)

  if (!classes) {
    return {
      totalClassesThisMonth: 0,
      avgAttendanceRate: 0,
      cancelledCount: 0,
      mostPopularTime: 'N/A'
    }
  }

  const totalClassesThisMonth = classes.length

  // Calculate attendance rate
  let totalSpots = 0
  let totalBookings = 0

  for (const cls of classes) {
    const bookings = cls.bookings as Array<{id: string, status: string}>
    const confirmedBookings = bookings.filter(b => b.status === 'confirmed').length
    totalSpots += cls.max_participants
    totalBookings += confirmedBookings
  }

  const avgAttendanceRate = totalSpots > 0
    ? Math.round((totalBookings / totalSpots) * 100)
    : 0

  // Count cancelled
  const cancelledCount = classes.filter(c => c.is_cancelled).length

  // Find most popular time slot
  const timeSlots: { [key: string]: number } = {}
  for (const cls of classes) {
    const hour = new Date(cls.date_time).getHours()
    const timeSlot = `${hour}h`
    timeSlots[timeSlot] = (timeSlots[timeSlot] || 0) + 1
  }

  const mostPopularTime = Object.keys(timeSlots).length > 0
    ? Object.entries(timeSlots).sort((a, b) => b[1] - a[1])[0][0]
    : 'N/A'

  return {
    totalClassesThisMonth,
    avgAttendanceRate,
    cancelledCount,
    mostPopularTime
  }
}
