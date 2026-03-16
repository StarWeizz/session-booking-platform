import { getAllClients } from '@/lib/actions/admin'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Admin — Clients' }

export default async function AdminClientsPage() {
  const clients = await getAllClients()

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-display text-3xl font-semibold text-stone-900 mb-1">Clients</h1>
          <p className="text-stone-500 text-sm">{clients.length} client{clients.length > 1 ? 's' : ''} inscrits</p>
        </div>
      </div>

      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-100">
                <th className="text-left text-xs text-stone-500 uppercase tracking-wide px-5 py-3">Client</th>
                <th className="text-right text-xs text-stone-500 uppercase tracking-wide px-5 py-3">Réservations</th>
                <th className="text-right text-xs text-stone-500 uppercase tracking-wide px-5 py-3">Cartes actives</th>
                <th className="text-right text-xs text-stone-500 uppercase tracking-wide px-5 py-3">Séances restantes</th>
              </tr>
            </thead>
            <tbody>
              {clients.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center text-stone-400 py-8">
                    Aucun client pour l'instant.
                  </td>
                </tr>
              ) : (
                clients.map((client) => (
                  <tr key={client.id} className="border-b border-stone-50 hover:bg-stone-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-medium text-stone-900">
                        {client.full_name ?? '(sans nom)'}
                      </div>
                      <div className="text-xs text-stone-400 mt-0.5">
                        {(client as any).email ?? `${client.id.slice(0, 8)}…`}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <span className="font-medium text-stone-700">{client.booking_count}</span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {client.active_cards > 0 ? (
                        <span className="badge-sage">{client.active_cards}</span>
                      ) : (
                        <span className="text-stone-300">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {client.total_remaining > 0 ? (
                        <span className={`font-semibold ${client.total_remaining <= 2 ? 'text-terra' : 'text-stone-800'}`}>
                          {client.total_remaining}
                        </span>
                      ) : (
                        <span className="text-stone-300">0</span>
                      )}
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
