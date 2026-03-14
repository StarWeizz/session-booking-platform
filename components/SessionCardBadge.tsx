import type { SessionCard } from '@/types'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface Props {
  card: SessionCard
  compact?: boolean
}

export default function SessionCardBadge({ card, compact = false }: Props) {
  const percentage = (card.remaining_sessions / card.total_sessions) * 100
  const isLow = card.remaining_sessions <= 2
  const isEmpty = card.remaining_sessions === 0

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${isEmpty ? 'bg-red-400' : isLow ? 'bg-orange-400' : 'bg-sage'}`} />
        <span className="text-sm text-stone-600">
          {card.remaining_sessions}/{card.total_sessions} séances
        </span>
      </div>
    )
  }

  return (
    <div className={`rounded-3xl p-4 border ${isEmpty ? 'border-stone-200 bg-stone-50' : 'border-stone-100 bg-white'} shadow-warm`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="text-xs text-stone-500 uppercase tracking-wide mb-0.5">
            Carte {card.total_sessions} séances
          </div>
          <div className={`text-display text-3xl font-semibold ${isEmpty ? 'text-stone-400' : 'text-stone-900'}`}>
            {card.remaining_sessions}
            <span className="text-base font-normal text-stone-400 ml-1">/ {card.total_sessions}</span>
          </div>
        </div>
        {isEmpty ? (
          <span className="badge-neutral">Épuisée</span>
        ) : isLow ? (
          <span className="badge-terra">Bientôt vide</span>
        ) : (
          <span className="badge-sage">Active</span>
        )}
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            isEmpty ? 'w-0' : isLow ? 'bg-orange-400' : 'bg-sage'
          }`}
          style={{ width: `${Math.max(0, percentage)}%` }}
        />
      </div>

      <div className="flex justify-between mt-2">
        <span className="text-xs text-stone-400">
          Acheté le {format(new Date(card.created_at), 'd MMM yyyy', { locale: fr })}
        </span>
        {card.expiry_date && (
          <span className="text-xs text-stone-400">
            Expire le {format(new Date(card.expiry_date), 'd MMM yyyy', { locale: fr })}
          </span>
        )}
      </div>
    </div>
  )
}
