import { Suspense } from 'react'
import { getUserCards } from '@/lib/actions/cards'
import CardsClient from '@/components/CardsClient'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Mes cartes' }
export const revalidate = 60

async function CardsContent() {
  const cards = await getUserCards()
  return <CardsClient initialCards={cards} />
}

export default function CardsPage() {
  return (
    <Suspense fallback={
      <div className="max-w-md mx-auto px-4 pt-10">
        <div className="animate-pulse">
          <div className="mb-6">
            <div className="h-8 bg-stone-200 rounded w-32 mb-2"></div>
            <div className="h-4 bg-stone-200 rounded w-48"></div>
          </div>
          <div className="space-y-3">
            <div className="rounded-2xl bg-stone-100 h-32"></div>
            <div className="rounded-2xl bg-stone-100 h-32"></div>
          </div>
        </div>
      </div>
    }>
      <CardsContent />
    </Suspense>
  )
}
