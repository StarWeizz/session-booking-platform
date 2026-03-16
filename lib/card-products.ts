import type { CardProduct } from '@/types'

export const CARD_PRODUCTS: CardProduct[] = [
  {
    type: '1',
    label: 'Séance unique',
    sessions: 1,
    price: 15,
    priceId: process.env.STRIPE_PRICE_1_SESSION || process.env.NEXT_PUBLIC_STRIPE_PRICE_1_SESSION || '',
    description: 'Parfait pour essayer',
  },
  {
    type: '10',
    label: 'Carte 10 séances',
    sessions: 10,
    price: 120,
    priceId: process.env.STRIPE_PRICE_10_SESSIONS || process.env.NEXT_PUBLIC_STRIPE_PRICE_10_SESSIONS || '',
    description: 'Idéale pour commencer',
  },
  {
    type: '20',
    label: 'Carte 20 séances',
    sessions: 20,
    price: 220,
    priceId: process.env.STRIPE_PRICE_20_SESSIONS || process.env.NEXT_PUBLIC_STRIPE_PRICE_20_SESSIONS || '',
    description: 'La plus économique',
    popular: true,
  },
]
