'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import SessionCardBadge from '@/components/SessionCardBadge'
import { CARD_PRODUCTS } from '@/lib/card-products'
import type { SessionCard, CardType } from '@/types'

interface CardsClientProps {
  initialCards: SessionCard[]
}

export default function CardsClient({ initialCards }: CardsClientProps) {
  const searchParams = useSearchParams()
  const success = searchParams.get('success')
  const cancelled = searchParams.get('cancelled')
  const type = searchParams.get('type')

  const [loading, setLoading] = useState<string | null>(null)
  const [hasActiveCard] = useState(() => {
    // Check if user has active multi-session card (10 or 20 sessions)
    return initialCards.some(
      (c) => c.remaining_sessions > 0 && c.total_sessions >= 10
    )
  })
  const [error, setError] = useState<string | null>(null)

  async function handlePurchase(cardType: CardType) {
    setLoading(cardType)
    setError(null)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardType }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.details || data.error)
        setLoading(null)
        return
      }
      if (data.url) window.location.href = data.url
    } catch {
      setLoading(null)
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 pt-10">
      {/* Header */}
      <div className="mb-6 page-enter">
        <h1 className="text-display text-3xl font-semibold text-stone-900 mb-1">
          Mes cartes
        </h1>
        <p className="text-stone-400 text-sm">
          Achetez des séances et réservez vos cours.
        </p>
      </div>

      {/* Success / Cancel feedback */}
      {success && (
        <div className="card mb-4 bg-sage/10 border-sage/30 text-center py-5">
          <div className="text-2xl mb-2">🎉</div>
          <p className="font-medium text-stone-800">Paiement confirmé !</p>
          <p className="text-sm text-stone-500 mt-1">
            {type === '1'
              ? 'Votre séance unique a été ajoutée.'
              : `Votre carte ${type} séances a été ajoutée.`}
          </p>
        </div>
      )}
      {cancelled && (
        <div className="card mb-4 bg-stone-100 text-center py-4">
          <p className="text-sm text-stone-500">Paiement annulé.</p>
        </div>
      )}

      {/* Active cards */}
      {initialCards.length > 0 && (
        <div className="mb-8 animate-slide-up animate-stagger-1">
          <h2 className="text-sm font-medium text-stone-500 uppercase tracking-wide mb-3">
            Mes cartes actives
          </h2>
          <div className="space-y-3">
            {initialCards.map((card) => (
              <SessionCardBadge key={card.id} card={card} />
            ))}
          </div>
        </div>
      )}

      {/* Card limit warning - affects both single sessions and multi-session cards */}
      {hasActiveCard && (
        <div className="card mb-8 bg-blue-50 border-blue-200 animate-slide-up animate-stagger-2">
          <p className="text-sm text-stone-700 font-medium mb-1">Limite de carte atteinte</p>
          <p className="text-xs text-stone-500">
            Utilisez vos séances restantes avant d'acheter de nouvelles séances ou une nouvelle carte.
          </p>
        </div>
      )}

      {/* Single session option */}
      {CARD_PRODUCTS.filter(p => p.type === '1').map((product) => (
        <div key={product.type} className="mb-8 animate-slide-up animate-stagger-3">
          <h2 className="text-sm font-medium text-stone-500 uppercase tracking-wide mb-3">
            Séance unique
          </h2>
          <div className="card">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="font-semibold text-stone-900">{product.label}</div>
                <div className="text-sm text-stone-500 mt-0.5">{product.description}</div>
              </div>
              <div className="text-right flex-shrink-0 ml-3">
                <div className="text-display text-2xl font-semibold text-stone-900">
                  {product.price}€
                </div>
                <div className="text-xs text-stone-400">15€ / séance</div>
              </div>
            </div>

            <button
              onClick={() => handlePurchase(product.type)}
              disabled={loading !== null || hasActiveCard}
              className="btn-secondary disabled:opacity-60"
            >
              {loading === product.type ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Redirection…
                </>
              ) : hasActiveCard ? (
                'Carte active existante'
              ) : (
                `Acheter — ${product.price}€`
              )}
            </button>
          </div>
        </div>
      ))}

      {/* Multi-session cards */}
      <div className="animate-slide-up animate-stagger-4">
        <h2 className="text-sm font-medium text-stone-500 uppercase tracking-wide mb-3">
          Cartes de séances
        </h2>

        {/* Validation error */}
        {error && (
          <div className="card mb-4 bg-red-50 border-red-200">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <div className="space-y-3">
          {CARD_PRODUCTS.filter(p => p.type !== '1').map((product) => (
            <div
              key={product.type}
              className={`card relative ${product.popular ? 'border-terra/30 ring-1 ring-terra/20' : ''}`}
            >
              {product.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1 bg-terra text-white text-[11px] font-medium px-3 py-1 rounded-full shadow-sm">
                    ✨ La plus choisie
                  </span>
                </div>
              )}

              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="font-semibold text-stone-900">{product.label}</div>
                  <div className="text-sm text-stone-500 mt-0.5">{product.description}</div>
                </div>
                <div className="text-right flex-shrink-0 ml-3">
                  <div className="text-display text-2xl font-semibold text-stone-900">
                    {product.price}€
                  </div>
                  <div className="text-xs text-stone-400">{product.sessions === 10 ? '12€' : '11€'} / séance</div>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-4">
                {Array.from({ length: Math.min(product.sessions, 10) }).map((_, i) => (
                  <div
                    key={i}
                    className={`flex-1 h-1.5 rounded-full ${product.popular ? 'bg-terra/30' : 'bg-sage/30'}`}
                  />
                ))}
                {product.sessions > 10 && (
                  <span className="text-xs text-stone-400">×2</span>
                )}
              </div>

              <button
                onClick={() => handlePurchase(product.type)}
                disabled={loading !== null || hasActiveCard}
                className={`${product.popular ? 'btn-primary' : 'btn-secondary'} disabled:opacity-60`}
              >
                {loading === product.type ? (
                  <>
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    Redirection…
                  </>
                ) : hasActiveCard ? (
                  'Carte active existante'
                ) : (
                  `Acheter — ${product.price}€`
                )}
              </button>
            </div>
          ))}
        </div>
      </div>

      <p className="text-center text-xs text-stone-400 mt-8 pb-4">
        Paiement sécurisé par Stripe · Les séances ne sont pas remboursables.
      </p>
    </div>
  )
}
