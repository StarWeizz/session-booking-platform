type BadgeVariant = 'sage' | 'terra' | 'neutral'

interface StatusBadgeProps {
  label: string
  variant: BadgeVariant
  icon?: React.ReactNode
}

export default function StatusBadge({ label, variant, icon }: StatusBadgeProps) {
  const badgeClass = {
    sage: 'badge-sage',
    terra: 'badge-terra',
    neutral: 'badge-neutral'
  }[variant]

  return (
    <span className={badgeClass}>
      {icon}
      {label}
    </span>
  )
}

// Helper functions for common status badges
export function getCardStatusBadge(
  remainingSessions: number,
  expiryDate: string | null
): { label: string; variant: BadgeVariant } {
  const now = new Date()
  const expiry = expiryDate ? new Date(expiryDate) : null
  const daysUntilExpiry = expiry
    ? Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    : null

  // Check if expired
  if (expiry && expiry < now) {
    return { label: 'Expirée', variant: 'neutral' }
  }

  // Check if empty
  if (remainingSessions === 0) {
    return { label: 'Épuisée', variant: 'neutral' }
  }

  // Check if expiring soon (within 30 days)
  if (daysUntilExpiry !== null && daysUntilExpiry <= 30) {
    return { label: 'Expire bientôt', variant: 'terra' }
  }

  // Check if low sessions
  if (remainingSessions <= 2) {
    return { label: 'Bientôt vide', variant: 'terra' }
  }

  // Active
  return { label: 'Actif', variant: 'sage' }
}

export function getClientStatusBadge(
  hasActiveCards: boolean,
  lastBookingDate: string | null
): { label: string; variant: BadgeVariant } {
  if (!hasActiveCards) {
    return { label: 'Inactif', variant: 'neutral' }
  }

  const now = new Date()
  const lastBooking = lastBookingDate ? new Date(lastBookingDate) : null
  const daysSinceBooking = lastBooking
    ? Math.ceil((now.getTime() - lastBooking.getTime()) / (1000 * 60 * 60 * 24))
    : null

  if (daysSinceBooking !== null && daysSinceBooking > 30) {
    return { label: 'Inactif', variant: 'neutral' }
  }

  return { label: 'Actif', variant: 'sage' }
}

export function getClassStatusBadge(
  status: string,
  spots: number,
  maxSpots: number
): { label: string; variant: BadgeVariant } {
  if (status === 'cancelled') {
    return { label: 'Annulé', variant: 'neutral' }
  }

  const now = new Date()

  if (spots >= maxSpots) {
    return { label: 'Complet', variant: 'terra' }
  }

  return { label: 'À venir', variant: 'sage' }
}
