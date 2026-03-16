'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const emailSchema = z.string().email('Adresse email invalide')

const signUpSchema = z.object({
  email: z.string().email('Adresse email invalide'),
  firstName: z.string().min(1, 'Le prénom est requis'),
  lastName: z.string().min(1, 'Le nom est requis'),
  phone: z.string().min(1, 'Le téléphone est requis'),
})

export async function signUpWithMagicLink(formData: FormData) {
  const rawData = {
    email: formData.get('email'),
    firstName: formData.get('firstName'),
    lastName: formData.get('lastName'),
    phone: formData.get('phone'),
  }

  const parse = signUpSchema.safeParse(rawData)

  if (!parse.success) {
    return { error: parse.error.errors[0].message }
  }

  const { email, firstName, lastName, phone } = parse.data
  const full_name = `${firstName} ${lastName}`
  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      data: {
        full_name,
        phone,
      },
    },
  })

  if (error) {
    return { error: 'Impossible d\'envoyer le lien. Veuillez réessayer.' }
  }

  return { success: true }
}

export async function signInWithMagicLink(formData: FormData) {
  const rawEmail = formData.get('email')
  const parse = emailSchema.safeParse(rawEmail)

  if (!parse.success) {
    return { error: parse.error.errors[0].message }
  }

  const email = parse.data
  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  })

  if (error) {
    return { error: 'Impossible d\'envoyer le lien. Veuillez réessayer.' }
  }

  return { success: true }
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export async function getUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function getProfile() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return data
}

export async function updateProfile(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Non authentifié' }

  const full_name = formData.get('full_name') as string
  const phone = formData.get('phone') as string

  const { error } = await supabase
    .from('profiles')
    .update({ full_name, phone, updated_at: new Date().toISOString() })
    .eq('id', user.id)

  if (error) return { error: 'Impossible de mettre à jour le profil' }

  return { success: true }
}

/**
 * Delete user account and all associated data (GDPR compliance)
 * This will delete:
 * - User profile
 * - All bookings
 * - All session cards
 * - All session usage records
 * - All payment records
 * - Auth user account
 */
export async function deleteAccount() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Non authentifié' }

  console.log('[DELETE_ACCOUNT] Starting account deletion for user:', user.id)

  try {
    // Delete in cascade order (child tables first)
    // Note: Most deletions will cascade automatically due to foreign key constraints
    // but we're being explicit for clarity and logging

    // 1. Delete session usage records
    const { error: usageError } = await supabase
      .from('session_usage')
      .delete()
      .in('card_id', supabase.from('session_cards').select('id').eq('user_id', user.id))

    if (usageError) {
      console.error('[DELETE_ACCOUNT] Error deleting session usage:', usageError)
    }

    // 2. Delete payments
    const { error: paymentsError } = await supabase
      .from('payments')
      .delete()
      .eq('user_id', user.id)

    if (paymentsError) {
      console.error('[DELETE_ACCOUNT] Error deleting payments:', paymentsError)
    }

    // 3. Delete session cards
    const { error: cardsError } = await supabase
      .from('session_cards')
      .delete()
      .eq('user_id', user.id)

    if (cardsError) {
      console.error('[DELETE_ACCOUNT] Error deleting session cards:', cardsError)
    }

    // 4. Delete bookings
    const { error: bookingsError } = await supabase
      .from('bookings')
      .delete()
      .eq('user_id', user.id)

    if (bookingsError) {
      console.error('[DELETE_ACCOUNT] Error deleting bookings:', bookingsError)
    }

    // 5. Delete profile (this will cascade to auth.users due to foreign key)
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', user.id)

    if (profileError) {
      console.error('[DELETE_ACCOUNT] Error deleting profile:', profileError)
      return { error: 'Impossible de supprimer le profil' }
    }

    // 6. Delete auth user (admin API required)
    // Note: This requires admin privileges, which we have via createAdminClient
    const { createAdminClient } = await import('@/lib/supabase/server')
    const adminClient = await createAdminClient()

    const { error: authError } = await adminClient.auth.admin.deleteUser(user.id)

    if (authError) {
      console.error('[DELETE_ACCOUNT] Error deleting auth user:', authError)
      return { error: 'Impossible de supprimer le compte utilisateur' }
    }

    console.log('[DELETE_ACCOUNT] Account successfully deleted for user:', user.id)

    // Sign out
    await supabase.auth.signOut()

    return { success: true }
  } catch (err) {
    console.error('[DELETE_ACCOUNT] Unexpected error:', err)
    return { error: 'Une erreur est survenue lors de la suppression du compte' }
  }
}
