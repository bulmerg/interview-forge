import { useEffect, useMemo, useRef, useState } from 'react'
import {
  autoGroupTags,
  calculateSrs,
  cardMatches,
  getPerformanceByTag,
  getWeakCards,
  uniqueTags,
} from '../lib/deckEngine'
import { clampDifficulty, getIntrinsicDifficulty, getPersonalDifficulty, shuffle } from '../lib/shared'

export default function useStudySession({
  cards,
  setCards,
  simCount,
  viewMode,
  difficultyTargetMin,
  difficultyTargetMax,
  difficultySource,
  weakCardBoost,
}) {
  const [includeTags, setIncludeTags] = useState([])
  const [excludeTags, setExcludeTags] = useState([])
  const [search, setSearch] = useState('')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [shuffleSeed, setShuffleSeed] = useState(0)
  const [dueOnly, setDueOnly] = useState(true)
  const [difficultyFilter, setDifficultyFilter] = useState('all')
  const revealAtRef = useRef(null)

  useEffect(() => {
    revealAtRef.current = flipped ? Date.now() : null
  }, [flipped])

  const tags = useMemo(() => uniqueTags(cards), [cards])
  const groupedTags = useMemo(() => autoGroupTags(tags), [tags])
  const tagPerformance = useMemo(() => getPerformanceByTag(cards), [cards])
  const weakCards = useMemo(() => getWeakCards(cards), [cards])

  const filteredCards = useMemo(() => {
    const selected = cards.filter(card => cardMatches(
      card,
      includeTags,
      excludeTags,
      search,
      dueOnly && ['study', 'quiz', 'interview'].includes(viewMode),
      difficultyFilter,
      { min: difficultyTargetMin, max: difficultyTargetMax },
      difficultySource,
      weakCardBoost,
    ))
    if (!shuffleSeed) return selected
    return shuffle([...selected], shuffleSeed)
  }, [
    cards,
    includeTags,
    excludeTags,
    search,
    dueOnly,
    viewMode,
    difficultyFilter,
    difficultyTargetMin,
    difficultyTargetMax,
    difficultySource,
    weakCardBoost,
    shuffleSeed,
  ])

  const simulationCards = useMemo(() => {
    const base = cards.filter(card => cardMatches(
      card,
      includeTags,
      excludeTags,
      search,
      dueOnly,
      difficultyFilter,
      { min: difficultyTargetMin, max: difficultyTargetMax },
      difficultySource,
      weakCardBoost,
    ))
    return shuffle([...base], simCount * 811 + 7).slice(0, simCount)
  }, [
    cards,
    includeTags,
    excludeTags,
    search,
    dueOnly,
    difficultyFilter,
    simCount,
    difficultyTargetMin,
    difficultyTargetMax,
    difficultySource,
    weakCardBoost,
  ])

  const quizCards = useMemo(() => {
    const selected = cards.filter(card => cardMatches(
      card,
      includeTags,
      excludeTags,
      search,
      dueOnly,
      difficultyFilter,
      { min: difficultyTargetMin, max: difficultyTargetMax },
      difficultySource,
      weakCardBoost,
    ))
    return shuffle([...selected], shuffleSeed + 99)
  }, [
    cards,
    includeTags,
    excludeTags,
    search,
    dueOnly,
    shuffleSeed,
    difficultyFilter,
    difficultyTargetMin,
    difficultyTargetMax,
    difficultySource,
    weakCardBoost,
  ])

  const activeCard = filteredCards[currentIndex] || null
  const previousActiveCardIdRef = useRef(null)

  useEffect(() => {
    const nextId = activeCard?.id ?? null
    if (previousActiveCardIdRef.current !== nextId) {
      setFlipped(false)
      previousActiveCardIdRef.current = nextId
    }
  }, [activeCard?.id])

  useEffect(() => {
    if (currentIndex >= filteredCards.length) setCurrentIndex(0)
  }, [filteredCards.length, currentIndex])

  function toggleTag(tag, mode = 'include') {
    if (mode === 'include') {
      setExcludeTags(prev => prev.filter(item => item !== tag))
      setIncludeTags(prev => (prev.includes(tag) ? prev.filter(item => item !== tag) : [...prev, tag]))
    } else {
      setIncludeTags(prev => prev.filter(item => item !== tag))
      setExcludeTags(prev => (prev.includes(tag) ? prev.filter(item => item !== tag) : [...prev, tag]))
    }
    setCurrentIndex(0)
  }

  function toggleTagGroup(tagNames, mode = 'include') {
    const uniqueTags = [...new Set((tagNames || []).filter(Boolean))]
    if (uniqueTags.length === 0) return

    if (mode === 'include') {
      setExcludeTags(prev => prev.filter(tag => !uniqueTags.includes(tag)))
      setIncludeTags(prev => {
        const allIncluded = uniqueTags.every(tag => prev.includes(tag))
        if (allIncluded) return prev.filter(tag => !uniqueTags.includes(tag))
        const next = [...prev]
        uniqueTags.forEach(tag => {
          if (!next.includes(tag)) next.push(tag)
        })
        return next
      })
    } else {
      setIncludeTags(prev => prev.filter(tag => !uniqueTags.includes(tag)))
      setExcludeTags(prev => {
        const allExcluded = uniqueTags.every(tag => prev.includes(tag))
        if (allExcluded) return prev.filter(tag => !uniqueTags.includes(tag))
        const next = [...prev]
        uniqueTags.forEach(tag => {
          if (!next.includes(tag)) next.push(tag)
        })
        return next
      })
    }
    setCurrentIndex(0)
  }

  function reviewCard(grade) {
    if (!activeCard) return
    const nextSrs = calculateSrs(activeCard.srs, grade)

    let personalGrade = grade
    if (revealAtRef.current) {
      const elapsedMs = Date.now() - revealAtRef.current
      const hesitateThresholdMs = 8000
      if (elapsedMs > hesitateThresholdMs) {
        if (grade === 'good') personalGrade = 'hard'
        if (grade === 'easy') personalGrade = 'good'
      }
    }

    setCards(prev => prev.map(card => {
      if (card.id !== activeCard.id) return card
      const seen = (card.stats?.seen || 0) + 1
      const correct = (card.stats?.correct || 0) + (grade === 'good' || grade === 'easy' ? 1 : 0)
      const hard = (card.stats?.hard || 0) + (grade === 'hard' ? 1 : 0)
      const again = (card.stats?.again || 0) + (grade === 'again' ? 1 : 0)

      const intrinsicDifficulty = getIntrinsicDifficulty(card)
      let personalDifficulty = getPersonalDifficulty(card)
      if (personalGrade === 'again' || personalGrade === 'hard') {
        personalDifficulty = Math.min(5, personalDifficulty + 1)
      } else if (personalGrade === 'good' || personalGrade === 'easy') {
        personalDifficulty = Math.max(1, personalDifficulty - 1)
      }

      return {
        ...card,
        status: grade === 'again' || grade === 'hard' ? 'review' : 'know',
        personalDifficulty,
        difficulty: Math.max(intrinsicDifficulty, personalDifficulty),
        stats: { seen, correct, hard, again },
        srs: nextSrs,
        history: [...(card.history || []), { at: Date.now(), grade }].slice(-30),
      }
    }))
    setFlipped(false)
    setCurrentIndex(prev => (prev + 1) % Math.max(filteredCards.length, 1))
  }

  function setCardDifficulty(delta) {
    if (!activeCard) return
    setCards(prev => prev.map(card => {
      if (card.id !== activeCard.id) return card
      const intrinsicDifficulty = getIntrinsicDifficulty(card)
      const nextIntrinsic = clampDifficulty(intrinsicDifficulty + delta)
      const personalDifficulty = getPersonalDifficulty(card)
      return {
        ...card,
        intrinsicDifficulty: nextIntrinsic,
        difficulty: Math.max(nextIntrinsic, personalDifficulty),
      }
    }))
  }

  function toggleStar() {
    if (!activeCard) return
    setCards(prev => prev.map(card => (card.id === activeCard.id ? { ...card, starred: !card.starred } : card)))
  }

  function nextCard() {
    if (filteredCards.length === 0) return
    setFlipped(false)
    setCurrentIndex(prev => (prev + 1) % filteredCards.length)
  }

  function prevCard() {
    if (filteredCards.length === 0) return
    setFlipped(false)
    setCurrentIndex(prev => (prev - 1 + filteredCards.length) % filteredCards.length)
  }

  function resetSessionState() {
    setIncludeTags([])
    setExcludeTags([])
    setSearch('')
    setCurrentIndex(0)
    setFlipped(false)
    setShuffleSeed(0)
    setDifficultyFilter('all')
  }

  return {
    includeTags,
    setIncludeTags,
    excludeTags,
    setExcludeTags,
    search,
    setSearch,
    currentIndex,
    setCurrentIndex,
    flipped,
    setFlipped,
    shuffleSeed,
    setShuffleSeed,
    dueOnly,
    setDueOnly,
    difficultyFilter,
    setDifficultyFilter,
    groupedTags,
    tagPerformance,
    weakCards,
    filteredCards,
    simulationCards,
    quizCards,
    activeCard,
    toggleTag,
    toggleTagGroup,
    reviewCard,
    setCardDifficulty,
    toggleStar,
    nextCard,
    prevCard,
    resetSessionState,
  }
}

