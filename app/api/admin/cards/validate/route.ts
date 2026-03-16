import { createClient } from '@/lib/supabase/server'
import { getActiveMultiSessionCard } from '@/lib/actions/cards'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  // Check admin role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  // Get query params
  const searchParams = request.nextUrl.searchParams
  const targetUserId = searchParams.get('userId')

  if (!targetUserId) {
    return NextResponse.json({ error: 'userId requis' }, { status: 400 })
  }

  // Check for active multi-session card
  const activeCard = await getActiveMultiSessionCard(targetUserId)

  return NextResponse.json({
    hasActiveCard: !!activeCard,
    remainingSessions: activeCard?.remaining_sessions ?? 0,
    cardType: activeCard?.total_sessions ?? null,
  })
}
