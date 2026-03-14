import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json([], { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') return NextResponse.json([], { status: 403 })

  const { data } = await supabase
    .from('classes')
    .select('*, bookings!left(id, status)')
    .gte('date_time', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
    .order('date_time', { ascending: true })

  return NextResponse.json(
    (data ?? []).map((c) => ({
      ...c,
      booking_count: (c.bookings as Array<{id: string, status: string}>)
        .filter((b) => b.status === 'confirmed').length,
    }))
  )
}
