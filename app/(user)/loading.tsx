export default function Loading() {
  return (
    <div className="max-w-md mx-auto px-4 pt-10">
      <div className="animate-pulse">
        {/* Header skeleton */}
        <div className="mb-8">
          <div className="h-4 bg-stone-200 rounded w-20 mb-2"></div>
          <div className="h-8 bg-stone-200 rounded w-40"></div>
        </div>

        {/* Card skeleton */}
        <div className="rounded-3xl bg-stone-100 h-32 mb-6"></div>

        {/* Grid skeleton */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="rounded-2xl bg-stone-100 h-24"></div>
          <div className="rounded-2xl bg-stone-100 h-24"></div>
        </div>

        {/* Content skeleton */}
        <div className="space-y-3">
          <div className="rounded-2xl bg-stone-100 h-24"></div>
          <div className="rounded-2xl bg-stone-100 h-24"></div>
        </div>
      </div>
    </div>
  )
}
