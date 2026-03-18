import { useEffect, useMemo, useRef, useState } from 'react'

const STORAGE_KEY = 'flashforge-decks-v2'
const SAMPLE_FILES = ['/data/batch1.csv', '/data/batch2.csv', '/data/batch3.csv']
const DEFAULT_GROUPS = {
  Frontend: ['react', 'angular', 'css', 'scss', 'rendering', 'forms', 'performance'],
  Backend: ['spring', 'java', 'jvm', 'transactions', 'concurrency', 'api'],
  Architecture: ['system-design', 'distributed-systems', 'architecture', 'scaling', 'resilience'],
  Cloud: ['aws', 'compute', 'storage', 'messaging', 'networking'],
  Data: ['databases', 'indexing', 'database'],
  Security: ['security', 'auth', 'web'],
}

function normalizeNewlines(text = '') {
  return text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim()
}

function parseTagString(tags = '') {
  return String(tags).trim().split(/\s+/).filter(Boolean)
}

function slugify(value = '') {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48)
}

function normalizeAnswer(text = '') {
  return String(text).toLowerCase().trim().replace(/\s+/g, ' ')
}
function answerMatches(userAnswer, correctAnswer) {
  if (!correctAnswer || !userAnswer) return false
  const u = normalizeAnswer(userAnswer)
  const c = normalizeAnswer(correctAnswer)
  if (u === c) return true
  if (c.includes(u) && u.length >= 3) return true
  if (u.includes(c) && c.length >= 3) return true
  return false
}

function parseQuotedCsvLine(line) {
  const cells = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i]
    const next = line[i + 1]
    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"'
        i += 1
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      cells.push(current)
      current = ''
    } else {
      current += char
    }
  }
  cells.push(current)
  return cells
}

function parseFourColumnLine(line) {
  const quoted = parseQuotedCsvLine(line)
  if (quoted.length === 4) return quoted
  const firstComma = line.indexOf(',')
  const lastComma = line.lastIndexOf(',')
  if (firstComma === -1 || lastComma === -1 || firstComma === lastComma) return null
  const front = line.slice(0, firstComma)
  const tags = line.slice(lastComma + 1)
  const middle = line.slice(firstComma + 1, lastComma)
  const secondLastComma = middle.lastIndexOf(',')
  if (secondLastComma === -1) return null
  const back = middle.slice(0, secondLastComma)
  const why = middle.slice(secondLastComma + 1)
  return [front, back, why, tags]
}

function defaultSrs() {
  return {
    interval: 0,
    ease: 2.5,
    reps: 0,
    lapses: 0,
    dueAt: Date.now(),
    lastReviewedAt: null,
  }
}

function parseDeckCsv(rawText, sourceName = 'Imported CSV') {
  const text = normalizeNewlines(rawText)
  if (!text) return []
  const lines = text.split('\n').filter(Boolean)
  const startIndex = /^front\s*,\s*back\s*,\s*why\s*,\s*tags\s*$/i.test(lines[0]) ? 1 : 0
  const cards = []
  for (let i = startIndex; i < lines.length; i += 1) {
    const line = lines[i].trim()
    if (!line) continue
    const parsed = parseFourColumnLine(line)
    if (!parsed) continue
    const [front, back, why, tagsText] = parsed
    const tags = parseTagString(tagsText)
    cards.push({
      id: `${sourceName}-${i}-${slugify(front)}`,
      front: front.trim(),
      back: back.trim(),
      why: why.trim(),
      tags,
      source: sourceName,
      status: 'new',
      difficulty: 2,
      stats: { seen: 0, correct: 0, hard: 0, again: 0 },
      srs: defaultSrs(),
      history: [],
      starred: false,
    })
  }
  return cards.filter(card => card.front && (card.back || card.why))
}

function ensureCardShape(card) {
  return {
    ...card,
    tags: Array.isArray(card.tags) ? card.tags : parseTagString(card.tags),
    status: card.status || 'new',
    difficulty: Number(card.difficulty ?? 2),
    stats: {
      seen: card.stats?.seen || 0,
      correct: card.stats?.correct || 0,
      hard: card.stats?.hard || 0,
      again: card.stats?.again || 0,
    },
    srs: {
      ...defaultSrs(),
      ...(card.srs || {}),
      dueAt: Number(card.srs?.dueAt || Date.now()),
    },
    history: Array.isArray(card.history) ? card.history : [],
    starred: Boolean(card.starred),
  }
}

