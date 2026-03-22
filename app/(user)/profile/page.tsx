import { createClient } from '@/lib/supabase/server'
import ProfileClient from '@/components/ProfileClient'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Mon profil' }
export const revalidate = 60

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <ProfileClient
      profile={{
        id: user.id,
        full_name: profile?.full_name ?? null,
        email: user.email ?? null,
        phone: profile?.phone ?? null,
        created_at: profile?.created_at ?? user.created_at,
      }}
    />
  )
}
