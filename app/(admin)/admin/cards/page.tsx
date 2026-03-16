'use client'

import { useState, useEffect } from 'react'
import { createCardManually, updateCardSessions } from '@/lib/actions/cards'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import type { SessionCard } from '@/types'

interface CardWithProfile extends Omit<SessionCard, 'profile'> {
  profile: { full_name: string | null; id: string } | null
}

interface Client {
  id: string
  full_name: string | null
  email?: string | null
}

export default function AdminCardsPage() {
  const [cards, setCards] = useState<CardWithProfile[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingCard, setEditingCard] = useState<string | null>(null)
  const [editSessions, setEditSessions] = useState(0)

  useEffect(() => {
    fetch('/api/admin/cards').then((r) => r.json()).then(setCards).catch(console.error)
    fetch('/api/admin/clients').then((r) => r.json()).then(setClients).catch(console.error)
  }, [])

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const userId = formData.get('userId') as string
    const cardType = formData.get('cardType') as '1' | '10' | '20'
    const expiryDate = formData.get('expiryDate') as string || undefined

    // Validate for multi-session cards only
    if (cardType !== '1') {
      try {
        const res = await fetch(`/api/admin/cards/validate?userId=${userId}&cardType=${cardType}`)
        const validation = await res.json()

        if (validation.hasActiveCard) {
          const confirmed = confirm(
            `⚠️ Ce client a déjà une carte active avec ${validation.remainingSessions} séance${validation.remainingSessions > 1 ? 's' : ''} restante${validation.remainingSessions > 1 ? 's' : ''}.\n\n` +
            `Créer quand même une carte de ${cardType} séances ?`
          )
          if (!confirmed) return
        }
      } catch (error) {
        console.error('Validation error:', error)
      }
    }

    const result = await createCardManually({
      userId,
      cardType,
      expiryDate,
    })
    if (result.success) {
      setShowForm(false)
      fetch('/api/admin/cards').then((r) => r.json()).then(setCards)
    }
  }

  async function handleUpdateSessions(cardId: string) {
    await updateCardSessions({ cardId, remainingSessions: editSessions })
    setEditingCard(null)
    setCards((prev) => prev.map((c) => c.id === cardId ? { ...c, remaining_sessions: editSessions } : c))
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-display text-3xl font-semibold text-stone-900 mb-1">Cartes de séances</h1>
          <p className="text-stone-500 text-sm">{cards.length} carte{cards.length > 1 ? 's' : ''} au total</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary !w-auto !py-2.5 !px-5">
          + Ajouter manuellement
        </button>
      </div>

      {showForm && (
        <div className="card mb-6 border-terra/20">
          <h2 className="font-semibold text-stone-900 mb-4">Ajouter une carte manuellement</h2>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="label">Client</label>
              <select name="userId" className="input" required>
                <option value="">Choisir un client…</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.full_name ?? '(sans nom)'}{c.email ? ` — ${c.email}` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Type de carte</label>
              <select name="cardType" className="input">
                <option value="1">1 séance</option>
                <option value="10">10 séances</option>
                <option value="20">20 séances</option>
              </select>
            </div>
            <div>
              <label className="label">Date d'expiration (optionnel)</label>
              <input name="expiryDate" type="date" className="input" />
            </div>
            <div className="md:col-span-3 flex gap-3">
              <button type="submit" className="btn-primary !w-auto !py-2.5 !px-6">Créer la carte</button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary !w-auto !py-2.5 !px-5">Annuler</button>
            </div>
          </form>
        </div>
      )}

      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-100">
                <th className="text-left text-xs text-stone-500 uppercase tracking-wide px-5 py-3">Client</th>
                <th className="text-center text-xs text-stone-500 uppercase tracking-wide px-5 py-3">Séances</th>
                <th className="text-left text-xs text-stone-500 uppercase tracking-wide px-5 py-3">Acheté le</th>
                <th className="text-left text-xs text-stone-500 uppercase tracking-wide px-5 py-3">Expire</th>
                <th className="text-right text-xs text-stone-500 uppercase tracking-wide px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {cards.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center text-stone-400 py-8">Aucune carte.</td>
                </tr>
              ) : (
                cards.map((card) => (
                  <tr key={card.id} className="border-b border-stone-50 hover:bg-stone-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-medium text-stone-900">
                        {card.profile?.full_name ?? '(sans nom)'}
                      </div>
                      <div className="text-xs text-stone-400">{card.total_sessions} séances</div>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      {editingCard === card.id ? (
                        <div className="flex items-center gap-2 justify-center">
                          <input
                            type="number"
                            value={editSessions}
                            onChange={(e) => setEditSessions(parseInt(e.target.value))}
                            className="w-16 input !py-1 !px-2 text-center"
                            min={0}
                            max={card.total_sessions}
                          />
                          <button onClick={() => handleUpdateSessions(card.id)} className="text-xs text-terra hover:underline">OK</button>
                          <button onClick={() => setEditingCard(null)} className="text-xs text-stone-400 hover:underline">✕</button>
                        </div>
                      ) : (
                        <span className={`font-semibold ${card.remaining_sessions === 0 ? 'text-stone-300' : card.remaining_sessions <= 2 ? 'text-terra' : 'text-stone-800'}`}>
                          {card.remaining_sessions}/{card.total_sessions}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-stone-500">
                      {format(new Date(card.created_at), 'd MMM yyyy', { locale: fr })}
                    </td>
                    <td className="px-5 py-3.5 text-stone-400">
                      {card.expiry_date
                        ? format(new Date(card.expiry_date), 'd MMM yyyy', { locale: fr })
                        : '—'}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => { setEditingCard(card.id); setEditSessions(card.remaining_sessions) }}
                        className="text-xs text-terra hover:underline"
                      >
                        Modifier
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