function dedupeCards(cards) {
  const seen = new Map()
  cards.forEach(raw => {
    const card = ensureCardShape(raw)
    const key = `${card.front}||${card.back}`
    if (!seen.has(key)) seen.set(key, card)
  })
  return [...seen.values()]
}

function uniqueTags(cards) {
  const counts = new Map()
  cards.forEach(card => card.tags.forEach(tag => counts.set(tag, (counts.get(tag) || 0) + 1)))
  return [...counts.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([tag, count]) => ({ tag, count }))
}

function autoGroupTags(tags) {
  const groups = new Map()
  Object.keys(DEFAULT_GROUPS).forEach(group => groups.set(group, []))
  groups.set('Other', [])

  tags.forEach(item => {
    const { tag } = item
    let matchedGroup = 'Other'
    for (const [group, keywords] of Object.entries(DEFAULT_GROUPS)) {
      if (keywords.some(keyword => tag.includes(keyword) || keyword.includes(tag))) {
        matchedGroup = group
        break
      }
    }
    groups.get(matchedGroup).push(item)
  })

  return [...groups.entries()].filter(([, items]) => items.length > 0)
}

function cardMatches(card, includeTags, excludeTags, search, dueOnly, difficultyFilter) {
  const haystack = `${card.front} ${card.back} ${card.why} ${card.tags.join(' ')}`.toLowerCase()
  const searchOk = !search || haystack.includes(search.toLowerCase())
  const includeOk = includeTags.length === 0 || includeTags.some(tag => card.tags.includes(tag))
  const excludeOk = excludeTags.length === 0 || excludeTags.every(tag => !card.tags.includes(tag))
  const dueOk = !dueOnly || (card.srs?.dueAt || 0) <= Date.now()
  const difficultyOk = difficultyFilter === 'all' || String(card.difficulty) === difficultyFilter
  return searchOk && includeOk && excludeOk && dueOk && difficultyOk
}

function getDeckStats(cards) {
  const now = Date.now()
  return cards.reduce((acc, card) => {
    acc.total += 1
    if (card.status === 'know') acc.know += 1
    if (card.status === 'review') acc.review += 1
    if (card.starred) acc.starred += 1
    if ((card.srs?.dueAt || 0) <= now) acc.due += 1
    acc.reviews += card.stats?.seen || 0
    return acc
  }, { total: 0, know: 0, review: 0, starred: 0, due: 0, reviews: 0 })
}

function getPerformanceByTag(cards) {
  const map = new Map()
  cards.forEach(card => {
    card.tags.forEach(tag => {
      const entry = map.get(tag) || { tag, seen: 0, correct: 0, hard: 0, again: 0, count: 0 }
      entry.count += 1
      entry.seen += card.stats?.seen || 0
      entry.correct += card.stats?.correct || 0
      entry.hard += card.stats?.hard || 0
      entry.again += card.stats?.again || 0
      map.set(tag, entry)
    })
  })
  return [...map.values()]
    .map(item => ({
      ...item,
      accuracy: item.seen ? Math.round((item.correct / item.seen) * 100) : 0,
      pressure: item.seen ? Math.round(((item.hard + item.again) / item.seen) * 100) : 0,
    }))
    .sort((a, b) => (a.accuracy + a.pressure) - (b.accuracy + b.pressure))
}

function getWeakCards(cards) {
  return [...cards]
    .map(card => {
      const seen = card.stats?.seen || 0
      const correct = card.stats?.correct || 0
      const accuracy = seen ? Math.round((correct / seen) * 100) : 0
      const strain = (card.stats?.hard || 0) + (card.stats?.again || 0)
      return { ...card, accuracy, strain }
    })
    .filter(card => card.stats.seen > 0)
    .sort((a, b) => (a.accuracy + a.strain * 8) - (b.accuracy + b.strain * 8))
    .slice(0, 12)
}

