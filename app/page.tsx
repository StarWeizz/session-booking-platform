import Link from 'next/link'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getUser } from '@/lib/actions/auth'

export const metadata: Metadata = {
  title: 'Studio Yoga — Réservez vos cours',
}

export default async function LandingPage() {
  const user = await getUser()

  if (user) {
    redirect('/dashboard')
  }
  return (
    <main className="min-h-screen bg-stone-50 overflow-hidden">
      {/* Background decorative element */}
      <div
        className="fixed top-0 right-0 w-[500px] h-[500px] rounded-full opacity-[0.07] pointer-events-none"
        style={{
          background: 'radial-gradient(circle, #C4715A 0%, transparent 70%)',
          transform: 'translate(30%, -30%)',
        }}
      />
      <div
        className="fixed bottom-0 left-0 w-[400px] h-[400px] rounded-full opacity-[0.05] pointer-events-none"
        style={{
          background: 'radial-gradient(circle, #8FA892 0%, transparent 70%)',
          transform: 'translate(-30%, 30%)',
        }}
      />

      <div className="relative max-w-md mx-auto px-6 pt-20 pb-12 min-h-screen flex flex-col">
        {/* Header */}
        <div className="animate-fade-in">
          <div className="inline-flex items-center gap-2 bg-terra/10 text-terra text-xs font-medium px-3 py-1.5 rounded-full mb-8">
            <span className="w-1.5 h-1.5 bg-terra rounded-full animate-pulse" />
            Réservation en ligne disponible
          </div>

          <h1 className="text-display text-5xl font-semibold text-stone-900 leading-[1.1] mb-4">
            Trouvez<br />
            <em className="not-italic text-terra">votre</em><br />
            équilibre.
          </h1>

          <p className="text-stone-500 text-lg leading-relaxed mb-10">
            Réservez vos cours de yoga en quelques secondes. Simple, sans compte compliqué.
          </p>
        </div>

        {/* Features */}
        <div className="space-y-3 mb-10 animate-slide-up animate-stagger-2">
          {[
            { icon: '✦', text: 'Connexion par lien email — pas de mot de passe' },
            { icon: '◎', text: 'Vos séances disponibles toujours visibles' },
            { icon: '◈', text: 'Annulation gratuite jusqu\'à 24h avant' },
          ].map((f, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="text-terra text-lg w-6 flex-shrink-0 text-center">{f.icon}</span>
              <span className="text-stone-600 text-sm">{f.text}</span>
            </div>
          ))}
        </div>

        {/* Sample classes preview */}
        <div className="card mb-8 animate-slide-up animate-stagger-3">
          <div className="text-xs text-stone-400 uppercase tracking-wide mb-3">Prochains cours</div>
          <div className="space-y-3">
            {[
              { day: 'Mardi', time: '18h00', title: 'Yoga doux', spots: 3 },
              { day: 'Jeudi', time: '19h00', title: 'Vinyasa', spots: 5 },
              { day: 'Samedi', time: '10h00', title: 'Yin Yoga', spots: 8 },
            ].map((c, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-stone-100 last:border-0">
                <div>
                  <span className="text-xs text-stone-400 mr-2">{c.day}</span>
                  <span className="text-display font-semibold text-stone-800">{c.time}</span>
                  <span className="text-sm text-stone-600 ml-2">{c.title}</span>
                </div>
                <div className="text-xs text-sage-dark bg-sage/10 px-2 py-1 rounded-full">
                  {c.spots} places
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="space-y-3 animate-slide-up animate-stagger-4">
          <Link href="/signup" className="btn-primary text-center">
            Commencer — c'est gratuit
          </Link>
          <Link href="/login" className="btn-ghost justify-center w-full text-stone-500">
            Déjà inscrit ? Se connecter
          </Link>
        </div>

        <p className="text-center text-xs text-stone-400 mt-8">
          Plateforme sécurisée · Paiement par Stripe
        </p>
      </div>
    </main>
  )
}
