import { describe, expect, it } from 'vitest'
import { calculateSrs, cardMatches, deckToCsv, dedupeCards, parseDeckCsv } from './deckEngine'

describe('deckEngine', () => {
  it('parses legacy 4-column CSV and defaults optional interview fields', () => {
    const csv = [
      'Front,Back,Why,Tags',
      '"What is idempotency?","Same result for retries","Safe retries","api reliability"',
    ].join('\n')

    const cards = parseDeckCsv(csv, 'Legacy')
    expect(cards).toHaveLength(1)
    expect(cards[0].front).toBe('What is idempotency?')
    expect(cards[0].when).toBe('')
    expect(cards[0].tradeoffs).toBe('')
    expect(cards[0].trap).toBe('')
    expect(cards[0].scenario).toBe('')
    expect(cards[0].intrinsicDifficulty).toBe(2)
  })

  it('parses extended CSV columns by header name', () => {
    const csv = [
      'Front,Back,Why,Tags,IntrinsicDifficulty,When,Tradeoffs,Trap,Scenario',
      '"What is CQRS?","Separate reads/writes","Independent scaling","system-design architecture",4,"Read-heavy systems","Added complexity","Mixing models","Design read/write stores"',
    ].join('\n')

    const cards = parseDeckCsv(csv, 'Extended')
    expect(cards).toHaveLength(1)
    expect(cards[0].intrinsicDifficulty).toBe(4)
    expect(cards[0].when).toContain('Read-heavy')
    expect(cards[0].tradeoffs).toContain('complexity')
    expect(cards[0].trap).toContain('Mixing')
    expect(cards[0].scenario).toContain('read/write')
  })

  it('normalizes legacy cards with missing optional fields during dedupe', () => {
    const deduped = dedupeCards([
      { front: 'Q1', back: 'A1', why: 'W1', tags: ['test'] },
      { front: 'Q1', back: 'A1', why: 'W1', tags: ['test'] },
    ])

    expect(deduped).toHaveLength(1)
    expect(deduped[0].when).toBe('')
    expect(deduped[0].tradeoffs).toBe('')
    expect(deduped[0].trap).toBe('')
    expect(deduped[0].scenario).toBe('')
  })

  it('includes new interview fields in search matching', () => {
    const card = {
      front: 'What is idempotency?',
      back: 'Same result on retries',
      why: 'Safe retries',
      when: 'Use for network retries',
      tradeoffs: 'Requires idempotency keys',
      trap: 'Confusing with dedup at transport only',
      scenario: 'Payment endpoint retries after timeout',
      tags: ['api'],
      srs: { dueAt: Date.now() - 1000 },
      intrinsicDifficulty: 3,
      personalDifficulty: 2,
      difficulty: 3,
    }
    const match = cardMatches(
      card,
      [],
      [],
      'payment endpoint retries',
      false,
      'all',
      { min: 1, max: 5 },
      'effective',
      false,
    )
    expect(match).toBe(true)
  })

  it('applies expected SRS behavior across grades', () => {
    const previous = {
      interval: 3,
      ease: 2.5,
      reps: 3,
      lapses: 0,
      dueAt: Date.now(),
      lastReviewedAt: Date.now() - 1000,
    }
    const again = calculateSrs(previous, 'again')
    const hard = calculateSrs(previous, 'hard')
    const good = calculateSrs(previous, 'good')
    const easy = calculateSrs(previous, 'easy')

    expect(again.interval).toBeCloseTo(0.15)
    expect(again.ease).toBeCloseTo(2.3)
    expect(hard.interval).toBeCloseTo(3.6)
    expect(good.interval).toBe(Math.round(3 * 2.5))
    expect(easy.interval).toBeGreaterThan(good.interval)
    expect(easy.ease).toBeGreaterThan(good.ease)
  })

  it('exports CSV with interview columns', () => {
    const csv = deckToCsv([
      {
        front: 'Q',
        back: 'A',
        why: 'W',
        when: 'When',
        tradeoffs: 'Trade',
        trap: 'Trap',
        scenario: 'Scenario',
        tags: ['tag-one', 'tag-two'],
        intrinsicDifficulty: 4,
      },
    ])
    expect(csv.split('\n')[0]).toBe('Front,Back,Why,Tags,IntrinsicDifficulty,When,Tradeoffs,Trap,Scenario')
    expect(csv).toContain('"Scenario"')
  })
})
