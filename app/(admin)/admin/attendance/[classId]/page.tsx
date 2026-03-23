import { getClassWithParticipants } from '@/lib/actions/classes'
import { confirmAttendance } from '@/lib/actions/admin'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import Link from 'next/link'
import { revalidatePath } from 'next/cache'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Admin — Présences' }

// Revalidate this page every 30 seconds
export const revalidate = 30

interface Booking {
  id: string
  status: string
  created_at: string
  profile: { id: string; full_name: string | null } | null
}

export default async function AttendancePage({
  params,
}: {
  params: Promise<{ classId: string }>
}) {
  const { classId } = await params
  const yogaClass = await getClassWithParticipants(classId)

  if (!yogaClass) {
    return (
      <div className="text-center py-12">
        <p className="text-stone-500">Cours introuvable.</p>
        <Link href="/admin/classes" className="text-terra hover:underline mt-2 inline-block">
          ← Retour aux cours
        </Link>
      </div>
    )
  }

  const confirmedBookings = (yogaClass.bookings as Booking[]).filter((b) => b.status === 'confirmed')
  const waitlistBookings = (yogaClass.bookings as Booking[]).filter((b) => b.status === 'waitlist')

  async function handleConfirm(bookingId: string) {
    'use server'
    await confirmAttendance({ bookingId, classId })
    revalidatePath(`/admin/attendance/${classId}`)
  }

  return (
    <div>
      <Link href="/admin/classes" className="btn-ghost text-stone-400 -ml-2 mb-6 inline-flex">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
        Retour aux cours
      </Link>

      <div className="mb-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-display text-3xl font-semibold text-stone-900 mb-1">
              {yogaClass.title}
            </h1>
            <p className="text-stone-500 text-sm capitalize">
              {format(new Date(yogaClass.date_time), "EEEE d MMMM 'à' HH'h'mm", { locale: fr })}
              {' · '}{yogaClass.location}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="badge-neutral text-sm">
              {confirmedBookings.length}/{yogaClass.max_participants} inscrits
            </span>
          </div>
        </div>
      </div>

      {/* Confirmed participants */}
      <div className="card mb-6">
        <h2 className="font-semibold text-stone-900 mb-4">
          Participants confirmés ({confirmedBookings.length})
        </h2>

        {confirmedBookings.length === 0 ? (
          <p className="text-stone-400 text-sm py-4 text-center">Aucun participant inscrit.</p>
        ) : (
          <div className="space-y-2">
            {confirmedBookings.map((booking) => (
              <div
                key={booking.id}
                className="flex items-center justify-between py-3 border-b border-stone-100 last:border-0"
              >
                <div>
                  <div className="font-medium text-stone-900">
                    {booking.profile?.full_name ?? '(sans nom)'}
                  </div>
                  <div className="text-xs text-stone-400 mt-0.5">
                    Inscrit le {format(new Date(booking.created_at), 'd MMM', { locale: fr })}
                  </div>
                </div>

                <form>
                  <button
                    formAction={async () => {
                      'use server'
                      await handleConfirm(booking.id)
                    }}
                    className="btn-primary !w-auto !py-2 !px-4 !text-sm"
                  >
                    ✓ Confirmer présence
                  </button>
                </form>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Waitlist */}
      {waitlistBookings.length > 0 && (
        <div className="card">
          <h2 className="font-semibold text-stone-900 mb-4">
            Liste d'attente ({waitlistBookings.length})
          </h2>
          <div className="space-y-2">
            {waitlistBookings.map((booking, i) => (
              <div key={booking.id} className="flex items-center justify-between py-3 border-b border-stone-100 last:border-0">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-stone-400 w-5">#{i + 1}</span>
                  <div>
                    <div className="font-medium text-stone-700">
                      {booking.profile?.full_name ?? '(sans nom)'}
                    </div>
                  </div>
                </div>
                <span className="badge-neutral">En attente</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
