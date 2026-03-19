import { useState } from 'react'

export default function useDifficultyFilters() {
  const [difficultyTargetMin, setDifficultyTargetMin] = useState(1)
  const [difficultyTargetMax, setDifficultyTargetMax] = useState(5)
  const [difficultySource, setDifficultySource] = useState('intrinsic')
  const [weakCardBoost, setWeakCardBoost] = useState(true)

  function resetDifficultyFilters() {
    setDifficultyTargetMin(1)
    setDifficultyTargetMax(5)
    setDifficultySource('intrinsic')
    setWeakCardBoost(true)
  }

  return {
    difficultyTargetMin,
    setDifficultyTargetMin,
    difficultyTargetMax,
    setDifficultyTargetMax,
    difficultySource,
    setDifficultySource,
    weakCardBoost,
    setWeakCardBoost,
    resetDifficultyFilters,
  }
}