function calculateSrs(previous = defaultSrs(), grade) {
  const now = Date.now()
  let ease = previous.ease || 2.5
  let interval = previous.interval || 0
  let reps = previous.reps || 0
  let lapses = previous.lapses || 0

  if (grade === 'again') {
    lapses += 1
    reps = 0
    interval = 0.15
    ease = Math.max(1.3, ease - 0.2)
  } else if (grade === 'hard') {
    reps += 1
    interval = Math.max(1, interval ? interval * 1.2 : 1)
    ease = Math.max(1.3, ease - 0.15)
  } else if (grade === 'good') {
    reps += 1
    interval = interval === 0 ? 1 : interval === 1 ? 3 : Math.round(interval * ease)
  } else if (grade === 'easy') {
    reps += 1
    ease += 0.15
    interval = interval === 0 ? 3 : Math.max(4, Math.round(interval * (ease + 0.3)))
  }

  return {
    interval,
    ease: Number(ease.toFixed(2)),
    reps,
    lapses,
    dueAt: now + interval * 24 * 60 * 60 * 1000,
    lastReviewedAt: now,
  }
}

function shuffle(array, seed) {
  let currentSeed = seed
  for (let i = array.length - 1; i > 0; i -= 1) {
    currentSeed = (currentSeed * 9301 + 49297) % 233280
    const j = Math.floor((currentSeed / 233280) * (i + 1))
    ;[array[i], array[j]] = [array[j], array[i]]
  }
  return array
}

function formatDue(dueAt) {
  const diffMs = dueAt - Date.now()
  const diffDays = Math.round(diffMs / (24 * 60 * 60 * 1000))
  if (diffDays <= 0) return 'Due now'
  if (diffDays === 1) return 'Due tomorrow'
  return `Due in ${diffDays} days`
}

function escapeCsv(value = '') {
  const text = String(value ?? '')
  return `"${text.replace(/"/g, '""')}"`
}

