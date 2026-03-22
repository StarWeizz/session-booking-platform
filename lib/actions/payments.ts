'use server'

import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'
import type { Payment } from '@/types'

export interface InvoiceData extends Payment {
  receipt_url: string | null
}

export async function getUserInvoices(): Promise<InvoiceData[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  // Get all completed payments for the user
  const { data: payments, error } = await supabase
    .from('payments')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'completed')
    .order('created_at', { ascending: false })

  if (error || !payments) return []

  // Fetch receipt URLs from Stripe for each payment
  const invoicesWithReceipts = await Promise.all(
    payments.map(async (payment) => {
      let receipt_url: string | null = null

      try {
        if (payment.stripe_payment_intent_id) {
          // Retrieve the payment intent to get the charge
          const paymentIntent = await stripe.paymentIntents.retrieve(
            payment.stripe_payment_intent_id
          )

          // Get the charge ID (latest_charge is either a string or a Charge object)
          const chargeId = typeof paymentIntent.latest_charge === 'string'
            ? paymentIntent.latest_charge
            : paymentIntent.latest_charge?.id

          if (chargeId) {
            // Retrieve the charge to get the receipt URL
            const charge = await stripe.charges.retrieve(chargeId)
            receipt_url = charge.receipt_url
          }
        }
      } catch (err) {
        console.error(`Error fetching receipt for payment ${payment.id}:`, err)
      }

      return {
        ...payment,
        receipt_url,
      }
    })
  )

  return invoicesWithReceipts
}
