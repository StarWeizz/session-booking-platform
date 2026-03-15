'use server'

import { createClient } from '@/lib/supabase/server'
import { sendBookingConfirmation, sendCancellationEmail } from '@/lib/resend'
import { differenceInHours } from 'date-fns'
import { revalidatePath } from 'next/cache'

export async function getUpcomingClasses() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: classes, error } = await supabase
    .from('classes')
    .select(`
      *,
      bookings!left(id, user_id, status, payment_method)
    `)
    .eq('is_cancelled', false)
    .gte('date_time', new Date().toISOString())
    .order('date_time', { ascending: true })
    .limit(20)

  if (error || !classes) return []

  return classes.map((c) => {
    const confirmedBookings = (c.bookings as Array<{id: string, user_id: string, status: string, payment_method: string}>)
      .filter((b) => b.status === 'confirmed')
    const userBooking = user
      ? (c.bookings as Array<{id: string, user_id: string, status: string, payment_method: string}>).find((b) => b.user_id === user.id)
      : undefined

    return {
      ...c,
      booking_count: confirmedBookings.length,
      user_booking: userBooking ?? null,
    }
  })
}

export async function getUserBookings() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('bookings')
    .select(`
      *,
      class:classes(*)
    `)
    .eq('user_id', user.id)
    .eq('status', 'confirmed')
    .gte('classes.date_time', new Date().toISOString())
    .order('created_at', { ascending: false })

  if (error) return []
  return data ?? []
}

export async function bookClass(classId: string, paymentMethod: 'card' | 'on_site' = 'card') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  // Check if user has already cancelled this class - prevent re-booking
  const { data: existingBooking } = await supabase
    .from('bookings')
    .select('status')
    .eq('user_id', user.id)
    .eq('class_id', classId)
    .single()

  if (existingBooking?.status === 'cancelled') {
    return { error: 'Vous avez déjà annulé ce cours. Vous ne pouvez pas le réserver à nouveau.' }
  }

  // Only check for available sessions if payment method is 'card'
  if (paymentMethod === 'card') {
    // Compute effective available sessions (on cards minus upcoming bookings not yet attended)
    const today = new Date().toISOString().split('T')[0]
    const { data: cards } = await supabase
      .from('session_cards')
      .select('remaining_sessions')
      .eq('user_id', user.id)
      .gt('remaining_sessions', 0)
      .or(`expiry_date.is.null,expiry_date.gte.${today}`)

    const totalOnCards = (cards ?? []).reduce((sum, c) => sum + c.remaining_sessions, 0)

    const { data: upcomingBookings } = await supabase
      .from('bookings')
      .select('id, class:classes(date_time)')
      .eq('user_id', user.id)
      .eq('status', 'confirmed')

    const now = new Date().toISOString()
    const engagedCount = (upcomingBookings ?? []).filter(
      (b) => b.class && (b.class as unknown as { date_time: string }).date_time > now
    ).length

    if (totalOnCards - engagedCount <= 0) {
      return { error: 'Aucune séance disponible sur vos cartes. Achetez une carte pour réserver.' }
    }
  }

  // Check class capacity
  const { data: yogaClass } = await supabase
    .from('classes')
    .select('*, bookings!left(id, status)')
    .eq('id', classId)
    .single()

  if (!yogaClass) return { error: 'Cours introuvable' }
  if (yogaClass.is_cancelled) return { error: 'Ce cours est annulé' }

  const confirmedCount = (yogaClass.bookings as Array<{id: string, status: string}>)
    .filter((b) => b.status === 'confirmed').length

  const newStatus = confirmedCount >= yogaClass.max_participants ? 'waitlist' : 'confirmed'

  // Upsert handles the case where a cancelled booking row already exists
  const { error: bookingError } = await supabase
    .from('bookings')
    .upsert(
      { user_id: user.id, class_id: classId, status: newStatus, payment_method: paymentMethod },
      { onConflict: 'user_id,class_id' }
    )

  if (bookingError) return { error: 'Impossible de créer la réservation' }

  // Send confirmation email (non-blocking)
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single()

  // Send confirmation email (non-blocking, with error handling)
  if (user.email && process.env.SMTP_HOST) {
    sendBookingConfirmation({
      to: user.email,
      userName: profile?.full_name ?? user.email,
      yogaClass,
      isWaitlist: newStatus === 'waitlist',
      paymentMethod,
    }).catch((err) => {
      console.error('Failed to send booking confirmation email:', err)
      // Don't fail the booking if email fails
    })
  }

  revalidatePath('/classes')
  revalidatePath('/dashboard')

  if (newStatus === 'waitlist') return { waitlist: true }
  return { success: true }
}

export async function cancelBooking(bookingId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const { data: booking } = await supabase
    .from('bookings')
    .select('*, class:classes(*)')
    .eq('id', bookingId)
    .eq('user_id', user.id)
    .single()

  if (!booking) return { error: 'Réservation introuvable' }
  if (booking.status === 'cancelled') return { error: 'Déjà annulée' }

  const yogaClass = booking.class as any
  const classDate = new Date(yogaClass.date_time)
  const hoursUntilClass = differenceInHours(classDate, new Date())
  // Only lose session if paid by card and less than 24h notice
  const isCardPayment = booking.payment_method === 'card'
  const sessionLost = isCardPayment && hoursUntilClass < 24

  // Update booking status
  const { error: cancelError } = await supabase
    .from('bookings')
    .update({ status: 'cancelled' })
    .eq('id', bookingId)
    .eq('user_id', user.id)

  if (cancelError) return { error: 'Impossible d\'annuler la réservation' }

  // If less than 24h and paid by card, deduct session from card
  if (sessionLost) {
    const { data: usage } = await supabase
      .from('session_usage')
      .select('card_id')
      .eq('booking_id', bookingId)
      .single()

    if (usage) {
      await supabase
        .from('session_cards')
        .update({ remaining_sessions: supabase.rpc('decrement', { x: 1 }) as unknown as number })
        .eq('id', usage.card_id)
    } else {
      // Find oldest active card and deduct
      const { data: card } = await supabase
        .from('session_cards')
        .select('*')
        .eq('user_id', user.id)
        .gt('remaining_sessions', 0)
        .order('created_at', { ascending: true })
        .limit(1)
        .single()

      if (card) {
        await supabase
          .from('session_cards')
          .update({ remaining_sessions: card.remaining_sessions - 1 })
          .eq('id', card.id)

        await supabase.from('session_usage').insert({
          card_id: card.id,
          booking_id: bookingId,
          class_id: booking.class_id,
        })
      }
    }
  }

  // Promote waitlist
  if (!sessionLost) {
    const { data: waitlisted } = await supabase
      .from('bookings')
      .select('id, user_id')
      .eq('class_id', booking.class_id)
      .eq('status', 'waitlist')
      .order('created_at', { ascending: true })
      .limit(1)
      .single()

    if (waitlisted) {
      await supabase
        .from('bookings')
        .update({ status: 'confirmed' })
        .eq('id', waitlisted.id)
    }
  }

  // Send cancellation email (non-blocking, with error handling)
  if (user.email && process.env.SMTP_HOST) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single()

    sendCancellationEmail({
      to: user.email,
      userName: profile?.full_name ?? user.email,
      yogaClass,
      sessionLost,
    }).catch((err) => {
      console.error('Failed to send cancellation email:', err)
      // Don't fail the cancellation if email fails
    })
  }

  revalidatePath('/classes')
  revalidatePath('/dashboard')
  return { success: true, sessionLost }
}
