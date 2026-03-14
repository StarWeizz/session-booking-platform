'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from '@/lib/actions/auth'

const navItems = [
  { href: '/admin', label: 'Dashboard', exact: true },
  { href: '/admin/clients', label: 'Clients' },
  { href: '/admin/classes', label: 'Cours' },
  { href: '/admin/cards', label: 'Cartes' },
]

export default function AdminNav() {
  const pathname = usePathname()

  return (
    <header className="bg-stone-900 text-white sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-1">
            <span className="text-display text-lg font-semibold text-stone-100 mr-4">Admin</span>
            <nav className="flex items-center gap-1">
              {navItems.map((item) => {
                const active = item.exact ? pathname === item.href : pathname.startsWith(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      active
                        ? 'bg-white/10 text-white'
                        : 'text-stone-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {item.label}
                  </Link>
                )
              })}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-xs text-stone-400 hover:text-white transition-colors">
              Vue élève
            </Link>
            <form action={signOut}>
              <button type="submit" className="text-xs text-stone-400 hover:text-white transition-colors">
                Déconnexion
              </button>
            </form>
          </div>
        </div>
      </div>
    </header>
  )
}
