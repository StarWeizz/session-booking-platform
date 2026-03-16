import { getUpcomingClasses, isEligibleForTrial } from '@/lib/actions/bookings'
import { getTotalRemainingSession } from '@/lib/actions/cards'
import ClassCard from '@/components/ClassCard'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Cours disponibles' }
export const revalidate = 60

function groupByDate(classes: Awaited<ReturnType<typeof getUpcomingClasses>>) {
  const groups = new Map<string, typeof classes>()
  for (const c of classes) {
    const key = format(new Date(c.date_time), 'yyyy-MM-dd')
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(c)
  }
  return groups
}

export default async function ClassesPage() {
  const [classes, totalSessions, isTrialEligible] = await Promise.all([
    getUpcomingClasses(),
    getTotalRemainingSession(),
    isEligibleForTrial(),
  ])

  const groups = groupByDate(classes)

  return (
    <div className="max-w-md mx-auto px-4 pt-10">
      {/* Header */}
      <div className="mb-6 page-enter">
        <h1 className="text-display text-3xl font-semibold text-stone-900 mb-1">
          Cours à venir
        </h1>
        <p className="text-stone-400 text-sm">
          {isTrialEligible ? (
            <>🎁 Votre <strong className="text-sage-dark">première séance est gratuite</strong> !</>
          ) : totalSessions > 0 ? (
            <>Vous avez <strong className="text-stone-700">{totalSessions} séance{totalSessions > 1 ? 's' : ''}</strong> disponible{totalSessions > 1 ? 's' : ''}.</>
          ) : (
            <>Aucune séance disponible. <Link href="/cards" className="text-terra underline">Acheter une carte</Link></>
          )}
        </p>
      </div>

      {/* Classes grouped by date */}
      {classes.length === 0 ? (
        <div className="card text-center py-10">
          <div className="text-3xl mb-3">📅</div>
          <p className="text-stone-500 text-sm">
            Aucun cours planifié pour l'instant.<br />
            Revenez bientôt !
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Array.from(groups.entries()).map(([dateKey, dayClasses], groupIndex) => {
            const date = new Date(dateKey)
            return (
              <div key={dateKey} className={`animate-slide-up`} style={{ animationDelay: `${groupIndex * 60}ms` }}>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-xs font-medium text-stone-500 uppercase tracking-wider capitalize">
                    {format(date, 'EEEE', { locale: fr })}
                  </span>
                  <span className="text-xs text-stone-400">
                    {format(date, 'd MMMM', { locale: fr })}
                  </span>
                  <div className="flex-1 h-px bg-stone-200" />
                </div>
                <div className="space-y-3">
                  {dayClasses.map((c) => (
                    <ClassCard
                      key={c.id}
                      yogaClass={c as Parameters<typeof ClassCard>[0]['yogaClass']}
                      totalSessions={totalSessions}
                      isTrialEligible={isTrialEligible}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
