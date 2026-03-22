'use client'

import { useState } from 'react'
import { deleteAccount } from '@/lib/actions/auth'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import InvoicesList from '@/components/InvoicesList'
import type { InvoiceData } from '@/lib/actions/payments'

interface ProfileClientProps {
  profile: {
    id: string
    full_name: string | null
    email: string | null
    phone: string | null
    created_at: string
  }
  invoices: InvoiceData[]
}

type Tab = 'profile' | 'invoices'

export default function ProfileClient({ profile, invoices }: ProfileClientProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<Tab>('profile')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDeleteAccount = async () => {
    if (confirmText !== 'SUPPRIMER') {
      setError('Veuillez taper SUPPRIMER pour confirmer')
      return
    }

    setIsDeleting(true)
    setError(null)

    try {
      const result = await deleteAccount()
      if (result.error) {
        setError(result.error)
        setIsDeleting(false)
      } else {
        // Redirect to home page
        router.push('/')
      }
    } catch (err) {
      setError('Une erreur est survenue')
      setIsDeleting(false)
    }
  }

  const memberSince = new Date(profile.created_at).toLocaleDateString('fr-FR', {
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="max-w-md mx-auto px-4 pt-10 pb-8">
      {/* Header */}
      <div className="mb-6 page-enter">
        <h1 className="text-display text-3xl font-semibold text-stone-900 mb-1">
          Mon profil
        </h1>
        <p className="text-stone-400 text-sm">
          Gérez vos informations personnelles
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 animate-slide-up">
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex-1 py-3 px-4 rounded-xl font-medium text-sm transition-all ${
            activeTab === 'profile'
              ? 'bg-terra text-white shadow-warm-md'
              : 'bg-white text-stone-500 hover:bg-stone-50'
          }`}
        >
          Profil
        </button>
        <button
          onClick={() => setActiveTab('invoices')}
          className={`flex-1 py-3 px-4 rounded-xl font-medium text-sm transition-all ${
            activeTab === 'invoices'
              ? 'bg-terra text-white shadow-warm-md'
              : 'bg-white text-stone-500 hover:bg-stone-50'
          }`}
        >
          Factures
          {invoices.length > 0 && (
            <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
              activeTab === 'invoices' ? 'bg-white/20' : 'bg-stone-100'
            }`}>
              {invoices.length}
            </span>
          )}
        </button>
      </div>

      {/* Profile tab content */}
      {activeTab === 'profile' && (
        <>
          {/* Profile info */}
          <div className="card mb-6 animate-slide-up animate-stagger-1">
        <h2 className="text-sm font-medium text-stone-500 uppercase tracking-wide mb-4">
          Informations
        </h2>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-stone-500">Nom complet</label>
            <p className="text-stone-900 font-medium">{profile.full_name || '(Non renseigné)'}</p>
          </div>
          <div>
            <label className="text-xs text-stone-500">Email</label>
            <p className="text-stone-900">{profile.email || '(Non renseigné)'}</p>
          </div>
          <div>
            <label className="text-xs text-stone-500">Téléphone</label>
            <p className="text-stone-900">{profile.phone || '(Non renseigné)'}</p>
          </div>
          <div>
            <label className="text-xs text-stone-500">Membre depuis</label>
            <p className="text-stone-900 capitalize">{memberSince}</p>
          </div>
        </div>
      </div>

      {/* Legal links */}
      <div className="card mb-6 animate-slide-up animate-stagger-2">
        <h2 className="text-sm font-medium text-stone-500 uppercase tracking-wide mb-4">
          Documents légaux
        </h2>
        <div className="space-y-2">
          <Link
            href="/documents/conditions-utilisation.docx"
            download
            className="flex items-center gap-2 text-stone-700 hover:text-terra transition-colors py-2"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
              <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>
            </svg>
            <span>Conditions d'utilisation</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="ml-auto">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>
            </svg>
          </Link>
          <Link
            href="/documents/politique-confidentialite.docx"
            download
            className="flex items-center gap-2 text-stone-700 hover:text-terra transition-colors py-2"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
              <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>
            </svg>
            <span>Politique de confidentialité</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="ml-auto">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>
            </svg>
          </Link>
        </div>
      </div>

          {/* Danger zone */}
          <div className="card border-red-200 bg-red-50 animate-slide-up animate-stagger-3">
            <h2 className="text-sm font-medium text-red-700 uppercase tracking-wide mb-3">
              Zone dangereuse
            </h2>
            <p className="text-sm text-stone-600 mb-4">
              La suppression de votre compte est définitive et irréversible. Toutes vos données seront supprimées conformément au RGPD.
            </p>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="btn-secondary !bg-red-100 !text-red-700 !border-red-200 hover:!bg-red-200 w-full"
            >
              Supprimer mon compte
            </button>
          </div>
        </>
      )}

      {/* Invoices tab content */}
      {activeTab === 'invoices' && (
        <div className="card animate-slide-up animate-stagger-1">
          <h2 className="text-sm font-medium text-stone-500 uppercase tracking-wide mb-4">
            Mes factures
          </h2>
          <InvoicesList invoices={invoices} />
        </div>
      )}

      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-semibold text-stone-900 mb-2">
              Supprimer votre compte ?
            </h3>
            <p className="text-sm text-stone-600 mb-4">
              Cette action est <strong>irréversible</strong>. Toutes vos données (réservations, cartes, profil) seront définitivement supprimées.
            </p>

            <div className="mb-4">
              <label className="text-xs text-stone-500 mb-2 block">
                Tapez <strong>SUPPRIMER</strong> pour confirmer
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                className="input"
                placeholder="SUPPRIMER"
                autoFocus
              />
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 mb-4">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false)
                  setConfirmText('')
                  setError(null)
                }}
                disabled={isDeleting}
                className="btn-secondary flex-1"
              >
                Annuler
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={isDeleting || confirmText !== 'SUPPRIMER'}
                className="btn-primary !bg-red-600 hover:!bg-red-700 flex-1 disabled:opacity-50"
              >
                {isDeleting ? 'Suppression...' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
