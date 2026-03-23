import CardStatistics from '@/components/admin/CardStatistics'
import CardsClient from './CardsClient'
import { getCards, getCardsStats } from '@/lib/data/cards'

// Revalidate this page every 30 seconds
export const revalidate = 30

interface PageProps {
  searchParams: Promise<{
    page?: string
    limit?: string
    search?: string
    status?: string
    cardType?: string
    dateFrom?: string
    dateTo?: string
  }>
}

export default async function AdminCardsPage({ searchParams }: PageProps) {
  const params = await searchParams
  const page = parseInt(params.page || '1')
  const limit = parseInt(params.limit || '25')

  // Fetch data directly from server functions
  const [cardsData, stats] = await Promise.all([
    getCards({
      page,
      limit,
      search: params.search,
      status: params.status as 'active' | 'inactive' | 'all' | undefined,
      cardType: params.cardType,
      dateFrom: params.dateFrom,
      dateTo: params.dateTo
    }),
    getCardsStats()
  ])

  return (
    <div>
      <CardStatistics stats={stats} />
      <CardsClient
        initialCards={cardsData.cards || []}
        totalCount={cardsData.totalCount || 0}
        page={page}
        limit={limit}
      />
    </div>
  )
}
