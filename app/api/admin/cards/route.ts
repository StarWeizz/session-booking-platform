import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json([], { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json([], { status: 403 })

  const { data } = await supabase
    .from('session_cards')
    .select('*, profile:profiles(full_name, id)')
    .order('created_at', { ascending: false })

  return NextResponse.json(data ?? [])
}
