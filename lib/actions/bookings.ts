'use server'

import { createClient } from '@/lib/supabase/server'
import { sendBookingConfirmation, sendCancellationEmail } from '@/lib/email'
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
  // Filter out bookings where the class was deleted
  return (data ?? []).filter((booking) => booking.class !== null)
}

/**
 * Check if user is eligible for a free trial session
 * Returns true if user has never had a confirmed booking before
 */
export async function isEligibleForTrial(userId?: string) {
  const supabase = await createClient()

  let targetUserId = userId
  if (!targetUserId) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false
    targetUserId = user.id
  }

  // Check if user has any confirmed bookings (past or present)
  const { data: bookings, error } = await supabase
    .from('bookings')
    .select('id')
    .eq('user_id', targetUserId)
    .eq('status', 'confirmed')
    .limit(1)

  if (error) return false

  // User is eligible if they have no confirmed bookings
  return !bookings || bookings.length === 0
}

/**
 * Get count of upcoming bookings by payment method
 * Returns object with counts for each payment method
 */
export async function getUpcomingBookingsCounts(userId?: string) {
  const supabase = await createClient()

  let targetUserId = userId
  if (!targetUserId) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { onSite: 0, card: 0, trial: 0 }
    targetUserId = user.id
  }

  const now = new Date().toISOString()

  const { data: bookings } = await supabase
    .from('bookings')
    .select('payment_method, class:classes(date_time)')
    .eq('user_id', targetUserId)
    .eq('status', 'confirmed')
    .gte('classes.date_time', now)

  if (!bookings) return { onSite: 0, card: 0, trial: 0 }

  const counts = {
    onSite: 0,
    card: 0,
    trial: 0,
  }

  for (const booking of bookings) {
    if (booking.class && (booking.class as unknown as { date_time: string }).date_time > now) {
      if (booking.payment_method === 'on_site') counts.onSite++
      else if (booking.payment_method === 'card') counts.card++
      else if (booking.payment_method === 'trial') counts.trial++
    }
  }

  return counts
}

