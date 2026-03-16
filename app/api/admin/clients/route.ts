import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json([], { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json([], { status: 403 })

  const { data } = await supabase
    .from('profiles_with_email')
    .select('id, full_name, email')
    .eq('role', 'user')
    .order('full_name', { ascending: true })

  return NextResponse.json(data ?? [])
}
