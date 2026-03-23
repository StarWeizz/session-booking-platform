import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ classes: [], totalCount: 0 }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') return NextResponse.json({ classes: [], totalCount: 0 }, { status: 403 })

  // Extract query parameters
  const searchParams = request.nextUrl.searchParams
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '25')
  const search = searchParams.get('search') || ''
  const status = searchParams.get('status') || 'all' // upcoming/past/cancelled/all
  const occupancy = searchParams.get('occupancy') || 'all' // full/available/all
  const dateFrom = searchParams.get('dateFrom') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const dateTo = searchParams.get('dateTo') || ''

  // Build query
  let query = supabase
    .from('classes')
    .select('*, bookings!left(id, status)', { count: 'exact' })

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

  // Order and count
  query = query.order('date_time', { ascending: false })

  const { data, count: totalCount } = await query

  if (!data) {
    return NextResponse.json({
      classes: [],
      totalCount: 0,
      page,
      limit
    })
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

  // Apply manual pagination after all filtering
  const filteredCount = classes.length
  const from = (page - 1) * limit
  const to = from + limit
  const paginatedClasses = classes.slice(from, to)

  return NextResponse.json({
    classes: paginatedClasses,
    totalCount: filteredCount,
    page,
    limit
  })
}
