import { createClient } from '@/lib/supabase/server'
import { getProfile, signOut } from '@/lib/actions/auth'
import { getUserBookings } from '@/lib/actions/bookings'
import { getUserCards, getTotalRemainingSession } from '@/lib/actions/cards'
import BookingItem from '@/components/BookingItem'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Mon espace' }

export default async function DashboardPage() {
  const [profile, bookings, cards, totalSessions] = await Promise.all([
    getProfile(),
    getUserBookings(),
    getUserCards(),
    getTotalRemainingSession(),
  ])

  const firstName = profile?.full_name?.split(' ')[0] ?? 'vous'
  const upcomingBookings = bookings.filter(
    (b) => new Date(b.class.date_time) > new Date()
  )

  return (
    <div className="max-w-md mx-auto px-4 pt-10">
      {/* Header */}
      <div className="flex items-start justify-between mb-8 page-enter">
        <div>
          <p className="text-stone-400 text-sm mb-1">Bonjour,</p>
          <h1 className="text-display text-3xl font-semibold text-stone-900 capitalize">
            {firstName} 🌿
          </h1>
        </div>
        <form action={signOut}>
          <button type="submit" className="btn-ghost text-stone-400 -mt-1">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        </form>
      </div>

      {/* Sessions remaining card */}
      <div
        className="rounded-3xl p-6 mb-6 text-white relative overflow-hidden animate-slide-up animate-stagger-1"
        style={{
          background: 'linear-gradient(135deg, #C4715A 0%, #A85A45 100%)',
        }}
      >
        <div
          className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-20 pointer-events-none"
          style={{
            background: 'radial-gradient(circle, white 0%, transparent 70%)',
            transform: 'translate(20%, -20%)',
          }}
        />
        <div className="relative">
          <div className="text-white/70 text-xs uppercase tracking-wide mb-1">Séances restantes</div>
          <div className="text-display text-5xl font-semibold mb-1">{totalSessions}</div>
          <div className="text-white/70 text-sm">
            {totalSessions === 0
              ? 'Achetez une carte pour réserver'
              : `${cards.length} carte${cards.length > 1 ? 's' : ''} active${cards.length > 1 ? 's' : ''}`}
          </div>

          {totalSessions === 0 && (
            <Link
              href="/cards"
              className="inline-flex items-center gap-2 bg-white text-terra text-sm font-medium px-4 py-2 rounded-xl mt-4"
            >
              Acheter une carte
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="5" y1="12" x2="19" y2="12"/>
                <polyline points="12 5 19 12 12 19"/>
              </svg>
            </Link>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3 mb-6 animate-slide-up animate-stagger-2">
        <Link href="/classes" className="card text-center py-5 hover:shadow-warm-lg transition-shadow">
          <div className="text-2xl mb-2">📅</div>
          <div className="font-medium text-stone-800 text-sm">Voir les cours</div>
          <div className="text-xs text-stone-400 mt-0.5">Réserver</div>
        </Link>
        <Link href="/cards" className="card text-center py-5 hover:shadow-warm-lg transition-shadow">
          <div className="text-2xl mb-2">🎴</div>
          <div className="font-medium text-stone-800 text-sm">Mes cartes</div>
          <div className="text-xs text-stone-400 mt-0.5">Acheter / gérer</div>
        </Link>
      </div>

      {/* Upcoming bookings */}
      <div className="animate-slide-up animate-stagger-3">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-display text-xl font-semibold text-stone-900">
            Mes prochains cours
          </h2>
          <Link href="/classes" className="text-xs text-terra hover:underline">
            Voir tout
          </Link>
        </div>

        {upcomingBookings.length === 0 ? (
          <div className="card text-center py-8">
            <div className="text-3xl mb-3">🧘</div>
            <p className="text-stone-500 text-sm mb-4">Aucun cours réservé pour l'instant.</p>
            <Link href="/classes" className="btn-primary !py-3 !text-sm">
              Réserver un cours
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingBookings.slice(0, 3).map((booking) => (
              <BookingItem key={booking.id} booking={booking as Parameters<typeof BookingItem>[0]['booking']} />
            ))}
            {upcomingBookings.length > 3 && (
              <Link href="/classes" className="btn-ghost justify-center w-full text-stone-500">
                +{upcomingBookings.length - 3} autres réservations
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Active cards summary */}
      {cards.length > 0 && (
        <div className="mt-6 animate-slide-up animate-stagger-4">
          <h2 className="text-display text-xl font-semibold text-stone-900 mb-3">
            Mes cartes
          </h2>
          <div className="space-y-2">
            {cards.slice(0, 2).map((card) => (
              <div key={card.id} className="card-sm flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-stone-800">Carte {card.total_sessions} séances</div>
                  <div className="text-xs text-stone-400 mt-0.5">
                    {card.remaining_sessions} restante{card.remaining_sessions > 1 ? 's' : ''}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-display text-2xl font-semibold text-stone-800">
                    {card.remaining_sessions}
                    <span className="text-sm font-normal text-stone-400">/{card.total_sessions}</span>
                  </div>
                </div>
              </div>
            ))}
            {cards.length > 2 && (
              <Link href="/cards" className="btn-ghost justify-center w-full text-stone-500">
                Voir toutes mes cartes
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
