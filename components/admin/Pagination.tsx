'use client'

import { useRouter, useSearchParams } from 'next/navigation'

interface PaginationProps {
  totalCount: number
  currentPage: number
  pageSize: number
}

export default function Pagination({
  totalCount,
  currentPage,
  pageSize
}: PaginationProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const totalPages = Math.ceil(totalCount / pageSize)

  const updatePage = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', newPage.toString())
    router.push(`?${params.toString()}`)
  }

  const updatePageSize = (newSize: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('limit', newSize.toString())
    params.set('page', '1') // Reset to page 1 when changing page size
    router.push(`?${params.toString()}`)
  }

  if (totalPages <= 1) return null

  const startItem = (currentPage - 1) * pageSize + 1
  const endItem = Math.min(currentPage * pageSize, totalCount)

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
      {/* Page size selector */}
      <div className="flex items-center gap-2 text-sm text-stone-600">
        <span>Afficher</span>
        <select
          value={pageSize}
          onChange={(e) => updatePageSize(Number(e.target.value))}
          className="input py-2 px-3 w-20 text-sm"
        >
          <option value={10}>10</option>
          <option value={25}>25</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </select>
        <span>par page</span>
      </div>

      {/* Page info */}
      <div className="text-sm text-stone-600">
        {startItem}-{endItem} sur {totalCount}
      </div>

      {/* Page navigation */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => updatePage(currentPage - 1)}
          disabled={currentPage === 1}
          className="btn-ghost disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Précédent
        </button>

        {/* Page numbers */}
        <div className="flex items-center gap-1">
          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
            let pageNumber: number

            if (totalPages <= 5) {
              pageNumber = i + 1
            } else if (currentPage <= 3) {
              pageNumber = i + 1
            } else if (currentPage >= totalPages - 2) {
              pageNumber = totalPages - 4 + i
            } else {
              pageNumber = currentPage - 2 + i
            }

            return (
              <button
                key={pageNumber}
                onClick={() => updatePage(pageNumber)}
                className={`w-10 h-10 rounded-xl text-sm font-medium transition-colors ${
                  currentPage === pageNumber
                    ? 'bg-terra text-white'
                    : 'text-stone-600 hover:bg-stone-100'
                }`}
              >
                {pageNumber}
              </button>
            )
          })}
        </div>

        <button
          onClick={() => updatePage(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="btn-ghost disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Suivant
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  )
}
