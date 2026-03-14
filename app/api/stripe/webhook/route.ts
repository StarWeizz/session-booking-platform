import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type Stripe from 'stripe'

export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('Webhook signature error:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.CheckoutSession
    const { userId, cardType, sessions } = session.metadata!

    const supabase = await createAdminClient()

    // Create session card
    const { error: cardError } = await supabase.from('session_cards').insert({
      user_id: userId,
      total_sessions: parseInt(sessions),
      remaining_sessions: parseInt(sessions),
      purchase_price: (session.amount_total ?? 0) / 100,
      stripe_payment_id: session.payment_intent as string,
    })

    if (cardError) {
      console.error('Error creating session card:', cardError)
      return NextResponse.json({ error: 'Card creation failed' }, { status: 500 })
    }

    // Record payment
    await supabase.from('payments').insert({
      user_id: userId,
      stripe_session_id: session.id,
      stripe_payment_intent_id: session.payment_intent as string,
      amount: (session.amount_total ?? 0) / 100,
      currency: session.currency ?? 'eur',
      status: 'completed',
      card_type: cardType,
    })
  }

  return NextResponse.json({ received: true })
}
