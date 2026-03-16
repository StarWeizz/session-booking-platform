import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { sendWelcomeEmail } from '@/lib/email'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Ensure profile exists
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', user.id)
          .single()

        if (!profile) {
          // Create new profile
          const full_name = user.user_metadata?.full_name ?? null
          const phone = user.user_metadata?.phone ?? null

          await supabase.from('profiles').insert({
            id: user.id,
            full_name,
            phone,
            role: 'user',
          })

          // Send welcome email for new users
          if (user.email && full_name && process.env.SMTP_HOST) {
            console.log('[AUTH_CALLBACK] Attempting to send welcome email to:', user.email)
            console.log('[AUTH_CALLBACK] SMTP_HOST configured:', !!process.env.SMTP_HOST)
            try {
              const result = await sendWelcomeEmail({
                to: user.email,
                userName: full_name,
              })
              console.log('[AUTH_CALLBACK] Welcome email sent successfully to:', user.email)
              console.log('[AUTH_CALLBACK] Email result:', result)
            } catch (emailError) {
              console.error('[AUTH_CALLBACK] Failed to send welcome email:', emailError)
              // Don't block registration if email fails
            }
          } else if (!process.env.SMTP_HOST) {
            console.log('[AUTH_CALLBACK] SMTP not configured, skipping welcome email')
          }
        }
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`)
}
