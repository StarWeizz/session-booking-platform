interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: React.ReactNode
  trend?: {
    value: number
    label: string
    isPositive?: boolean
  }
}

export default function StatCard({
  title,
  value,
  subtitle,
  icon,
  trend
}: StatCardProps) {
  return (
    <div className="card">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="label">{title}</p>
          <p className="text-3xl font-semibold text-display mt-2">{value}</p>
          {subtitle && (
            <p className="text-sm text-stone-500 mt-1">{subtitle}</p>
          )}
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              <span
                className={`text-xs font-medium ${
                  trend.isPositive ? 'text-sage-dark' : 'text-terra'
                }`}
              >
                {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
              </span>
              <span className="text-xs text-stone-500">{trend.label}</span>
            </div>
          )}
        </div>
        {icon && (
          <div className="w-12 h-12 rounded-2xl bg-stone-50 flex items-center justify-center text-stone-600">
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}
