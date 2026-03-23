import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({}, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({}, { status: 403 })

  const now = new Date()
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  // Get all classes with bookings
  const { data: classes } = await supabase
    .from('classes')
    .select('*, bookings!left(id, status)')
    .gte('date_time', thisMonthStart)

  if (!classes) {
    return NextResponse.json({
      totalClassesThisMonth: 0,
      avgAttendanceRate: 0,
      cancelledCount: 0,
      mostPopularTime: 'N/A'
    })
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

  return NextResponse.json({
    totalClassesThisMonth,
    avgAttendanceRate,
    cancelledCount,
    mostPopularTime
  })
}
