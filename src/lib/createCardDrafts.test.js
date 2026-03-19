import { describe, expect, it } from 'vitest'
import {
  buildGuidedTopicDrafts,
  buildPasteNoteDrafts,
  normalizeDraftForSave,
} from './createCardDrafts'

describe('createCardDrafts', () => {
  it('builds guided topic drafts with expected card types and difficulty levels', () => {
    const drafts = buildGuidedTopicDrafts({
      topic: 'Idempotency',
      definition: 'Operation can be retried without changing final state',
      whyItMatters: 'Enables safe retries',
      whenToUse: 'Use in APIs that can timeout',
      tradeoffs: 'Requires unique request keys',
      trap: 'Confusing retries with duplicate side effects',
      scenario: 'Payment API retry after timeout',
      tags: 'api reliability',
    })

    expect(drafts).toHaveLength(6)
    expect(drafts[0].front).toBe('What is Idempotency?')
    expect(drafts[0].intrinsicDifficulty).toBe(2)
    expect(drafts[1].intrinsicDifficulty).toBe(3)
    expect(drafts[2].intrinsicDifficulty).toBe(4)
    expect(drafts[5].intrinsicDifficulty).toBe(5)
    expect(drafts[0].tags).toContain('idempotency')
    expect(drafts[0].tags).toContain('api')
  })

  it('returns no guided drafts when topic is empty', () => {
    const drafts = buildGuidedTopicDrafts({
      topic: '   ',
      definition: 'x',
      whyItMatters: 'y',
      whenToUse: '',
      tradeoffs: '',
      trap: '',
      scenario: '',
      tags: '',
    })
    expect(drafts).toEqual([])
  })

  it('generates note-based drafts from signal-rich notes', () => {
    const notes = [
      '- Idempotency means retries keep same final state because duplicate calls can happen.',
      '- Use this when network timeouts are common, but tradeoff is key storage cost.',
    ].join('\n')

    const drafts = buildPasteNoteDrafts(notes, 'api')
    const fronts = drafts.map(d => d.front.toLowerCase())
    expect(drafts.length).toBeGreaterThanOrEqual(3)
    expect(fronts.some(front => front.startsWith('what is'))).toBe(true)
    expect(fronts.some(front => front.startsWith('why does'))).toBe(true)
    expect(fronts.some(front => front.startsWith('when should'))).toBe(true)
  })

  it('normalizes manual draft values before save', () => {
    const normalized = normalizeDraftForSave({
      front: '  What is CQRS?  ',
      back: ' Separate read and write paths ',
      why: ' helps scale ',
      when: ' read heavy workloads ',
      tradeoffs: ' more complexity ',
      trap: ' mixing models ',
      scenario: ' e-commerce catalog ',
      tags: 'System-Design,  cqrs  architecture',
      intrinsicDifficulty: '4',
    })

    expect(normalized.front).toBe('What is CQRS?')
    expect(normalized.tags).toEqual(['system-design', 'cqrs', 'architecture'])
    expect(normalized.intrinsicDifficulty).toBe(4)
  })
})
