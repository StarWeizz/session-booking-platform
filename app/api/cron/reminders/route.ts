import { createAdminClient } from '@/lib/supabase/server'
import { sendBookingReminder } from '@/lib/resend'
import { NextResponse } from 'next/server'
import { addHours, isAfter, isBefore } from 'date-fns'

// This route is called by a cron job every hour (configure in vercel.json)
// It sends reminders for classes starting in 12-13 hours
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createAdminClient()

  const now = new Date()
  const windowStart = addHours(now, 12)
  const windowEnd = addHours(now, 13)

  // Find classes starting in the next 12-13 hours
  const { data: classes, error } = await supabase
    .from('classes')
    .select(`
      *,
      bookings(
        id,
        status,
        user_id
      )
    `)
    .eq('is_cancelled', false)
    .gte('date_time', windowStart.toISOString())
    .lte('date_time', windowEnd.toISOString())

  if (error || !classes || classes.length === 0) {
    return NextResponse.json({ sent: 0 })
  }

  let sent = 0

  for (const yogaClass of classes) {
    const classDate = new Date(yogaClass.date_time)
    if (!isAfter(classDate, windowStart) || !isBefore(classDate, windowEnd)) continue

    const confirmedBookings = (yogaClass.bookings as Array<{id: string, status: string, user_id: string}>)
      .filter((b) => b.status === 'confirmed')

    for (const booking of confirmedBookings) {
      const { data: userData } = await supabase.auth.admin.getUserById(booking.user_id)
      if (!userData.user?.email) continue

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', booking.user_id)
        .single()

      try {
        await sendBookingReminder({
          to: userData.user.email,
          userName: profile?.full_name ?? userData.user.email,
          yogaClass,
        })
        sent++
      } catch (e) {
        console.error(`Failed to send reminder to ${userData.user.email}:`, e)
      }
    }
  }

  return NextResponse.json({ sent })
}
