'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClass, cancelClass } from '@/lib/actions/classes'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import Link from 'next/link'
import SearchBar from '@/components/admin/SearchBar'
import FilterBar, { type Filter } from '@/components/admin/FilterBar'
import Pagination from '@/components/admin/Pagination'
import StatusBadge, { getClassStatusBadge } from '@/components/admin/StatusBadge'

interface ClassRow {
  id: string
  title: string
  date_time: string
  max_participants: number
  location: string
  is_cancelled: boolean
  booking_count: number
}

interface ClassesClientProps {
  initialClasses: ClassRow[]
  totalCount: number
  page: number
  limit: number
}

export default function ClassesClient({
  initialClasses,
  totalCount,
  page,
  limit
}: ClassesClientProps) {
  const [classes, setClasses] = useState<ClassRow[]>(initialClasses)
  const [showForm, setShowForm] = useState(false)
  const [formState, setFormState] = useState<'idle' | 'loading' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const router = useRouter()

  // Sync classes when props change
  useEffect(() => {
    setClasses(initialClasses)
  }, [initialClasses])

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setFormState('loading')
    const formData = new FormData(e.currentTarget)
    const result = await createClass(formData)
    if (result.error) {
      setErrorMsg(result.error)
      setFormState('error')
    } else {
      setShowForm(false)
      setFormState('idle')
      router.refresh()
    }
  }

  async function handleCancel(classId: string) {
    if (!confirm('Annuler ce cours ? Les élèves seront notifiés.')) return
    await cancelClass(classId)
    router.refresh()
  }

  const filters: Filter[] = [
    {
      name: 'status',
      label: 'Statut',
      placeholder: 'Tous',
      options: [
        { value: 'upcoming', label: 'À venir' },
        { value: 'past', label: 'Passés' },
        { value: 'cancelled', label: 'Annulés' }
      ]
    },
    {
      name: 'occupancy',
      label: 'Disponibilité',
      placeholder: 'Tous',
      options: [
        { value: 'available', label: 'Places disponibles' },
        { value: 'full', label: 'Complet' }
      ]
    }
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-display text-3xl font-semibold text-stone-900 mb-1">Cours</h1>
          <p className="text-stone-500 text-sm">{totalCount} cours au total</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary !w-auto !py-2.5 !px-5"
        >
          + Nouveau cours
        </button>
      </div>

      {showForm && (
        <div className="card mb-6 border-terra/20">
          <h2 className="font-semibold text-stone-900 mb-4">Nouveau cours</h2>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="label">Titre</label>
              <input name="title" className="input" defaultValue="Cours de yoga" required />
            </div>
            <div>
              <label className="label">Date</label>
              <input name="date" type="date" className="input" required />
            </div>
            <div>
              <label className="label">Heure</label>
              <input name="time" type="time" className="input" defaultValue="18:00" required />
            </div>
            <div>
              <label className="label">Durée (minutes)</label>
              <input name="duration_minutes" type="number" className="input" defaultValue="60" min="15" max="240" />
            </div>
            <div>
              <label className="label">Nombre de places</label>
              <input name="max_participants" type="number" className="input" defaultValue="10" min="1" max="50" />
            </div>
            <div>
              <label className="label">Lieu</label>
              <input name="location" className="input" defaultValue="Studio" required />
            </div>
            <div className="md:col-span-2">
              <label className="label">Description (optionnel)</label>
              <textarea name="description" className="input" rows={2} />
            </div>

            {formState === 'error' && (
              <div className="md:col-span-2 text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">
                {errorMsg}
              </div>
            )}

            <div className="md:col-span-2 flex gap-3">
              <button type="submit" disabled={formState === 'loading'} className="btn-primary !w-auto !py-2.5 !px-6">
                {formState === 'loading' ? 'Création…' : 'Créer le cours'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary !w-auto !py-2.5 !px-5">
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="mb-6 space-y-4">
        <SearchBar placeholder="Rechercher par titre..." />
        <FilterBar filters={filters} />
      </div>

      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-100">
                <th className="text-left text-xs text-stone-500 uppercase tracking-wide px-5 py-3">Cours</th>
                <th className="text-left text-xs text-stone-500 uppercase tracking-wide px-5 py-3">Date</th>
                <th className="text-left text-xs text-stone-500 uppercase tracking-wide px-5 py-3">Statut</th>
                <th className="text-center text-xs text-stone-500 uppercase tracking-wide px-5 py-3">Places</th>
                <th className="text-right text-xs text-stone-500 uppercase tracking-wide px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {classes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center text-stone-400 py-8">
                    Aucun cours. Créez-en un ci-dessus.
                  </td>
                </tr>
              ) : (
                classes.map((c) => {
                  const statusBadge = getClassStatusBadge(
                    c.is_cancelled ? 'cancelled' : 'upcoming',
                    c.booking_count,
                    c.max_participants
                  )
                  return (
                    <tr key={c.id} className={`border-b border-stone-50 ${c.is_cancelled ? 'opacity-50' : 'hover:bg-stone-50'} transition-colors`}>
                      <td className="px-5 py-3.5">
                        <div className="font-medium text-stone-900">{c.title}</div>
                        <div className="text-xs text-stone-400">{c.location}</div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-stone-700 capitalize">
                          {format(new Date(c.date_time), "EEE d MMM 'à' HH'h'mm", { locale: fr })}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <StatusBadge label={statusBadge.label} variant={statusBadge.variant} />
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span className={`badge-neutral ${c.booking_count >= c.max_participants ? '!bg-terra/10 !text-terra' : ''}`}>
                          {c.booking_count}/{c.max_participants}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-3">
                          {!c.is_cancelled ? (
                            <>
                              <Link href={`/admin/attendance/${c.id}`} className="text-xs text-terra hover:underline">
                                Présences
                              </Link>
                              <button
                                onClick={() => handleCancel(c.id)}
                                className="text-xs text-stone-400 hover:text-red-500 transition-colors"
                              >
                                Annuler
                              </button>
                            </>
                          ) : (
                            <span className="badge-neutral">Annulé</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination totalCount={totalCount} currentPage={page} pageSize={limit} />
    </div>
  )
}
