'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const classSchema = z.object({
  title: z.string().min(1, 'Le titre est requis'),
  date_time: z.string().min(1, 'La date est requise'),
  duration_minutes: z.coerce.number().min(15).max(240).default(60),
  max_participants: z.coerce.number().min(1).max(50).default(10),
  location: z.string().min(1, 'Le lieu est requis'),
  description: z.string().optional(),
})

export async function createClass(formData: FormData) {
  const supabase = await createClient()

  const date = formData.get('date') as string
  const time = formData.get('time') as string
  const date_time = date && time ? `${date}T${time}:00` : formData.get('date_time') as string

  const raw = {
    title: formData.get('title'),
    date_time,
    duration_minutes: formData.get('duration_minutes'),
    max_participants: formData.get('max_participants'),
    location: formData.get('location'),
    description: formData.get('description'),
  }

  const parse = classSchema.safeParse(raw)
  if (!parse.success) {
    return { error: parse.error.errors[0].message }
  }

  const { error } = await supabase.from('classes').insert(parse.data)
  if (error) return { error: 'Impossible de créer le cours' }

  revalidatePath('/admin/classes')
  revalidatePath('/classes')
  return { success: true }
}

export async function updateClass(classId: string, formData: FormData) {
  const supabase = await createClient()

  const date = formData.get('date') as string
  const time = formData.get('time') as string
  const date_time = date && time ? `${date}T${time}:00` : formData.get('date_time') as string

  const raw = {
    title: formData.get('title'),
    date_time,
    duration_minutes: formData.get('duration_minutes'),
    max_participants: formData.get('max_participants'),
    location: formData.get('location'),
    description: formData.get('description'),
  }

  const parse = classSchema.safeParse(raw)
  if (!parse.success) return { error: parse.error.errors[0].message }

  const { error } = await supabase
    .from('classes')
    .update(parse.data)
    .eq('id', classId)

  if (error) return { error: 'Impossible de modifier le cours' }

  revalidatePath('/admin/classes')
  revalidatePath('/classes')
  return { success: true }
}

export async function cancelClass(classId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('classes')
    .update({ is_cancelled: true })
    .eq('id', classId)

  if (error) return { error: 'Impossible d\'annuler le cours' }

  revalidatePath('/admin/classes')
  revalidatePath('/classes')
  return { success: true }
}

export async function getClassWithParticipants(classId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('classes')
    .select(`
      *,
      bookings(
        id,
        status,
        created_at,
        profile:profiles(id, full_name)
      )
    `)
    .eq('id', classId)
    .single()

  if (error || !data) return null
  return data
}

export async function getAllClassesAdmin() {
  const supabase = await createClient()

  const { data } = await supabase
    .from('classes')
    .select('*, bookings!left(id, status)')
    .gte('date_time', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
    .order('date_time', { ascending: true })

  return (data ?? []).map((c) => ({
    ...c,
    booking_count: (c.bookings as Array<{id: string, status: string}>)
      .filter((b) => b.status === 'confirmed').length,
  }))
}
