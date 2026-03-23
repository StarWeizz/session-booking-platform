import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getAllClients } from '@/lib/actions/admin'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({}, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({}, { status: 403 })

  // Get all clients to calculate stats
  const { clients } = await getAllClients({ limit: 10000 })

  const totalClients = clients.length

  const now = new Date()
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const activeClients = clients.filter(c => {
    const hasActiveCards = c.active_cards > 0
    const hasRecentBooking = c.last_booking_date && c.last_booking_date > thirtyDaysAgo
    return hasActiveCards || hasRecentBooking
  }).length

  const newClientsThisMonth = clients.filter(c =>
    c.created_at && c.created_at >= thisMonthStart
  ).length

  const totalSessionsAcrossClients = clients.reduce((sum, c) => sum + (c.total_remaining || 0), 0)
  const avgSessionsPerClient = totalClients > 0
    ? Math.round(totalSessionsAcrossClients / totalClients * 10) / 10
    : 0

  return NextResponse.json({
    totalClients,
    activeClients,
    newClientsThisMonth,
    avgSessionsPerClient
  })
}
