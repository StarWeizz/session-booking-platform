'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { bookClass, cancelBooking } from '@/lib/actions/bookings'
import type { Class } from '@/types'

interface Props {
  yogaClass: Class
  totalSessions: number
  isTrialEligible?: boolean
  bookingCounts?: { onSite: number; card: number; trial: number }
}

export default function ClassCard({ yogaClass, totalSessions, isTrialEligible = false, bookingCounts }: Props) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success?: boolean; error?: string; waitlist?: boolean; sessionLost?: boolean } | null>(null)
  const [actionType, setActionType] = useState<'book' | 'cancel' | null>(null)

  const date = new Date(yogaClass.date_time)
  const dayName = format(date, 'EEEE', { locale: fr })
  const dayNum = format(date, 'd MMMM', { locale: fr })
  const time = format(date, 'HH:mm')
  const spotsLeft = yogaClass.max_participants - (yogaClass.booking_count ?? 0)
  const isFull = spotsLeft <= 0
  const hasBooking = !!yogaClass.user_booking && yogaClass.user_booking.status === 'confirmed'
  const isWaitlisted = yogaClass.user_booking?.status === 'waitlist'
  const isPast = date < new Date()

  // Check booking limits
  const onSiteLimit = bookingCounts ? bookingCounts.onSite >= 2 : false
  const cardLimit = bookingCounts ? bookingCounts.card >= 4 : false
  const twoWeeksFromNow = new Date()
  twoWeeksFromNow.setDate(twoWeeksFromNow.getDate() + 14)
  const isBeyondTwoWeeks = date > twoWeeksFromNow

  async function handleBook(paymentMethod: 'card' | 'on_site' | 'trial' = 'card') {
    setLoading(true)
    setResult(null)
    setActionType('book')
    const res = await bookClass(yogaClass.id, paymentMethod)
    setResult(res)
    setLoading(false)
  }

  async function handleCancel() {
    if (!yogaClass.user_booking) return
    setLoading(true)
    setResult(null)
    setActionType('cancel')
    const res = await cancelBooking(yogaClass.user_booking.id)
    setResult(res)
    setLoading(false)
  }

  return (
    <div className={`card transition-all duration-200 ${yogaClass.is_cancelled ? 'opacity-50' : ''}`}>
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium text-stone-500 uppercase tracking-wide capitalize">
              {dayName}
            </span>
            <span className="text-xs text-stone-400">{dayNum}</span>
          </div>
          <div className="text-display text-2xl font-semibold text-stone-900">
            {time}
          </div>
          <div className="text-sm text-stone-600 mt-0.5">{yogaClass.title}</div>
          {yogaClass.location && (
            <div className="text-xs text-stone-400 mt-1 flex items-center gap-1">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              {yogaClass.location}
            </div>
          )}
        </div>
        <div className="text-right flex-shrink-0">
          {yogaClass.is_cancelled ? (
            <span className="badge-neutral">Annulé</span>
          ) : isFull ? (
            <span className="badge-neutral">Complet</span>
          ) : (
            <span className={`badge-sage`}>
              {spotsLeft} place{spotsLeft > 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {result?.error && (
        <div className="text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2 mb-3">
          {result.error}
        </div>
      )}
      {!hasBooking && !isWaitlisted && !isPast && (
        <>
          {onSiteLimit && (
            <div className="text-xs text-orange-600 bg-orange-50 rounded-lg px-3 py-2 mb-3">
              Limite atteinte : 2 réservations max en paiement sur place
            </div>
          )}
          {(cardLimit || isBeyondTwoWeeks) && totalSessions > 0 && !isTrialEligible && (
            <div className="text-xs text-orange-600 bg-orange-50 rounded-lg px-3 py-2 mb-3">
              {cardLimit && 'Limite atteinte : 4 réservations max avec carte'}
              {cardLimit && isBeyondTwoWeeks && ' · '}
              {isBeyondTwoWeeks && 'Réservation limitée à 2 semaines à l\'avance'}
            </div>
          )}
        </>
      )}
      {result?.waitlist && (
        <div className="text-sm text-stone-600 bg-stone-50 rounded-xl px-3 py-2 mb-3">
          Vous êtes sur la liste d'attente.
        </div>
      )}
      {result?.success && actionType === 'book' && (
        <div className="text-sm text-sage-dark bg-sage/10 rounded-xl px-3 py-2 mb-3">
          Réservation confirmée ! ✓
        </div>
      )}
      {result?.success && actionType === 'cancel' && (
        <div className="text-sm text-stone-600 bg-stone-50 rounded-xl px-3 py-2 mb-3">
          Réservation annulée {result.sessionLost ? '(séance déduite)' : ''}
        </div>
      )}

      {!yogaClass.is_cancelled && !isPast && (
        <>
          {hasBooking ? (
            <>
              {yogaClass.user_booking?.payment_method === 'on_site' && (
                <div className="text-xs text-stone-500 bg-stone-50 rounded-lg px-3 py-2 mb-2 flex items-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="5" width="20" height="14" rx="2"/>
                    <line x1="2" y1="10" x2="22" y2="10"/>
                  </svg>
                  Paiement sur place
                </div>
              )}
              {yogaClass.user_booking?.payment_method === 'trial' && (
                <div className="text-xs text-sage-dark bg-sage/10 rounded-lg px-3 py-2 mb-2 flex items-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 12v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6m16 0l-8-8-8 8"/>
                  </svg>
                  Séance d'essai gratuite
                </div>
              )}
              <button
                onClick={handleCancel}
                disabled={loading}
                className="btn-secondary text-stone-500 !text-sm !py-3"
              >
                {loading ? 'En cours…' : 'Annuler ma réservation'}
              </button>
            </>
          ) : isWaitlisted ? (
            <button
              onClick={handleCancel}
              disabled={loading}
              className="btn-ghost w-full justify-center text-stone-500"
            >
              {loading ? 'En cours…' : "Quitter la liste d\u2019attente"}
            </button>
          ) : (
            <div className="space-y-2">
              {/* Bouton principal : essai gratuit ou réservation avec carte */}
              {isTrialEligible ? (
                <button
                  onClick={() => handleBook('trial')}
                  disabled={loading}
                  className="btn-primary w-full"
                >
                  {loading ? 'Réservation…' : isFull ? 'Liste d\'attente (essai)' : '🎁 Séance d\'essai gratuite'}
                </button>
              ) : totalSessions > 0 ? (
                <button
                  onClick={() => handleBook('card')}
                  disabled={loading || cardLimit || isBeyondTwoWeeks}
                  className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Réservation…' : cardLimit ? 'Limite atteinte' : isBeyondTwoWeeks ? 'Trop tôt' : isFull ? 'Liste d\'attente' : 'Réserver avec la carte'}
                </button>
              ) : (
                <button
                  onClick={() => handleBook('on_site')}
                  disabled={loading || onSiteLimit}
                  className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'En cours…' : onSiteLimit ? 'Limite atteinte' : 'Paiement sur place'}
                </button>
              )}

              {/* Bouton paiement sur place discret (seulement si pas le bouton principal) */}
              {(isTrialEligible || totalSessions > 0) && (
                <button
                  onClick={() => handleBook('on_site')}
                  disabled={loading || onSiteLimit}
                  className="w-full text-center text-xs text-stone-500 hover:text-stone-700 py-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'En cours…' : onSiteLimit ? 'Limite atteinte (2 max)' : 'ou payer sur place'}
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
