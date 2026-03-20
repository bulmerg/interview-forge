import {
  clampDifficulty,
  getEffectiveDifficulty,
  getIntrinsicDifficulty,
  getPersonalDifficulty,
} from './shared'

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
  return String(tags)
    .trim()
    .split(/[\s,]+/)
    .map(tag => tag.trim())
    .filter(Boolean)
}

function slugify(value = '') {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48)
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

function parseLegacyFourColumnLine(line) {
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

function normalizeHeaderCell(value = '') {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, '')
}

function looksLikeDeckHeader(cells) {
  if (!Array.isArray(cells) || cells.length < 4) return false
  const normalized = new Set(cells.map(normalizeHeaderCell))
  return normalized.has('front') && normalized.has('back') && normalized.has('why')
}

function parseIntrinsicDifficulty(rawValue) {
  if (rawValue === null || rawValue === undefined || String(rawValue).trim() === '') return null
  const n = Number(rawValue)
  if (!Number.isFinite(n)) return null
  return clampDifficulty(Math.round(n))
}

function buildHeaderIndex(headerCells = []) {
  const index = {}
  headerCells.forEach((cell, idx) => {
    const normalized = normalizeHeaderCell(cell)
    if (normalized) index[normalized] = idx
  })
  return index
}

function looksLikeTagText(text = '') {
  const parts = parseTagString(text)
  return parts.length > 0 && parts.every(part => /^[a-z0-9][a-z0-9-]*$/i.test(part))
}

function repairLikelyFiveColumnMisparse(card) {
  const tags = Array.isArray(card.tags) ? card.tags : parseTagString(card.tags)
  const hasSingleNumericTag = tags.length === 1 && /^\d+$/.test(String(tags[0]))
  const back = String(card.back ?? '').trim()
  const why = String(card.why ?? '').trim()

  if (!hasSingleNumericTag || !back.includes(',') || !looksLikeTagText(why)) {
    return card
  }

  const splitIndex = back.lastIndexOf(',')
  if (splitIndex <= 0 || splitIndex >= back.length - 1) return card

  const recoveredBack = back.slice(0, splitIndex).trim()
  const recoveredWhy = back.slice(splitIndex + 1).trim()
  const recoveredTags = parseTagString(why)
  if (!recoveredBack || !recoveredWhy || recoveredTags.length === 0) return card

  return {
    ...card,
    back: recoveredBack,
    why: recoveredWhy,
    tags: recoveredTags,
    intrinsicDifficulty: clampDifficulty(Number(card.intrinsicDifficulty ?? tags[0] ?? 2)),
  }
}

