'use client'

import { useState } from 'react'
import { format, differenceInHours } from 'date-fns'
import { fr } from 'date-fns/locale'
import { cancelBooking } from '@/lib/actions/bookings'
import type { Booking } from '@/types'

interface Props {
  booking: Booking & { class: { date_time: string; title: string; location: string } }
}

export default function BookingItem({ booking }: Props) {
  const [loading, setLoading] = useState(false)
  const [cancelled, setCancelled] = useState(false)
  const [result, setResult] = useState<{ sessionLost?: boolean } | null>(null)

  const date = new Date(booking.class.date_time)
  const hoursUntil = differenceInHours(date, new Date())
  const canCancelFree = hoursUntil >= 24

  async function handleCancel() {
    setLoading(true)
    const res = await cancelBooking(booking.id)
    if (res.success) {
      setCancelled(true)
      setResult(res)
    }
    setLoading(false)
  }

  if (cancelled) {
    return (
      <div className="card-sm opacity-60">
        <div className="text-sm text-stone-500">
          Annulée
          {result?.sessionLost && ' — séance déduite (moins de 24h)'}
        </div>
      </div>
    )
  }

  return (
    <div className="card-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-stone-500 capitalize">
              {format(date, 'EEEE d MMMM', { locale: fr })}
            </span>
          </div>
          <div className="font-medium text-stone-900">
            {format(date, 'HH:mm')} — {booking.class.title}
          </div>
          <div className="text-xs text-stone-400 mt-0.5">{booking.class.location}</div>
        </div>

        <div className="flex-shrink-0 text-right">
          {hoursUntil < 2 ? (
            <span className="badge-terra">Bientôt</span>
          ) : hoursUntil < 24 ? (
            <span className="badge-neutral">Aujourd'hui</span>
          ) : (
            <span className="badge-sage">Confirmé</span>
          )}
        </div>
      </div>

      {hoursUntil > 0 && (
        <div className="mt-3 pt-3 border-t border-stone-100">
          {!canCancelFree && (
            <p className="text-xs text-orange-600 mb-2">
              Annulation tardive — la séance sera déduite.
            </p>
          )}
          <button
            onClick={handleCancel}
            disabled={loading}
            className="text-xs text-stone-500 hover:text-red-500 transition-colors"
          >
            {loading ? 'Annulation…' : 'Annuler cette réservation'}
          </button>
        </div>
      )}
    </div>
  )
}
