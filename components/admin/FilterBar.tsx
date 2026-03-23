'use client'

import { useRouter, useSearchParams } from 'next/navigation'

export interface FilterOption {
  value: string
  label: string
}

export interface Filter {
  name: string
  label: string
  options: FilterOption[]
  placeholder?: string
}

interface FilterBarProps {
  filters: Filter[]
}

export default function FilterBar({ filters }: FilterBarProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const updateFilter = (filterName: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())

    if (value && value !== 'all') {
      params.set(filterName, value)
      params.set('page', '1') // Reset to page 1 on filter change
    } else {
      params.delete(filterName)
    }

    router.push(`?${params.toString()}`)
  }

  const clearAllFilters = () => {
    const params = new URLSearchParams()
    const search = searchParams.get('search')
    if (search) {
      params.set('search', search)
    }
    router.push(`?${params.toString()}`)
  }

  const hasActiveFilters = filters.some((filter) => {
    const value = searchParams.get(filter.name)
    return value && value !== 'all'
  })

  return (
    <div className="flex flex-wrap items-center gap-3">
      {filters.map((filter) => {
        const currentValue = searchParams.get(filter.name) || 'all'

        return (
          <div key={filter.name} className="flex flex-col gap-1">
            <label className="label">{filter.label}</label>
            <select
              value={currentValue}
              onChange={(e) => updateFilter(filter.name, e.target.value)}
              className="input py-2.5 px-3 w-auto text-sm"
            >
              <option value="all">{filter.placeholder || 'Tous'}</option>
              {filter.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        )
      })}

      {hasActiveFilters && (
        <button
          onClick={clearAllFilters}
          className="btn-ghost text-xs mt-5"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
          Réinitialiser
        </button>
      )}
    </div>
  )
}
