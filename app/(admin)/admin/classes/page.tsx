import ClassStatistics from '@/components/admin/ClassStatistics'
import ClassesClient from './ClassesClient'

interface PageProps {
  searchParams: Promise<{
    page?: string
    limit?: string
    search?: string
    status?: string
    occupancy?: string
    dateFrom?: string
    dateTo?: string
  }>
}

export default async function AdminClassesPage({ searchParams }: PageProps) {
  const params = await searchParams
  const page = parseInt(params.page || '1')
  const limit = parseInt(params.limit || '25')

  // Build query string for API
  const queryParams = new URLSearchParams()
  queryParams.set('page', page.toString())
  queryParams.set('limit', limit.toString())
  if (params.search) queryParams.set('search', params.search)
  if (params.status) queryParams.set('status', params.status)
  if (params.occupancy) queryParams.set('occupancy', params.occupancy)
  if (params.dateFrom) queryParams.set('dateFrom', params.dateFrom)
  if (params.dateTo) queryParams.set('dateTo', params.dateTo)

  // Fetch data server-side
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  const [classesResponse, statsResponse] = await Promise.all([
    fetch(`${baseUrl}/api/admin/classes?${queryParams.toString()}`, {
      cache: 'no-store'
    }),
    fetch(`${baseUrl}/api/admin/classes/stats`, {
      cache: 'no-store'
    })
  ])

  const classesData = await classesResponse.json()
  const stats = await statsResponse.json()

  return (
    <div>
      <ClassStatistics stats={stats} />
      <ClassesClient
        initialClasses={classesData.classes || []}
        totalCount={classesData.totalCount || 0}
        page={page}
        limit={limit}
      />
    </div>
  )
}
