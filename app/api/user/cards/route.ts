import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json([], { status: 401 })

  const { data } = await supabase
    .from('session_cards')
    .select('*')
    .eq('user_id', user.id)
    .gt('remaining_sessions', 0)
    .or(`expiry_date.is.null,expiry_date.gte.${new Date().toISOString().split('T')[0]}`)
    .order('created_at', { ascending: true })

  return NextResponse.json(data ?? [])
}
