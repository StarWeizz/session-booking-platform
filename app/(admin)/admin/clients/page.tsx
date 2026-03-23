import ClientStatistics from '@/components/admin/ClientStatistics'
import ClientsClient from './ClientsClient'
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

  // Build query string for API
  const queryParams = new URLSearchParams()
  queryParams.set('page', page.toString())
  queryParams.set('limit', limit.toString())
  if (params.search) queryParams.set('search', params.search)
  if (params.status) queryParams.set('status', params.status)
  if (params.sortBy) queryParams.set('sortBy', params.sortBy)
  if (params.sortOrder) queryParams.set('sortOrder', params.sortOrder)

  // Fetch data server-side
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  const [clientsResponse, statsResponse] = await Promise.all([
    fetch(`${baseUrl}/api/admin/clients?${queryParams.toString()}`, {
      cache: 'no-store'
    }),
    fetch(`${baseUrl}/api/admin/clients/stats`, {
      cache: 'no-store'
    })
  ])

  const clientsData = await clientsResponse.json()
  const stats = await statsResponse.json()

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
