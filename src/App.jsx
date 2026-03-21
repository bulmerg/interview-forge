import { useEffect, useState } from 'react'

import QuizViewComponent from './components/views/QuizView'
import AnalyticsViewComponent from './components/views/AnalyticsView'
import SimulationViewComponent from './components/views/SimulationView'
import CreateViewComponent from './components/views/CreateView'
import ImportViewComponent from './components/views/ImportView'
import HelpViewComponent from './components/views/HelpView'
import LandingPage from './components/LandingPage'

import Sidebar from './components/Sidebar'
import Header from './components/Header'
import TagGroups from './components/TagGroups'
import StudyMode from './components/StudyMode'
import AppContext from './context/AppContext'
import { dedupeCards, deckToCsv, exportDeck, parseDeckCsv } from './lib/deckEngine'
import {
  readAppState,
  readCsvBackupFromIndexedDb,
  readHasSeenOnboardingFromIndexedDb,
  saveCsvBackupToIndexedDb,
  writeAppState,
  writeHasSeenOnboardingToIndexedDb,
} from './lib/persistence'
import { clampDifficulty } from './lib/shared'
import useDeckImport from './hooks/useDeckImport'
import useStudySession from './hooks/useStudySession'
import useDifficultyFilters from './hooks/useDifficultyFilters'

const SAMPLE_CSV_FILES = Object.keys(import.meta.glob('../public/data/*.csv'))
  .map(path => path.replace('../public', ''))
  .sort()

