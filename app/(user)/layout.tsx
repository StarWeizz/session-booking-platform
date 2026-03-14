import Navigation from '@/components/Navigation'

export default function UserLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-stone-50 pb-24">
      {children}
      <Navigation />
    </div>
  )
}