function parseDeckRow(line, headerIndex = null) {
  const cells = parseQuotedCsvLine(line).map(cell => String(cell ?? '').trim())
  if (cells.length >= 4) {
    const readCell = (name, fallbackIndex) => {
      if (headerIndex) {
        if (Number.isInteger(headerIndex[name])) {
          return String(cells[headerIndex[name]] ?? '').trim()
        }
        return ''
      }
      const idx = fallbackIndex
      return String(cells[idx] ?? '').trim()
    }
    return {
      front: readCell('front', 0),
      back: readCell('back', 1),
      why: readCell('why', 2),
      tagsText: readCell('tags', 3),
      intrinsicDifficulty: parseIntrinsicDifficulty(readCell('intrinsicdifficulty', 4)),
      when: readCell('when', 3),
      tradeoffs: readCell('tradeoffs', 4),
      trap: readCell('trap', 5),
      scenario: readCell('scenario', 6),
    }
  }
  const legacy = parseLegacyFourColumnLine(line)
  if (!legacy) return null
  const [front, back, why, tagsText] = legacy
  return { front, back, why, tagsText, intrinsicDifficulty: null, when: '', tradeoffs: '', trap: '', scenario: '' }
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

export function parseDeckCsv(rawText, sourceName = 'Imported CSV') {
  const text = normalizeNewlines(rawText)
  if (!text) return []
  const lines = text.split('\n').filter(Boolean)
  const headerCells = parseQuotedCsvLine(lines[0]).map(cell => String(cell ?? '').trim())
  const startIndex = looksLikeDeckHeader(headerCells) ? 1 : 0
  const headerIndex = startIndex ? buildHeaderIndex(headerCells) : null
  const cards = []
  for (let i = startIndex; i < lines.length; i += 1) {
    const line = lines[i].trim()
    if (!line) continue
    const parsed = parseDeckRow(line, headerIndex)
    if (!parsed) continue
    const {
      front,
      back,
      why,
      tagsText,
      intrinsicDifficulty: parsedIntrinsic,
      when,
      tradeoffs,
      trap,
      scenario,
    } = parsed
    const tags = parseTagString(tagsText)
    const intrinsicDifficulty = parsedIntrinsic ?? 2
    cards.push({
      id: `${sourceName}-${i}-${slugify(front)}`,
      front: front.trim(),
      back: back.trim(),
      why: why.trim(),
      when: String(when ?? '').trim(),
      tradeoffs: String(tradeoffs ?? '').trim(),
      trap: String(trap ?? '').trim(),
      scenario: String(scenario ?? '').trim(),
      tags,
      source: sourceName,
      status: 'new',
      intrinsicDifficulty,
      personalDifficulty: 2,
      difficulty: Math.max(intrinsicDifficulty, 2),
      stats: { seen: 0, correct: 0, hard: 0, again: 0 },
      srs: defaultSrs(),
      history: [],
      starred: false,
    })
  }
  return cards.filter(card => card.front && (card.back || card.why))
}

function ensureCardShape(card) {
  const repaired = repairLikelyFiveColumnMisparse(card)
  const normalizedTags = Array.isArray(repaired.tags) ? repaired.tags : parseTagString(repaired.tags)
  const intrinsicDifficulty = clampDifficulty(Number(repaired.intrinsicDifficulty ?? repaired.difficulty ?? 2))
  const personalDifficulty = clampDifficulty(Number(repaired.personalDifficulty ?? repaired.difficulty ?? intrinsicDifficulty))
  const difficulty = Math.max(intrinsicDifficulty, personalDifficulty)
  return {
    ...repaired,
    tags: normalizedTags,
    when: String(repaired.when ?? '').trim(),
    tradeoffs: String(repaired.tradeoffs ?? '').trim(),
    trap: String(repaired.trap ?? '').trim(),
    scenario: String(repaired.scenario ?? '').trim(),
    status: repaired.status || 'new',
    intrinsicDifficulty,
    personalDifficulty,
    difficulty,
    stats: {
      seen: repaired.stats?.seen || 0,
      correct: repaired.stats?.correct || 0,
      hard: repaired.stats?.hard || 0,
      again: repaired.stats?.again || 0,
    },
    srs: {
      ...defaultSrs(),
      ...(repaired.srs || {}),
      dueAt: Number(repaired.srs?.dueAt || Date.now()),
    },
    history: Array.isArray(repaired.history) ? repaired.history : [],
    starred: Boolean(repaired.starred),
  }
}

export function dedupeCards(cards) {
  const seen = new Map()
  cards.forEach(raw => {
    const card = ensureCardShape(raw)
    if (
      normalizeHeaderCell(card.front) === 'front' &&
      normalizeHeaderCell(card.back) === 'back' &&
      normalizeHeaderCell(card.why) === 'why'
    ) {
      return
    }
    const key = `${card.front}||${card.back}`
    if (!seen.has(key)) seen.set(key, card)
  })
  return [...seen.values()]
}

function getCardKey(card) {
  return `${String(card.front ?? '').trim()}||${String(card.back ?? '').trim()}`
}

export function mergeImportedCards(existingCards, importedCards, { overwriteIntrinsicDifficulty }) {
  const existingByKey = new Map(existingCards.map(card => [getCardKey(card), card]))
  const updatedByKey = new Map()
  const addedCards = []
  const importedUnique = dedupeCards(importedCards)

  importedUnique.forEach(imp => {
    const key = getCardKey(imp)
    const existing = existingByKey.get(key)
    if (!existing) {
      addedCards.push(imp)
      return
    }
    const nextIntrinsicDifficulty = overwriteIntrinsicDifficulty ? imp.intrinsicDifficulty : existing.intrinsicDifficulty
    const nextPersonalDifficulty = existing.personalDifficulty
    const effectiveDifficulty = Math.max(nextIntrinsicDifficulty, nextPersonalDifficulty)
    updatedByKey.set(key, {
      ...existing,
      front: imp.front,
      back: imp.back,
      why: imp.why,
      when: String(imp.when ?? existing.when ?? '').trim(),
      tradeoffs: String(imp.tradeoffs ?? existing.tradeoffs ?? '').trim(),
      trap: String(imp.trap ?? existing.trap ?? '').trim(),
      scenario: String(imp.scenario ?? existing.scenario ?? '').trim(),
      tags: imp.tags,
      intrinsicDifficulty: nextIntrinsicDifficulty,
      personalDifficulty: nextPersonalDifficulty,
      difficulty: effectiveDifficulty,
      source: imp.source || existing.source,
    })
  })

  return [
    ...existingCards.map(card => updatedByKey.get(getCardKey(card)) || card),
    ...addedCards,
  ]
}

export function uniqueTags(cards) {
  const counts = new Map()
  cards.forEach(card => card.tags.forEach(tag => counts.set(tag, (counts.get(tag) || 0) + 1)))
  return [...counts.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([tag, count]) => ({ tag, count }))
}

export function autoGroupTags(tags) {
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

export function cardMatches(
  card,
  includeTags,
  excludeTags,
  search,
  dueOnly,
  difficultyFilter,
  difficultyRange,
  difficultySource,
  weakCardBoost,
) {
  const haystack = `${card.front} ${card.back} ${card.why} ${card.when ?? ''} ${card.tradeoffs ?? ''} ${card.trap ?? ''} ${card.scenario ?? ''} ${card.tags.join(' ')}`.toLowerCase()
  const searchOk = !search || haystack.includes(search.toLowerCase())
  const includeOk = includeTags.length === 0 || includeTags.some(tag => card.tags.includes(tag))
  const excludeOk = excludeTags.length === 0 || excludeTags.every(tag => !card.tags.includes(tag))
  const dueOk = !dueOnly || (card.srs?.dueAt || 0) <= Date.now()
  const effectiveDifficulty = getEffectiveDifficulty(card)
  const exactDifficultyOk = difficultyFilter === 'all' || String(effectiveDifficulty) === difficultyFilter

  const intrinsicDifficulty = getIntrinsicDifficulty(card)
  const personalDifficulty = getPersonalDifficulty(card)

  const min = difficultyRange?.min
  const max = difficultyRange?.max
  const withinRange = typeof min === 'number' && typeof max === 'number'
  if (!withinRange) return searchOk && includeOk && excludeOk && dueOk && exactDifficultyOk

  const baseDifficulty =
    difficultySource === 'intrinsic' ? intrinsicDifficulty
      : difficultySource === 'personal' ? personalDifficulty
        : effectiveDifficulty

  const baseOk = baseDifficulty >= min && baseDifficulty <= max
  const boostOk = (difficultySource === 'personal' ? true : Boolean(weakCardBoost)) && personalDifficulty >= max

  return searchOk && includeOk && excludeOk && dueOk && exactDifficultyOk && (baseOk || boostOk)
}

export function getPerformanceByTag(cards) {
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

export function getWeakCards(cards) {
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

export function calculateSrs(previous = defaultSrs(), grade) {
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

function escapeCsv(value = '') {
  const text = String(value ?? '')
  return `"${text.replace(/"/g, '""')}"`
}

export function deckToCsv(cards, { includeIntrinsicDifficulty = true } = {}) {
  const header = includeIntrinsicDifficulty
    ? 'Front,Back,Why,When,Tradeoffs,Trap,Scenario,Tags,IntrinsicDifficulty'
    : 'Front,Back,Why,When,Tradeoffs,Trap,Scenario,Tags'
  const rows = cards.map(card => {
    const base = [
      escapeCsv(card.front),
      escapeCsv(card.back),
      escapeCsv(card.why),
      escapeCsv(card.when ?? ''),
      escapeCsv(card.tradeoffs ?? ''),
      escapeCsv(card.trap ?? ''),
      escapeCsv(card.scenario ?? ''),
      escapeCsv((card.tags || []).join(' ')),
    ]
    if (includeIntrinsicDifficulty) {
      base.push(escapeCsv(String(card.intrinsicDifficulty ?? 2)))
    }
    return base.join(',')
  })
  return [header, ...rows].join('\n')
}

export function exportDeck(cards, name = 'interviewforge-deck') {
  const blob = new Blob([deckToCsv(cards)], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${slugify(name) || 'interviewforge-deck'}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