function exportDeck(cards, name = 'flashforge-deck') {
  const header = 'Front,Back,Why,Tags'
  const rows = cards.map(card => [
    escapeCsv(card.front),
    escapeCsv(card.back),
    escapeCsv(card.why),
    escapeCsv(card.tags.join(' ')),
  ].join(','))
  const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${slugify(name) || 'flashforge-deck'}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

export default function App() {
  const [cards, setCards] = useState([])
  const [sourceText, setSourceText] = useState('')
  const [sourceName, setSourceName] = useState('Pasted Deck')
  const [includeTags, setIncludeTags] = useState([])
  const [excludeTags, setExcludeTags] = useState([])
  const [search, setSearch] = useState('')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [deckName, setDeckName] = useState('Senior Engineer Study')
  const [viewMode, setViewMode] = useState('study')
  const [shuffleSeed, setShuffleSeed] = useState(0)
  const [message, setMessage] = useState('')
  const [dueOnly, setDueOnly] = useState(true)
  const [difficultyFilter, setDifficultyFilter] = useState('all')
  const [simCount, setSimCount] = useState(12)

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCards(dedupeCards(parsed))
          return
        }
      } catch {}
    }
    loadSamples()
  }, [])

  useEffect(() => {
    if (cards.length > 0) localStorage.setItem(STORAGE_KEY, JSON.stringify(cards))
  }, [cards])

  async function loadSamples() {
    try {
      const texts = await Promise.all(SAMPLE_FILES.map(path => fetch(path).then(r => r.text())))
      const imported = dedupeCards(texts.flatMap((text, idx) => parseDeckCsv(text, `Sample Batch ${idx + 1}`)))
      setCards(imported)
      setMessage(`Loaded ${imported.length} sample cards.`)
    } catch {
      setMessage('Upload or paste one of your deck CSV files to begin.')
    }
  }

  const stats = useMemo(() => getDeckStats(cards), [cards])
  const tags = useMemo(() => uniqueTags(cards), [cards])
  const groupedTags = useMemo(() => autoGroupTags(tags), [tags])
  const tagPerformance = useMemo(() => getPerformanceByTag(cards), [cards])
  const weakCards = useMemo(() => getWeakCards(cards), [cards])

  const filteredCards = useMemo(() => {
    const selected = cards.filter(card => cardMatches(card, includeTags, excludeTags, search, dueOnly && viewMode === 'study', difficultyFilter))
    if (!shuffleSeed) return selected
    return shuffle([...selected], shuffleSeed)
  }, [cards, includeTags, excludeTags, search, shuffleSeed, dueOnly, viewMode, difficultyFilter])

  const simulationCards = useMemo(() => {
    const base = cards.filter(card => cardMatches(card, includeTags, excludeTags, search, false, difficultyFilter))
    return shuffle([...base], simCount * 811 + 7).slice(0, simCount)
  }, [cards, includeTags, excludeTags, search, difficultyFilter, simCount])

  const quizCards = useMemo(() => {
    const selected = cards.filter(card => cardMatches(card, includeTags, excludeTags, search, false, difficultyFilter))
    return shuffle([...selected], shuffleSeed + 99)
  }, [cards, includeTags, excludeTags, search, shuffleSeed, difficultyFilter])

  const activeCard = filteredCards[currentIndex] || null

  useEffect(() => {
    if (currentIndex >= filteredCards.length) setCurrentIndex(0)
  }, [filteredCards.length, currentIndex])

  function ingestCards(imported, label) {
    if (imported.length === 0) {
      setMessage('No cards found. Paste the CSV exactly as generated, including the header row.')
      return
    }
    const merged = dedupeCards([...cards, ...imported])
    setCards(merged)
    setMessage(`${label} ${imported.length} cards. Total deck size: ${merged.length}.`)
  }

  function ingestText() {
    const imported = parseDeckCsv(sourceText, sourceName)
    ingestCards(imported, 'Imported')
    setSourceText('')
  }

  function onFileUpload(event) {
    const files = [...(event.target.files || [])]
    if (!files.length) return
    Promise.all(files.map(file => file.text().then(text => ({ file, text })))).then(results => {
      const imported = results.flatMap(({ file, text }) => parseDeckCsv(text, file.name))
      ingestCards(imported, 'Imported')
    })
  }

  function toggleTag(tag, mode = 'include') {
    if (mode === 'include') {
      setExcludeTags(prev => prev.filter(item => item !== tag))
      setIncludeTags(prev => prev.includes(tag) ? prev.filter(item => item !== tag) : [...prev, tag])
    } else {
      setIncludeTags(prev => prev.filter(item => item !== tag))
      setExcludeTags(prev => prev.includes(tag) ? prev.filter(item => item !== tag) : [...prev, tag])
    }
    setCurrentIndex(0)
  }

  function reviewCard(grade) {
    if (!activeCard) return
    const nextSrs = calculateSrs(activeCard.srs, grade)
    setCards(prev => prev.map(card => {
      if (card.id !== activeCard.id) return card
      const seen = (card.stats?.seen || 0) + 1
      const correct = (card.stats?.correct || 0) + (grade === 'good' || grade === 'easy' ? 1 : 0)
      const hard = (card.stats?.hard || 0) + (grade === 'hard' ? 1 : 0)
      const again = (card.stats?.again || 0) + (grade === 'again' ? 1 : 0)
      return {
        ...card,
        status: grade === 'again' || grade === 'hard' ? 'review' : 'know',
        difficulty: grade === 'again' ? Math.min(5, card.difficulty + 1) : grade === 'easy' ? Math.max(1, card.difficulty - 1) : card.difficulty,
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
    setCards(prev => prev.map(card => card.id === activeCard.id ? {
      ...card,
      difficulty: Math.max(1, Math.min(5, card.difficulty + delta)),
    } : card))
  }

  function toggleStar() {
    if (!activeCard) return
    setCards(prev => prev.map(card => card.id === activeCard.id ? { ...card, starred: !card.starred } : card))
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

  function resetDeckState() {
    setIncludeTags([])
    setExcludeTags([])
    setSearch('')
    setCurrentIndex(0)
    setFlipped(false)
    setShuffleSeed(0)
    setDifficultyFilter('all')
  }

  return (
    <div className="app-shell">
      <aside className="sidebar glass">
        <div>
          <div className="eyebrow">FlashForge Pro</div>
          <h1>Local-first interview flashcards</h1>
          <p className="muted">Import all CSV batches, auto-group tags, study with a calmer spaced repetition rhythm, and track your weak spots.</p>
        </div>

        <section className="panel-stack">
          <div className="mini-panel">
            <label className="label">Deck title</label>
            <input value={deckName} onChange={e => setDeckName(e.target.value)} className="input" />
          </div>

          <div className="mini-panel">
            <div className="stats-grid five">
              <Stat label="Cards" value={stats.total} />
              <Stat label="Due now" value={stats.due} />
              <Stat label="Know" value={stats.know} />
              <Stat label="Review" value={stats.review} />
              <Stat label="Starred" value={stats.starred} />
            </div>
          </div>

          <div className="mini-panel">
            <label className="label">Upload deck CSV</label>
            <input type="file" accept=".csv,text/csv" multiple onChange={onFileUpload} className="input file-input" />
            <div className="divider">or paste raw deck text</div>
            <input value={sourceName} onChange={e => setSourceName(e.target.value)} className="input" placeholder="Deck name" />
            <textarea value={sourceText} onChange={e => setSourceText(e.target.value)} className="textarea" placeholder="Paste the CSV from chat here…" />
            <div className="button-row">
              <button className="btn primary" onClick={ingestText}>Import text</button>
              <button className="btn" onClick={loadSamples}>Reload samples</button>
            </div>
          </div>

          <div className="mini-panel">
            <label className="label">Search + filters</label>
            <input value={search} onChange={e => setSearch(e.target.value)} className="input" placeholder="Search questions, answers, tags…" />
            <div className="button-row compact wrap-top">
              <button className={`btn smallish ${dueOnly ? 'primary' : ''}`} onClick={() => setDueOnly(prev => !prev)}>Due only</button>
              <button className="btn smallish" onClick={() => setShuffleSeed(Date.now())}>Shuffle</button>
              <button className="btn smallish" onClick={resetDeckState}>Reset</button>
              <button className="btn smallish" onClick={() => exportDeck(filteredCards, deckName)}>Export filtered</button>
            </div>
            <div className="difficulty-pills">
              {['all', '1', '2', '3', '4', '5'].map(level => (
                <button key={level} className={`pill ${difficultyFilter === level ? 'active' : ''}`} onClick={() => setDifficultyFilter(level)}>
                  {level === 'all' ? 'All difficulties' : `Difficulty ${level}`}
                </button>
              ))}
            </div>
          </div>
        </section>

        {message ? <p className="message">{message}</p> : null}
      </aside>

      <main className="main-area">
        <header className="hero glass">
          <div>
            <div className="eyebrow">Deck Builder</div>
            <h2>{deckName}</h2>
            <p className="muted">{filteredCards.length} cards match the current filters.</p>
          </div>
          <div className="segmented wrap-tabs">
            {['study', 'quiz', 'browse', 'analytics', 'simulate'].map(mode => (
              <button key={mode} className={viewMode === mode ? 'seg active' : 'seg'} onClick={() => setViewMode(mode)}>
                {mode === 'simulate' ? 'Interview' : mode[0].toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>
        </header>

        <section className="content-grid">
          <TagPanel groupedTags={groupedTags} includeTags={includeTags} excludeTags={excludeTags} toggleTag={toggleTag} />

          {viewMode === 'study' && (
            <StudyView
              activeCard={activeCard}
              currentIndex={currentIndex}
              total={filteredCards.length}
              flipped={flipped}
              onFlip={() => setFlipped(prev => !prev)}
              onPrev={prevCard}
              onNext={nextCard}
              onReview={reviewCard}
              onStar={toggleStar}
              onDifficulty={setCardDifficulty}
            />
          )}

          {viewMode === 'quiz' && <QuizView cards={quizCards} />}

          {viewMode === 'browse' && <BrowserView cards={filteredCards} />}

          {viewMode === 'analytics' && (
            <AnalyticsView cards={cards} tagPerformance={tagPerformance} weakCards={weakCards} groupedTags={groupedTags} />
          )}

          {viewMode === 'simulate' && (
            <SimulationView cards={simulationCards} simCount={simCount} setSimCount={setSimCount} />
          )}
        </section>
      </main>
    </div>
  )
}

function TagPanel({ groupedTags, includeTags, excludeTags, toggleTag }) {
  return (
    <div className="tag-panel glass">
      <div className="panel-header">
        <h3>Tag groups</h3>
        <span>Auto grouped</span>
      </div>
      <p className="muted small">Click a tag to include it. Use the minus button to exclude it. Groups are inferred automatically from the tag names.</p>
      <div className="active-filters">
        {includeTags.map(tag => <span key={`i-${tag}`} className="filter-chip include">+ {tag}</span>)}
        {excludeTags.map(tag => <span key={`e-${tag}`} className="filter-chip exclude">− {tag}</span>)}
      </div>
      <div className="tag-groups-scroll">
        {groupedTags.map(([groupName, tags]) => (
          <section key={groupName} className="tag-group-block">
            <div className="tag-group-title">{groupName}</div>
            <div className="tag-cloud">
              {tags.map(({ tag, count }) => {
                const include = includeTags.includes(tag)
                const exclude = excludeTags.includes(tag)
                return (
                  <div key={tag} className={`tag-card ${include ? 'include' : ''} ${exclude ? 'exclude' : ''}`}>
                    <button className="tag-main" onClick={() => toggleTag(tag, 'include')}>
                      <span>{tag}</span>
                      <strong>{count}</strong>
                    </button>
                    <button className="tag-minus" onClick={() => toggleTag(tag, 'exclude')}>−</button>
                  </div>
                )
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}

function StudyView({ activeCard, currentIndex, total, flipped, onFlip, onPrev, onNext, onReview, onStar, onDifficulty }) {
  return (
    <div className="study-panel glass">
      <div className="panel-header">
        <h3>Study mode</h3>
        <span>{total === 0 ? 'No cards' : `${currentIndex + 1} / ${total}`}</span>
      </div>
      {!activeCard ? (
        <div className="empty-state">No cards match the current filters.</div>
      ) : (
        <>
          <button className={`flashcard ${flipped ? 'flipped' : ''}`} onClick={onFlip}>
            <div className="glow glow-a" />
            <div className="glow glow-b" />
            <div className="flashcard-inner">
              <div className="card-meta">Question</div>
              <h4>{activeCard.front}</h4>
              <div className="chip-row">{activeCard.tags.map(tag => <span className="tiny-chip" key={tag}>{tag}</span>)}</div>
              <div className="meta-grid compact-study">
                <MiniMeta label="Difficulty" value={activeCard.difficulty} />
                <MiniMeta label="Status" value={activeCard.status} />
                <MiniMeta label="Schedule" value={formatDue(activeCard.srs?.dueAt || Date.now())} />
              </div>
              {!flipped && <div className="hint">Tap card or press Reveal answer</div>}
              {flipped && (
                <div className="answer-block">
                  <div className="card-meta">Answer</div>
                  <p>{activeCard.back}</p>
                  {activeCard.why ? (
                    <div className="why-box">
                      <strong>Why it matters</strong>
                      <p>{activeCard.why}</p>
                    </div>
                  ) : null}
                </div>
              )}
              <div className="meta-grid compact-study top-gap">
                <MiniMeta label="Seen" value={activeCard.stats?.seen || 0} />
                <MiniMeta label="Correct" value={activeCard.stats?.correct || 0} />
                <MiniMeta label="Ease" value={activeCard.srs?.ease || 2.5} />
              </div>
            </div>
          </button>

          <div className="button-row spread top-gap">
            <button className="btn" onClick={onPrev}>Previous</button>
            <button className="btn" onClick={onFlip}>{flipped ? 'Show question' : 'Reveal answer'}</button>
            <button className="btn" onClick={onNext}>Skip</button>
          </div>

          <div className="review-grid top-gap">
            <button className="review-btn again" onClick={() => onReview('again')}>Again<br /><span>15 min reset</span></button>
            <button className="review-btn hard" onClick={() => onReview('hard')}>Hard<br /><span>slower growth</span></button>
            <button className="review-btn good" onClick={() => onReview('good')}>Good<br /><span>normal spacing</span></button>
            <button className="review-btn easy" onClick={() => onReview('easy')}>Easy<br /><span>longer gap</span></button>
          </div>

          <div className="button-row spread top-gap">
            <button className="btn" onClick={() => onDifficulty(-1)}>Easier</button>
            <button className="btn" onClick={onStar}>Star / unstar</button>
            <button className="btn" onClick={() => onDifficulty(1)}>Harder</button>
          </div>
        </>
      )}
    </div>
  )
}

function QuizView({ cards }) {
  const [quizIndex, setQuizIndex] = useState(0)
  const [userAnswer, setUserAnswer] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [wasCorrect, setWasCorrect] = useState(false)
  const totalRef = useRef(cards.length)
  totalRef.current = cards.length

  const card = cards[quizIndex] || null
  console.log(quizIndex, cards);
  const questionType = card?.why ? (quizIndex % 2 === 0 ? 'what' : 'why') : 'what'
  const total = cards.length

  function handleSubmit(e) {
    e?.preventDefault()
    if (!card || !userAnswer.trim()) return
    const correct = questionType === 'what' ? card.back : card.why
    const correctFlag = answerMatches(userAnswer.trim(), correct)
    setWasCorrect(correctFlag)
    setSubmitted(true)
  }

  function handleNext() {
    console.log('handleNext', totalRef.current)
    const n = Math.max(totalRef.current, 1)
    console.log('handleNext', n)
    console.log('totalRef', totalRef.current);
    setQuizIndex(prev => (prev + 1) % n)
    setUserAnswer('')
    setSubmitted(false)
  }

  if (!total) {
    return (
      <div className="study-panel glass">
        <div className="panel-header">
          <h3>Quiz mode</h3>
        </div>
        <div className="empty-state">No cards match the current filters.</div>
      </div>
    )
  }

  return (
    <div className="study-panel glass">
      <div className="panel-header">
        <h3>Quiz mode</h3>
        <span>{total === 0 ? '' : `${quizIndex + 1} / ${total}`}</span>
      </div>
      <div className="quiz-card" key={quizIndex}>
        <div className="glow glow-a" />
        <div className="glow glow-b" />
        <div className="flashcard-inner">
          <div className="card-meta">{questionType === 'what' ? 'What' : 'Why'}</div>
          <h4>{card.front}</h4>
          {questionType === 'why' && (
            <div className="quiz-context">
              <strong>Answer:</strong> <span>{card.back}</span>
              <p className="quiz-prompt">Why does this matter?</p>
            </div>
          )}
          {!submitted ? (
            <form onSubmit={handleSubmit} className="quiz-form">
              <input
                type="text"
                className="input quiz-input"
                placeholder={questionType === 'what' ? 'Type your answer…' : 'Explain why it matters…'}
                value={userAnswer}
                onChange={e => setUserAnswer(e.target.value)}
                autoFocus
              />
              <button type="submit" className="btn primary" disabled={!userAnswer.trim()}>Submit</button>
            </form>
          ) : (
            <div className="quiz-result">
              {wasCorrect ? (
                <p className="quiz-feedback correct">Correct! Well done.</p>
              ) : (
                <div className="quiz-feedback wrong">
                  <p><strong>Not quite.</strong></p>
                  {questionType === 'what' && <p><strong>Correct answer:</strong> {card.back}</p>}
                  {card.why ? (
                    <div className="why-box">
                      <strong>Why it matters</strong>
                      <p>{card.why}</p>
                    </div>
                  ) : null}
                </div>
              )}
              <button type="button" className="btn primary top-gap" onClick={handleNext}>Next question</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function BrowserView({ cards }) {
  return (
    <div className="browser-panel glass">
      <div className="panel-header">
        <h3>Card browser</h3>
        <span>{cards.length} results</span>
      </div>
      <div className="browser-list">
        {cards.map(card => (
          <article className="browser-card" key={card.id}>
            <div className="card-meta-row">
              <div className="card-meta">Question</div>
              <div className="chip-row">{card.tags.map(tag => <span className="tiny-chip" key={`${card.id}-${tag}`}>{tag}</span>)}</div>
            </div>
            <h4>{card.front}</h4>
            <p><strong>Answer:</strong> {card.back}</p>
            {card.why ? <p><strong>Why:</strong> {card.why}</p> : null}
            <div className="meta-grid">
              <MiniMeta label="Difficulty" value={card.difficulty} />
              <MiniMeta label="Seen" value={card.stats?.seen || 0} />
              <MiniMeta label="Due" value={formatDue(card.srs?.dueAt || Date.now())} />
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}

function AnalyticsView({ cards, tagPerformance, weakCards, groupedTags }) {
  const overallAccuracy = useMemo(() => {
    const seen = cards.reduce((sum, card) => sum + (card.stats?.seen || 0), 0)
    const correct = cards.reduce((sum, card) => sum + (card.stats?.correct || 0), 0)
    return seen ? Math.round((correct / seen) * 100) : 0
  }, [cards])

  return (
    <div className="analytics-panel glass">
      <div className="panel-header">
        <h3>Analytics + weak areas</h3>
        <span>{overallAccuracy}% overall accuracy</span>
      </div>
      <div className="analytics-grid">
        <section className="analytics-card">
          <h4>Weak areas dashboard</h4>
          <div className="weak-list">
            {tagPerformance.slice(0, 8).map(item => (
              <div key={item.tag} className="weak-row">
                <div>
                  <strong>{item.tag}</strong>
                  <div className="muted small">{item.seen || 0} reviews · {item.count} cards</div>
                </div>
                <div className="weak-metrics">
                  <span>{item.accuracy}%</span>
                  <div className="bar"><div style={{ width: `${Math.max(8, item.accuracy)}%` }} /></div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="analytics-card">
          <h4>Most missed cards</h4>
          <div className="missed-list">
            {weakCards.map(card => (
              <div key={card.id} className="missed-card">
                <strong>{card.front}</strong>
                <div className="muted small">Accuracy {card.accuracy}% · strain {card.strain}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="analytics-card span-2">
          <h4>Tag graph visualization</h4>
          <TagGraph groupedTags={groupedTags} performance={tagPerformance} />
        </section>
      </div>
    </div>
  )
}

function SimulationView({ cards, simCount, setSimCount }) {
  const [revealedIds, setRevealedIds] = useState([])
  useEffect(() => setRevealedIds([]), [cards])

  function toggle(id) {
    setRevealedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  return (
    <div className="browser-panel glass">
      <div className="panel-header">
        <h3>Interview simulation mode</h3>
        <span>{cards.length} prompts</span>
      </div>
      <div className="button-row compact wrap-top">
        {[8, 12, 20].map(count => (
          <button key={count} className={`pill ${simCount === count ? 'active' : ''}`} onClick={() => setSimCount(count)}>{count} questions</button>
        ))}
      </div>
      <div className="simulation-list top-gap">
        {cards.map((card, index) => {
          const revealed = revealedIds.includes(card.id)
          return (
            <article key={card.id} className="simulation-card">
              <div className="card-meta">Prompt {index + 1}</div>
              <h4>{card.front}</h4>
              <div className="chip-row">{card.tags.map(tag => <span key={`${card.id}-${tag}`} className="tiny-chip">{tag}</span>)}</div>
              <div className="button-row compact top-gap">
                <button className="btn" onClick={() => toggle(card.id)}>{revealed ? 'Hide answer' : 'Reveal answer'}</button>
              </div>
              {revealed ? (
                <div className="why-box top-gap">
                  <strong>Strong answer</strong>
                  <p>{card.back}</p>
                  {card.why ? <p className="muted"><strong>Why:</strong> {card.why}</p> : null}
                </div>
              ) : null}
            </article>
          )
        })}
      </div>
    </div>
  )
}

function TagGraph({ groupedTags, performance }) {
  const perfMap = new Map(performance.map(item => [item.tag, item.accuracy || 0]))
  const width = 760
  const height = 300
  const centerX = 380
  const centerY = 150
  const radius = 100
  const tags = groupedTags.flatMap(([group, items], groupIndex) => items.slice(0, 4).map((item, i) => ({ ...item, group, groupIndex, i }))).slice(0, 16)

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="tag-graph">
      <defs>
        <linearGradient id="graphStroke" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#8ef0da" />
          <stop offset="100%" stopColor="#6ea8fe" />
        </linearGradient>
      </defs>
      <circle cx={centerX} cy={centerY} r="42" fill="rgba(110,168,254,0.18)" stroke="rgba(110,168,254,0.45)" />
      <text x={centerX} y={centerY} textAnchor="middle" dominantBaseline="middle" fill="#edf3ff" fontSize="14">Topics</text>
      {tags.map((tag, idx) => {
        const angle = (Math.PI * 2 * idx) / tags.length
        const x = centerX + Math.cos(angle) * radius * 1.6
        const y = centerY + Math.sin(angle) * radius
        const accuracy = perfMap.get(tag.tag) || 0
        const size = 12 + Math.max(0, accuracy / 10)
        return (
          <g key={tag.tag}>
            <line x1={centerX} y1={centerY} x2={x} y2={y} stroke="url(#graphStroke)" strokeOpacity="0.45" />
            <circle cx={x} cy={y} r={size} fill="rgba(142,240,218,0.15)" stroke="rgba(142,240,218,0.4)" />
            <text x={x} y={y - size - 6} textAnchor="middle" fill="#dfe8ff" fontSize="11">{tag.tag}</text>
            <text x={x} y={y + 4} textAnchor="middle" fill="#8ef0da" fontSize="10">{accuracy}%</text>
          </g>
        )
      })}
    </svg>
  )
}

function MiniMeta({ label, value }) {
  return (
    <div className="mini-meta">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function Stat({ label, value }) {
  return (
    <div className="stat-box">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  )
}
