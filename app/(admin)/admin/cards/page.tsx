import CardStatistics from '@/components/admin/CardStatistics'
import CardsClient from './CardsClient'

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

  // Build query string for API
  const queryParams = new URLSearchParams()
  if (params.page) queryParams.set('page', params.page)
  if (params.limit) queryParams.set('limit', params.limit)
  if (params.search) queryParams.set('search', params.search)
  if (params.status) queryParams.set('status', params.status)
  if (params.cardType) queryParams.set('cardType', params.cardType)
  if (params.dateFrom) queryParams.set('dateFrom', params.dateFrom)
  if (params.dateTo) queryParams.set('dateTo', params.dateTo)

  // Fetch data server-side
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  const [cardsResponse, statsResponse] = await Promise.all([
    fetch(`${baseUrl}/api/admin/cards?${queryParams.toString()}`, {
      cache: 'no-store'
    }),
    fetch(`${baseUrl}/api/admin/cards/stats`, {
      cache: 'no-store'
    })
  ])

  const cardsData = await cardsResponse.json()
  const stats = await statsResponse.json()

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
