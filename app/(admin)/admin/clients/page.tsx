import ClientStatistics from '@/components/admin/ClientStatistics'
import ClientsClient from './ClientsClient'
import { getAllClients } from '@/lib/actions/admin'
import { getClientsStats } from '@/lib/data/clients'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Admin — Clients' }

interface PageProps {
  searchParams: Promise<{
    page?: string
    limit?: string
    search?: string
    status?: string
    sortBy?: string
    sortOrder?: string
  }>
}

export default async function AdminClientsPage({ searchParams }: PageProps) {
  const params = await searchParams
  const page = parseInt(params.page || '1')
  const limit = parseInt(params.limit || '25')

  // Fetch data directly from server functions
  const [clientsData, stats] = await Promise.all([
    getAllClients({
      page,
      limit,
      search: params.search,
      status: params.status as 'active' | 'inactive' | 'all' | undefined,
      sortBy: params.sortBy as 'created_at' | 'booking_count' | 'total_remaining' | undefined,
      sortOrder: params.sortOrder as 'asc' | 'desc' | undefined
    }),
    getClientsStats()
  ])

  return (
    <div>
      <ClientStatistics stats={stats} />
      <ClientsClient
        initialClients={clientsData.clients || []}
        totalCount={clientsData.totalCount || 0}
        page={page}
        limit={limit}
      />
    </div>
  )
}
