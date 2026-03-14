'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import SessionCardBadge from '@/components/SessionCardBadge'
import type { SessionCard } from '@/types'

const CARD_PRODUCTS = [
  {
    type: '10' as const,
    label: 'Carte 10 séances',
    sessions: 10,
    price: 120,
    description: 'Parfaite pour commencer',
    pricePerSession: '12€ / séance',
  },
  {
    type: '20' as const,
    label: 'Carte 20 séances',
    sessions: 20,
    price: 220,
    description: 'La plus économique',
    pricePerSession: '11€ / séance',
    popular: true,
  },
]

export default function CardsPage() {
  const searchParams = useSearchParams()
  const success = searchParams.get('success')
  const cancelled = searchParams.get('cancelled')
  const type = searchParams.get('type')

  const [cards, setCards] = useState<SessionCard[]>([])
  const [loading, setLoading] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/user/cards').then((r) => r.json()).then(setCards).catch(console.error)
  }, [success])

  async function handlePurchase(cardType: '10' | '20') {
    setLoading(cardType)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardType }),
      })
      const data = await res.json()
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
          <p className="font-medium text-stone-800">
            Paiement confirmé !
          </p>
          <p className="text-sm text-stone-500 mt-1">
            Votre carte {type === '10' ? '10 séances' : '20 séances'} a été ajoutée.
          </p>
        </div>
      )}
      {cancelled && (
        <div className="card mb-4 bg-stone-100 text-center py-4">
          <p className="text-sm text-stone-500">Paiement annulé.</p>
        </div>
      )}

      {/* Active cards */}
      {cards.length > 0 && (
        <div className="mb-8 animate-slide-up animate-stagger-1">
          <h2 className="text-sm font-medium text-stone-500 uppercase tracking-wide mb-3">
            Mes cartes actives
          </h2>
          <div className="space-y-3">
            {cards.map((card) => (
              <SessionCardBadge key={card.id} card={card} />
            ))}
          </div>
        </div>
      )}

      {/* Purchase options */}
      <div className="animate-slide-up animate-stagger-2">
        <h2 className="text-sm font-medium text-stone-500 uppercase tracking-wide mb-3">
          Acheter une carte
        </h2>
        <div className="space-y-3">
          {CARD_PRODUCTS.map((product) => (
            <div
              key={product.type}
              className={`card relative ${product.popular ? 'border-terra/30 ring-1 ring-terra/20' : ''}`}
            >
              {product.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="badge-terra text-[11px] px-3">La plus choisie</span>
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
                  <div className="text-xs text-stone-400">{product.pricePerSession}</div>
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
                disabled={loading !== null}
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