export async function bookClass(classId: string, paymentMethod: 'card' | 'on_site' | 'trial' = 'card') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  // Get the class info first for date validation and capacity check
  const { data: yogaClass } = await supabase
    .from('classes')
    .select('*, bookings!left(id, status)')
    .eq('id', classId)
    .single()

  if (!yogaClass) return { error: 'Cours introuvable' }
  if (yogaClass.is_cancelled) return { error: 'Ce cours est annulé' }

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

  // Validate trial eligibility if trial payment method
  if (paymentMethod === 'trial') {
    const eligible = await isEligibleForTrial(user.id)
    if (!eligible) {
      return { error: 'Vous avez déjà utilisé votre séance d\'essai gratuite.' }
    }
  }

  // Check booking limits based on payment method
  const bookingCounts = await getUpcomingBookingsCounts(user.id)

  if (paymentMethod === 'on_site') {
    // On-site payment: max 2 bookings in advance
    if (bookingCounts.onSite >= 2) {
      return { error: 'Limite atteinte : vous ne pouvez réserver que 2 cours maximum en paiement sur place.' }
    }
  } else if (paymentMethod === 'card') {
    // Card payment: max 4 bookings in advance
    if (bookingCounts.card >= 4) {
      return { error: 'Limite atteinte : vous ne pouvez réserver que 4 séances maximum à l\'avance.' }
    }

    // Card payment: max 2 weeks in advance
    const classDate = new Date(yogaClass.date_time)
    const twoWeeksFromNow = new Date()
    twoWeeksFromNow.setDate(twoWeeksFromNow.getDate() + 14)

    if (classDate > twoWeeksFromNow) {
      return { error: 'Vous ne pouvez réserver que 2 semaines à l\'avance maximum avec une carte.' }
    }
  } else if (paymentMethod === 'trial') {
    // Trial: same limit as on-site (2 bookings max, but they should only have 1 trial)
    if (bookingCounts.trial >= 1) {
      return { error: 'Vous avez déjà une séance d\'essai en cours.' }
    }
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
      .eq('payment_method', 'card')

    const now = new Date().toISOString()
    const engagedCount = (upcomingBookings ?? []).filter(
      (b) => b.class && (b.class as unknown as { date_time: string }).date_time > now
    ).length

    if (totalOnCards - engagedCount <= 0) {
      return { error: 'Aucune séance disponible sur vos cartes. Achetez une carte pour réserver.' }
    }
  }

  // Check class capacity
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

  // Send confirmation email (non-blocking, with error handling)
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single()

  if (user.email) {
    console.log('[BOOKING] Attempting to send confirmation email to:', user.email)
    console.log('[BOOKING] SMTP_HOST configured:', !!process.env.SMTP_HOST)
    console.log('[BOOKING] Class info:', { title: yogaClass.title, date_time: yogaClass.date_time, location: yogaClass.location })
    console.log('[BOOKING] Booking status:', newStatus, 'Payment method:', paymentMethod)

    if (process.env.SMTP_HOST) {
      try {
        const result = await sendBookingConfirmation({
          to: user.email,
          userName: profile?.full_name ?? user.email,
          yogaClass,
          isWaitlist: newStatus === 'waitlist',
          paymentMethod,
        })
        console.log('[BOOKING] Confirmation email sent successfully to:', user.email)
        console.log('[BOOKING] Email result:', result)
      } catch (err) {
        console.error('[BOOKING] Failed to send confirmation email:', err)
        console.error('[BOOKING] Error details:', JSON.stringify(err, null, 2))
        // Don't fail the booking if email fails
      }
    } else {
      console.warn('[BOOKING] SMTP not configured, skipping email')
    }
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
    console.log('[CANCELLATION] Checking for waitlisted users to promote')
    const { data: waitlisted, error: waitlistError } = await supabase
      .from('bookings')
      .select('id, user_id')
      .eq('class_id', booking.class_id)
      .eq('status', 'waitlist')
      .order('created_at', { ascending: true })
      .limit(1)
      .single()

    if (waitlistError && waitlistError.code !== 'PGRST116') {
      console.error('[CANCELLATION] Error fetching waitlisted user:', waitlistError)
    }

    if (waitlisted) {
      console.log('[CANCELLATION] Promoting waitlisted user:', waitlisted.user_id)
      const { error: promoteError } = await supabase
        .from('bookings')
        .update({ status: 'confirmed' })
        .eq('id', waitlisted.id)

      if (promoteError) {
        console.error('[CANCELLATION] Error promoting waitlisted user:', promoteError)
      } else {
        console.log('[CANCELLATION] Waitlisted user promoted successfully')
      }
    } else {
      console.log('[CANCELLATION] No waitlisted users to promote')
    }
  } else {
    console.log('[CANCELLATION] Session lost, not promoting waitlist')
  }

  // Send cancellation email (non-blocking, with error handling)
  if (user.email) {
    console.log('[CANCELLATION] Attempting to send cancellation email to:', user.email)
    console.log('[CANCELLATION] SMTP_HOST configured:', !!process.env.SMTP_HOST)
    console.log('[CANCELLATION] Class info:', { title: yogaClass.title, date_time: yogaClass.date_time })
    console.log('[CANCELLATION] Session lost:', sessionLost)

    if (process.env.SMTP_HOST) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single()

      try {
        const result = await sendCancellationEmail({
          to: user.email,
          userName: profile?.full_name ?? user.email,
          yogaClass,
          sessionLost,
        })
        console.log('[CANCELLATION] Cancellation email sent successfully to:', user.email)
        console.log('[CANCELLATION] Email result:', result)
      } catch (err) {
        console.error('[CANCELLATION] Failed to send cancellation email:', err)
        console.error('[CANCELLATION] Error details:', JSON.stringify(err, null, 2))
        // Don't fail the cancellation if email fails
      }
    } else {
      console.warn('[CANCELLATION] SMTP not configured, skipping email')
    }
  } else {
    console.warn('[CANCELLATION] No email for user, skipping cancellation email')
  }

  revalidatePath('/classes')
  revalidatePath('/dashboard')
  return { success: true, sessionLost }
}
