import { useMemo } from 'react'
import { getDeckStats } from '../lib/shared'

export default function useDeckStats(cards) {
  return useMemo(() => getDeckStats(cards), [cards])
}

