import { NextResponse } from 'next/server'
import { sendCancellationEmail } from '@/lib/email'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const { userId, classId, sessionLost } = await request.json()

    if (!userId || !classId) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
    }

    const supabase = await createAdminClient()

    // Get user and class info
    const [{ data: user }, { data: profile }, { data: yogaClass }] = await Promise.all([
      supabase.auth.admin.getUserById(userId),
      supabase.from('profiles').select('full_name').eq('id', userId).single(),
      supabase.from('classes').select('*').eq('id', classId).single(),
    ])

    if (!user?.user?.email || !yogaClass) {
      console.error('[EMAIL API] Missing user email or class data')
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
    }

    // Check if SMTP is configured
    if (!process.env.SMTP_HOST) {
      console.log('[EMAIL API] SMTP not configured, skipping email')
      return NextResponse.json({ success: true, skipped: true })
    }

    // Send email asynchronously
    await sendCancellationEmail({
      to: user.user.email,
      userName: profile?.full_name ?? user.user.email,
      yogaClass,
      sessionLost: sessionLost ?? false,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[EMAIL API] Error sending cancellation email:', error)
    // Return 200 anyway - we don't want to fail the cancellation if email fails
    return NextResponse.json({ success: false, error: String(error) }, { status: 200 })
  }
}