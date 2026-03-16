import Stripe from 'stripe'
import { CARD_PRODUCTS } from './card-products'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
})

export { CARD_PRODUCTS }
