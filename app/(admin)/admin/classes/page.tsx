import ClassStatistics from '@/components/admin/ClassStatistics'
import ClassesClient from './ClassesClient'
import { getClasses, getClassesStats } from '@/lib/data/classes'

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

  // Fetch data directly from server functions
  const [classesData, stats] = await Promise.all([
    getClasses({
      page,
      limit,
      search: params.search,
      status: params.status as 'upcoming' | 'past' | 'cancelled' | 'all' | undefined,
      occupancy: params.occupancy as 'full' | 'available' | 'all' | undefined,
      dateFrom: params.dateFrom,
      dateTo: params.dateTo
    }),
    getClassesStats()
  ])

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
