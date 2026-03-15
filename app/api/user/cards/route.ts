import { getUserCards } from '@/lib/actions/cards'
import { NextResponse } from 'next/server'

export async function GET() {
  const cards = await getUserCards()
  // Filter out cards with no sessions left
  return NextResponse.json(cards.filter(c => c.remaining_sessions > 0))
}
