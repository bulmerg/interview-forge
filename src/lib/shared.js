export function clampDifficulty(value) {
  if (!Number.isFinite(value)) return 2
  return Math.max(1, Math.min(5, value))
}

export function getIntrinsicDifficulty(card) {
  return clampDifficulty(Number(card?.intrinsicDifficulty ?? card?.difficulty ?? 2))
}

export function getPersonalDifficulty(card) {
  const intrinsic = getIntrinsicDifficulty(card)
  return clampDifficulty(Number(card?.personalDifficulty ?? card?.difficulty ?? intrinsic))
}

export function getEffectiveDifficulty(card) {
  return Math.max(getIntrinsicDifficulty(card), getPersonalDifficulty(card))
}

export function normalizeAnswer(text = '') {
  return String(text).toLowerCase().trim().replace(/\s+/g, ' ')
}

export function answerMatches(userAnswer, correctAnswer) {
  if (!correctAnswer || !userAnswer) return false
  const u = normalizeAnswer(userAnswer)
  const c = normalizeAnswer(correctAnswer)
  if (u === c) return true
  if (c.includes(u) && u.length >= 3) return true
  if (u.includes(c) && c.length >= 3) return true
  return false
}

export function shuffle(array, seed) {
  // Deterministic-ish shuffle from a numeric seed.
  let currentSeed = seed
  for (let i = array.length - 1; i > 0; i -= 1) {
    currentSeed = (currentSeed * 9301 + 49297) % 233280
    const j = Math.floor((currentSeed / 233280) * (i + 1))
    ;[array[i], array[j]] = [array[j], array[i]]
  }
  return array
}

export function formatDue(dueAt) {
  const diffMs = dueAt - Date.now()
  const diffDays = Math.round(diffMs / (24 * 60 * 60 * 1000))
  if (diffDays <= 0) return 'Due now'
  if (diffDays === 1) return 'Due tomorrow'
  return `Due in ${diffDays} days`
}

export function getDeckStats(cards) {
  const now = Date.now()
  return cards.reduce(
    (acc, card) => {
      acc.total += 1
      if (card.status === 'know') acc.know += 1
      if (card.status === 'review') acc.review += 1
      if (card.starred) acc.starred += 1
      if ((card.srs?.dueAt || 0) <= now) acc.due += 1
      acc.reviews += card.stats?.seen || 0
      return acc
    },
    { total: 0, know: 0, review: 0, starred: 0, due: 0, reviews: 0 },
  )
}

