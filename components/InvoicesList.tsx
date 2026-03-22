'use client'

import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import type { InvoiceData } from '@/lib/actions/payments'

interface InvoicesListProps {
  invoices: InvoiceData[]
}

export default function InvoicesList({ invoices }: InvoicesListProps) {
  const formatCardType = (type: string) => {
    if (type === '1') return '1 séance'
    return `Carte ${type} séances`
  }

  if (invoices.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-3xl mb-3">📄</div>
        <p className="text-stone-500 text-sm">Aucune facture disponible.</p>
        <p className="text-stone-400 text-xs mt-1">
          Vos factures apparaîtront ici après vos achats.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {invoices.map((invoice) => (
        <div
          key={invoice.id}
          className="card-sm flex items-center justify-between hover:shadow-warm-md transition-shadow"
        >
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-stone-900">
                {formatCardType(invoice.card_type)}
              </span>
              <span className="badge-sage text-xs">
                {invoice.amount.toFixed(2)}€
              </span>
            </div>
            <p className="text-xs text-stone-400 capitalize">
              {format(new Date(invoice.created_at), "d MMMM yyyy 'à' HH'h'mm", { locale: fr })}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {invoice.receipt_url ? (
              <a
                href={invoice.receipt_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-terra hover:underline font-medium"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Télécharger
              </a>
            ) : (
              <span className="text-xs text-stone-300">Non disponible</span>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