export default function App() {
  const [cards, setCards] = useState([])
  const [deckName, setDeckName] = useState('Senior Engineer Study')
  const [hasHydrated, setHasHydrated] = useState(false)
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false)
  const [hasResolvedOnboarding, setHasResolvedOnboarding] = useState(false)
  const [viewMode, setViewMode] = useState('study')
  const [studyViewMode, setStudyViewMode] = useState('setup')
  const [simCount, setSimCount] = useState(12)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const {
    difficultyTargetMin,
    setDifficultyTargetMin,
    difficultyTargetMax,
    setDifficultyTargetMax,
    difficultySource,
    setDifficultySource,
    weakCardBoost,
    setWeakCardBoost,
    resetDifficultyFilters,
  } = useDifficultyFilters()

  const {
    sourceText,
    setSourceText,
    sourceName,
    setSourceName,
    importOverwriteMode,
    setImportOverwriteMode,
    message,
    setMessage,
    ingestText,
    onFileUpload,
    loadSamples,
    clearDeck,
  } = useDeckImport({ cards, setCards })

  const {
    includeTags,
    excludeTags,
    search,
    setSearch,
    currentIndex,
    setCurrentIndex,
    flipped,
    setFlipped,
    setShuffleSeed,
    dueOnly,
    setDueOnly,
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
  } = useStudySession({
    cards,
    setCards,
    simCount,
    viewMode,
    difficultyTargetMin,
    difficultyTargetMax,
    difficultySource,
    weakCardBoost,
  })

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const saved = await readAppState()
      if (cancelled) return
      if (saved?.cards?.length) {
        setCards(dedupeCards(saved.cards))
        if (saved.deckName) setDeckName(saved.deckName)
      } else {
        await loadSamples(SAMPLE_CSV_FILES)
      }
      if (!cancelled) setHasHydrated(true)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const seen = await readHasSeenOnboardingFromIndexedDb()
        if (!cancelled) setHasSeenOnboarding(seen)
      } catch {
        if (!cancelled) setHasSeenOnboarding(false)
      } finally {
        if (!cancelled) setHasResolvedOnboarding(true)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!hasHydrated) return
    writeAppState({ cards, deckName }).catch(() => {})
  }, [cards, deckName, hasHydrated])

  function resetDeckState() {
    resetSessionState()
    resetDifficultyFilters()
  }

  async function handleClearDeck() {
    const didClear = await clearDeck()
    if (didClear) {
      resetSessionState()
      resetDifficultyFilters()
    }
  }

  async function backupDeck() {
    const csv = deckToCsv(cards)
    await saveCsvBackupToIndexedDb(csv)
    const now = new Date()
    const stamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${deckName || 'interviewforge-deck'}-backup-${stamp}.csv`
    link.click()
    URL.revokeObjectURL(url)
    setMessage(`Backup saved to IndexedDB and downloaded as CSV (${cards.length} cards).`)
  }

  async function restoreDeckFromBackup() {
    const backup = await readCsvBackupFromIndexedDb()
    if (!backup) {
      setMessage('No IndexedDB backup found yet. Create one with Backup CSV first.')
      return
    }
    const restored = dedupeCards(parseDeckCsv(backup, 'Local Backup'))
    if (!restored.length) {
      setMessage('Backup CSV exists but no valid cards were found in it.')
      return
    }
    resetDeckState()
    setCards(restored)
    setMessage(`Restored ${restored.length} cards from local backup.`)
  }

  function addCardsToDeck(drafts, sourceLabel = 'Created') {
    const now = Date.now()
    const newCards = (drafts || [])
      .map((draft, index) => {
        const tags = Array.isArray(draft.tags)
          ? draft.tags
          : String(draft.tags || '').split(/\s+/).filter(Boolean)
        const intrinsicDifficulty = clampDifficulty(Number(draft.intrinsicDifficulty || 2))
        return {
          id: `${sourceLabel}-${now}-${index}`,
          front: String(draft.front || '').trim(),
          back: String(draft.back || '').trim(),
          why: String(draft.why || '').trim(),
          when: String(draft.when || '').trim(),
          tradeoffs: String(draft.tradeoffs || '').trim(),
          trap: String(draft.trap || '').trim(),
          scenario: String(draft.scenario || '').trim(),
          tags,
          source: sourceLabel,
          status: 'new',
          intrinsicDifficulty,
          personalDifficulty: 2,
          difficulty: Math.max(intrinsicDifficulty, 2),
          stats: { seen: 0, correct: 0, hard: 0, again: 0 },
          srs: { interval: 0, ease: 2.5, reps: 0, lapses: 0, dueAt: now, lastReviewedAt: null },
          history: [],
          starred: false,
        }
      })
      .filter(card => card.front && card.back)

    if (!newCards.length) return 0
    const merged = dedupeCards([...cards, ...newCards])
    const added = Math.max(merged.length - cards.length, 0)
    setCards(merged)
    return added
  }

  function adjustDifficultyTargetMin(delta) {
    setDifficultyTargetMin(prev => {
      const next = Math.max(1, Math.min(5, prev + delta))
      return Math.min(next, difficultyTargetMax)
    })
    setFlipped(false)
    setCurrentIndex(0)
  }

  function adjustDifficultyTargetMax(delta) {
    setDifficultyTargetMax(prev => {
      const next = Math.max(1, Math.min(5, prev + delta))
      return Math.max(next, difficultyTargetMin)
    })
    setFlipped(false)
    setCurrentIndex(0)
  }

  function completeOnboardingAndNavigate(nextViewMode) {
    setHasSeenOnboarding(true)
    setViewMode(nextViewMode)
    writeHasSeenOnboardingToIndexedDb(true).catch(() => {})
  }

  function handleSetViewMode(nextViewMode) {
    setViewMode(nextViewMode)
    if (nextViewMode !== 'study') {
      setStudyViewMode('setup')
    }
  }

  const contextValue = {
    // Core data
    cards,
    groupedTags,
    includeTags,
    excludeTags,
    activeCard,
    currentIndex,
    filteredCount: filteredCards.length,
    flipped,
    deckName,
    message,

    // View / layout
    viewMode,
    studyViewMode,
    sidebarCollapsed,
    onSetViewMode: handleSetViewMode,
    onToggleSidebarCollapsed: () => setSidebarCollapsed(prev => !prev),

    // Sidebar controls
    setDeckName,
    onFileUpload,
    importOverwriteMode,
    setImportOverwriteMode,
    sourceName,
    setSourceName,
    sourceText,
    setSourceText,
    ingestText,
    loadSamples: () => loadSamples(SAMPLE_CSV_FILES),
    search,
    setSearch,
    dueOnly,
    setDueOnly,
    onShuffle: () => setShuffleSeed(Date.now()),
    resetDeckState,
    exportFiltered: () => exportDeck(filteredCards, deckName),
    backupDeck,
    restoreDeckFromBackup,
    clearDeck: handleClearDeck,
    difficultyTargetMin,
    difficultyTargetMax,
    adjustDifficultyTargetMin,
    adjustDifficultyTargetMax,
    difficultySource,
    setDifficultySource,
    onDifficultySourceReset: () => {
      setCurrentIndex(0)
      setFlipped(false)
    },
    weakCardBoost,
    onToggleWeakCardBoost: () => {
      setWeakCardBoost(prev => !prev)
      setCurrentIndex(0)
      setFlipped(false)
    },

    // Study actions
    toggleTag,
    toggleTagGroup,
    onFlip: () => setFlipped(prev => !prev),
    onPrev: prevCard,
    onNext: nextCard,
    onReview: reviewCard,
    onStar: toggleStar,
    onCardDifficulty: setCardDifficulty,
    addCardsToDeck,
  }

  const isStudyFocusMode = viewMode === 'study' && studyViewMode === 'focus'
  const showTagPanel = !isStudyFocusMode && ['study', 'quiz', 'interview', 'analytics'].includes(viewMode)
  const showSidebar = !isStudyFocusMode
  const showHeader = !isStudyFocusMode
  const contentGridClass = `content-grid ${showTagPanel ? '' : 'single-column'}`

  if (!hasHydrated || !hasResolvedOnboarding) {
    return null
  }

  if (!hasSeenOnboarding) {
    return (
      <LandingPage
        hasCards={cards.length > 0}
        onSelectPrimaryAction={completeOnboardingAndNavigate}
        onSelectImport={() => completeOnboardingAndNavigate('import')}
      />
    )
  }

  return (
    <AppContext.Provider value={contextValue}>
      <div className={`app-shell ${sidebarCollapsed ? 'sidebar-collapsed' : ''} ${isStudyFocusMode ? 'focus-mode' : ''}`}>
        {showSidebar ? <Sidebar /> : null}

        <main className="main-area">
          {showHeader ? <Header /> : null}

          <section className={contentGridClass.trim()}>
            {showTagPanel ? <TagGroups /> : null}

            {viewMode === 'study' && (
              <StudyMode
                studyViewMode={studyViewMode}
                onEnterFocusMode={() => setStudyViewMode('focus')}
                onExitFocusMode={() => setStudyViewMode('setup')}
                onAdjustPractice={() => setStudyViewMode('setup')}
              />
            )}

            {viewMode === 'quiz' && <QuizViewComponent cards={quizCards} />}

            {viewMode === 'analytics' && (
              <AnalyticsViewComponent cards={cards} tagPerformance={tagPerformance} weakCards={weakCards} groupedTags={groupedTags} />
            )}

            {viewMode === 'interview' && (
              <SimulationViewComponent cards={simulationCards} simCount={simCount} setSimCount={setSimCount} />
            )}

            {viewMode === 'create' && (
              <CreateViewComponent onAddCards={addCardsToDeck} onMessage={setMessage} />
            )}

            {viewMode === 'import' && (
              <ImportViewComponent
                importOverwriteMode={importOverwriteMode}
                setImportOverwriteMode={setImportOverwriteMode}
                onFileUpload={onFileUpload}
                sourceName={sourceName}
                setSourceName={setSourceName}
                sourceText={sourceText}
                setSourceText={setSourceText}
                ingestText={ingestText}
                loadSamples={() => loadSamples(SAMPLE_CSV_FILES)}
              />
            )}

            {viewMode === 'help' && <HelpViewComponent />}
          </section>
        </main>
      </div>
    </AppContext.Provider>
  )
}

