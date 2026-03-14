export type UserRole = 'user' | 'admin'

export interface Profile {
  id: string
  full_name: string | null
  phone: string | null
  role: UserRole
  created_at: string
  updated_at: string
}

export interface Class {
  id: string
  title: string
  date_time: string
  duration_minutes: number
  max_participants: number
  location: string
  description: string | null
  is_cancelled: boolean
  created_at: string
  // computed
  booking_count?: number
  user_booking?: Booking | null
}

export type BookingStatus = 'confirmed' | 'cancelled' | 'waitlist'

export interface Booking {
  id: string
  user_id: string
  class_id: string
  status: BookingStatus
  created_at: string
  // joined
  class?: Class
  profile?: Profile
}

export interface SessionCard {
  id: string
  user_id: string
  total_sessions: number
  remaining_sessions: number
  purchase_price: number | null
  expiry_date: string | null
  stripe_payment_id: string | null
  created_at: string
  // joined
  profile?: Profile
}

export interface SessionUsage {
  id: string
  card_id: string
  booking_id: string | null
  class_id: string
  used_at: string
}

export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded'
export type CardType = '10' | '20'

export interface Payment {
  id: string
  user_id: string
  stripe_session_id: string | null
  stripe_payment_intent_id: string | null
  amount: number
  currency: string
  status: PaymentStatus
  card_type: CardType
  created_at: string
}

export interface CardProduct {
  type: CardType
  label: string
  sessions: number
  price: number
  priceId: string
  description: string
  popular?: boolean
}
