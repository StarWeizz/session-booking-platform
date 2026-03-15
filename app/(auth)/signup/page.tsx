'use client'

import { useState } from 'react'
import { signUpWithMagicLink } from '@/lib/actions/auth'
import Link from 'next/link'

export default function SignUpPage() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle')
  const [error, setError] = useState('')
  const [email, setEmail] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('loading')
    setError('')

    const formData = new FormData(e.currentTarget)
    const result = await signUpWithMagicLink(formData)

    if (result.error) {
      setError(result.error)
      setStatus('error')
    } else {
      setStatus('sent')
    }
  }

  return (
    <main className="min-h-screen bg-stone-50 flex flex-col">
      <div className="max-w-md mx-auto px-6 pt-12 pb-8 flex flex-col flex-1">
        {/* Back */}
        <Link href="/" className="btn-ghost self-start -ml-2 mb-8 text-stone-400">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          Retour
        </Link>

        {/* Header */}
        <div className="mb-10">
          <h1 className="text-display text-4xl font-semibold text-stone-900 mb-3">
            Inscription
          </h1>
          <p className="text-stone-500">
            Créez votre compte pour réserver vos cours de yoga.<br />
            Un lien de connexion vous sera envoyé par email.
          </p>
        </div>

        {status === 'sent' ? (
          <div className="card text-center py-8">
            <div className="text-4xl mb-4">✉️</div>
            <h2 className="text-display text-xl font-semibold text-stone-900 mb-2">
              Vérifiez vos emails
            </h2>
            <p className="text-stone-500 text-sm leading-relaxed mb-6">
              Un lien de connexion a été envoyé à<br />
              <strong className="text-stone-800">{email}</strong>
            </p>
            <p className="text-xs text-stone-400">
              Le lien est valable 1 heure.<br />
              Vérifiez vos spams si vous ne le trouvez pas.
            </p>
            <button
              onClick={() => setStatus('idle')}
              className="btn-ghost justify-center w-full mt-6 text-stone-500"
            >
              Modifier les informations
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4" suppressHydrationWarning>
            <div>
              <label htmlFor="firstName" className="label">
                Prénom
              </label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                autoComplete="given-name"
                autoFocus
                required
                placeholder="Marie"
                className="input text-lg"
                suppressHydrationWarning
              />
            </div>

            <div>
              <label htmlFor="lastName" className="label">
                Nom
              </label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                autoComplete="family-name"
                required
                placeholder="Dupont"
                className="input text-lg"
                suppressHydrationWarning
              />
            </div>

            <div>
              <label htmlFor="phone" className="label">
                Téléphone
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                required
                placeholder="06 12 34 56 78"
                className="input text-lg"
                suppressHydrationWarning
              />
            </div>

            <div>
              <label htmlFor="email" className="label">
                Adresse email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="vous@exemple.fr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input text-lg"
                suppressHydrationWarning
              />
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={status === 'loading'}
              className="btn-primary !mt-6"
            >
              {status === 'loading' ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Envoi en cours…
                </>
              ) : (
                'Créer mon compte'
              )}
            </button>

            <p className="text-center text-sm text-stone-500 pt-4">
              Déjà inscrit ?{' '}
              <Link href="/login" className="text-terra hover:underline">
                Se connecter
              </Link>
            </p>

            <p className="text-center text-xs text-stone-400 pt-2">
              En continuant, vous acceptez les conditions d'utilisation.
            </p>
          </form>
        )}
      </div>
    </main>
  )
}