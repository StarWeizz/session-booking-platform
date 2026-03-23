'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

interface SearchBarProps {
  placeholder?: string
  debounceMs?: number
}

export default function SearchBar({
  placeholder = 'Rechercher...',
  debounceMs = 300
}: SearchBarProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchValue, setSearchValue] = useState(searchParams.get('search') || '')

  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString())

      if (searchValue) {
        params.set('search', searchValue)
        params.set('page', '1') // Reset to page 1 on new search
      } else {
        params.delete('search')
      }

      router.push(`?${params.toString()}`)
    }, debounceMs)

    return () => clearTimeout(timer)
  }, [searchValue, debounceMs, router, searchParams])

  return (
    <div className="relative">
      <input
        type="text"
        value={searchValue}
        onChange={(e) => setSearchValue(e.target.value)}
        placeholder={placeholder}
        className="input pl-10"
      />
      <svg
        className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
      {searchValue && (
        <button
          onClick={() => setSearchValue('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
    </div>
  )
}
