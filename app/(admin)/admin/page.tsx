import { getAttendanceStats } from '@/lib/actions/admin'
import { getAllClassesAdmin } from '@/lib/actions/classes'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Admin — Dashboard' }

// Revalidate this page every 30 seconds
export const revalidate = 30

export default async function AdminDashboardPage() {
  const [stats, classes] = await Promise.all([
    getAttendanceStats(),
    getAllClassesAdmin(),
  ])

  const nextClasses = classes
    .filter((c) => new Date(c.date_time) > new Date() && !c.is_cancelled)
    .slice(0, 5)

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-display text-3xl font-semibold text-stone-900 mb-1">Tableau de bord</h1>
        <p className="text-stone-500 text-sm">Vue d'ensemble du studio</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Clients', value: stats.clientCount, icon: '👥', href: '/admin/clients' },
          { label: 'Réservations (30j)', value: stats.bookingsThisMonth, icon: '📅', href: '/admin/classes' },
          { label: 'Séances vendues', value: stats.totalSessions, icon: '🎴', href: '/admin/cards' },
          { label: 'Séances utilisées', value: stats.usedSessions, icon: '✓', href: '/admin/cards' },
        ].map((stat) => (
          <Link key={stat.label} href={stat.href} className="card hover:shadow-warm-lg transition-shadow">
            <div className="text-2xl mb-2">{stat.icon}</div>
            <div className="text-display text-3xl font-semibold text-stone-900">{stat.value}</div>
            <div className="text-xs text-stone-500 mt-1">{stat.label}</div>
          </Link>
        ))}
      </div>

      {/* Upcoming classes */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-stone-900">Prochains cours</h2>
          <Link href="/admin/classes" className="text-xs text-terra hover:underline">
            Gérer les cours →
          </Link>
        </div>

        {nextClasses.length === 0 ? (
          <p className="text-stone-400 text-sm py-4 text-center">Aucun cours planifié.</p>
        ) : (
          <div className="space-y-2">
            {nextClasses.map((c) => (
              <div key={c.id} className="flex items-center justify-between py-3 border-b border-stone-100 last:border-0">
                <div>
                  <div className="font-medium text-stone-800 text-sm">{c.title}</div>
                  <div className="text-xs text-stone-400 mt-0.5 capitalize">
                    {format(new Date(c.date_time), "EEEE d MMMM 'à' HH'h'mm", { locale: fr })}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`badge-neutral text-xs`}>
                    {c.booking_count}/{c.max_participants}
                  </span>
                  <Link
                    href={`/admin/attendance/${c.id}`}
                    className="text-xs text-terra hover:underline"
                  >
                    Présences
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        <Link href="/admin/classes" className="btn-secondary mt-4 !text-sm !py-2.5">
          + Créer un cours
        </Link>
      </div>
    </div>
  )
}
