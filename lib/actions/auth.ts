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
