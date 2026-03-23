import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'
import { getAllClients } from '@/lib/actions/admin'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ clients: [], totalCount: 0 }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ clients: [], totalCount: 0 }, { status: 403 })

  // Extract query parameters
  const searchParams = request.nextUrl.searchParams

  // Check if this is a simple request (for forms/dropdowns) - no pagination params
  const isSimpleRequest = !searchParams.has('page') && !searchParams.has('limit')

  if (isSimpleRequest) {
    // Return simple list for backward compatibility (used in forms)
    const { data } = await supabase
      .from('profiles_with_email')
      .select('id, full_name, email')
      .eq('role', 'user')
      .order('full_name', { ascending: true })

    return NextResponse.json(data ?? [])
  }

  // Full featured request with pagination
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '25')
  const search = searchParams.get('search') || ''
  const status = (searchParams.get('status') || 'all') as 'active' | 'inactive' | 'all'
  const sortBy = (searchParams.get('sortBy') || 'created_at') as 'created_at' | 'booking_count' | 'total_remaining'
  const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc'

  const result = await getAllClients({
    page,
    limit,
    search,
    status,
    sortBy,
    sortOrder
  })

  return NextResponse.json(result)
}
