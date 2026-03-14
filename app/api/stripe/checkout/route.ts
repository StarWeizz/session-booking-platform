import { createClient } from '@/lib/supabase/server'
import { stripe, CARD_PRODUCTS } from '@/lib/stripe'
import { NextResponse } from 'next/server'
import type { CardType } from '@/types'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const { cardType } = await request.json() as { cardType: CardType }
  const product = CARD_PRODUCTS.find((p) => p.type === cardType)

  if (!product) {
    return NextResponse.json({ error: 'Produit invalide' }, { status: 400 })
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL!

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer_email: user.email,
    line_items: [
      {
        price: product.priceId,
        quantity: 1,
      },
    ],
    metadata: {
      userId: user.id,
      cardType,
      sessions: product.sessions.toString(),
    },
    success_url: `${siteUrl}/cards?success=true&type=${cardType}`,
    cancel_url: `${siteUrl}/cards?cancelled=true`,
    locale: 'fr',
  })

  return NextResponse.json({ url: session.url })
}
