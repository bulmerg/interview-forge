import { useMemo, useState } from 'react'
import {
  buildGuidedTopicDrafts,
  buildPasteNoteDrafts,
  buildQuickTopicDrafts,
  normalizeDraftForSave,
} from '../../lib/createCardDrafts'
import InfoHint from '../InfoHint'
import './CreateView.scss'

const EMPTY_GUIDED = {
  topic: '',
  definition: '',
  whyItMatters: '',
  whenToUse: '',
  tradeoffs: '',
  trap: '',
  scenario: '',
  tags: '',
}

const EMPTY_SINGLE = {
  front: '',
  back: '',
  why: '',
  when: '',
  tradeoffs: '',
  trap: '',
  scenario: '',
  tags: '',
  intrinsicDifficulty: 3,
}

function isDraftReady(draft) {
  return Boolean(String(draft.front || '').trim() && String(draft.back || '').trim())
}

function DraftList({ drafts, setDrafts, title, onSaveSelected }) {
  const selectedCount = useMemo(() => drafts.filter(d => d.selected).length, [drafts])
  const readyCount = useMemo(() => drafts.filter(d => isDraftReady(d)).length, [drafts])

  function updateDraft(id, field, value) {
    setDrafts(prev => prev.map(draft => (draft.id === id ? { ...draft, [field]: value } : draft)))
  }

  function removeDraft(id) {
    setDrafts(prev => prev.filter(draft => draft.id !== id))
  }

  function toggleAll(selectAll) {
    setDrafts(prev => prev.map(draft => ({ ...draft, selected: selectAll })))
  }

  if (!drafts.length) return null

  return (
    <div className="drafts-block top-gap">
      <div className="drafts-head">
        <h4>{title}</h4>
        <span>{selectedCount} selected · {readyCount} ready</span>
      </div>
      <div className="button-row compact">
        <button type="button" className="btn smallish" onClick={() => toggleAll(true)}>Select all</button>
        <button type="button" className="btn smallish" onClick={() => toggleAll(false)}>Clear selection</button>
        <button type="button" className="btn smallish primary" onClick={onSaveSelected}>Add to Deck</button>
      </div>
      <div className="draft-list">
        {drafts.map(draft => (
          <article key={draft.id} className="draft-card">
            <div className="draft-top-row">
              <label className="draft-check">
                <input
                  type="checkbox"
                  checked={draft.selected}
                  onChange={e => updateDraft(draft.id, 'selected', e.target.checked)}
                />
                Keep
              </label>
              <div className="draft-top-actions">
                <span className={`draft-status ${isDraftReady(draft) ? 'ready' : 'needs-work'}`}>
                  {isDraftReady(draft) ? 'Ready' : 'Needs front + back'}
                </span>
                <button
                  type="button"
                  className="btn smallish danger draft-remove-btn"
                  onClick={() => removeDraft(draft.id)}
                  title="Remove this draft"
                >
                  ✕
                </button>
              </div>
            </div>
            <input
              className="input"
              value={draft.front}
              onChange={e => updateDraft(draft.id, 'front', e.target.value)}
              placeholder="Front"
            />
            <textarea
              className="textarea compact-textarea"
              value={draft.back}
              onChange={e => updateDraft(draft.id, 'back', e.target.value)}
              placeholder="Back"
            />
            <textarea
              className="textarea compact-textarea"
              value={draft.why}
              onChange={e => updateDraft(draft.id, 'why', e.target.value)}
              placeholder="Why"
            />
            <div className="draft-grid">
              <input className="input" value={draft.when} onChange={e => updateDraft(draft.id, 'when', e.target.value)} placeholder="When to use" />
              <input className="input" value={draft.tradeoffs} onChange={e => updateDraft(draft.id, 'tradeoffs', e.target.value)} placeholder="Tradeoffs" />
              <input className="input" value={draft.trap} onChange={e => updateDraft(draft.id, 'trap', e.target.value)} placeholder="Interview trap" />
              <input className="input" value={draft.scenario} onChange={e => updateDraft(draft.id, 'scenario', e.target.value)} placeholder="Scenario" />
            </div>
            <div className="draft-grid two">
              <input
                className="input"
                value={draft.tags}
                onChange={e => updateDraft(draft.id, 'tags', e.target.value)}
                placeholder="tags like: system-design caching"
              />
              <input
                type="number"
                min={1}
                max={5}
                className="input"
                value={draft.intrinsicDifficulty}
                onChange={e => updateDraft(draft.id, 'intrinsicDifficulty', e.target.value)}
              />
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}

export default function CreateView({ onAddCards, onMessage }) {
  const [createMode, setCreateMode] = useState('generate')
  const [quickTopic, setQuickTopic] = useState('')
  const [quickContext, setQuickContext] = useState('')
  const [quickDrafts, setQuickDrafts] = useState([])
  const [guided, setGuided] = useState(EMPTY_GUIDED)
  const [guidedDrafts, setGuidedDrafts] = useState([])
  const [notesText, setNotesText] = useState('')
  const [notesTags, setNotesTags] = useState('')
  const [noteDrafts, setNoteDrafts] = useState([])
  const [single, setSingle] = useState(EMPTY_SINGLE)

  function saveDraftSelection(drafts, setDrafts) {
    const selected = drafts
      .filter(d => d.selected)
      .map(normalizeDraftForSave)
      .filter(isDraftReady)
    if (!selected.length) {
      onMessage('Select at least one valid draft (front + back) to save.')
      return
    }
    const saved = onAddCards(selected, 'Create')
    if (saved > 0) {
      setDrafts([])
      onMessage(`Added ${saved} cards to your deck.`)
    }
  }

  function generateQuickDrafts() {
    if (!quickTopic.trim()) {
      onMessage('Enter a topic to generate cards.')
      return
    }
    const next = buildQuickTopicDrafts(quickTopic, quickContext)
    setQuickDrafts(next)
  }

  function generateGuidedDrafts() {
    const next = buildGuidedTopicDrafts(guided)
    setGuidedDrafts(next)
    if (!next.length) onMessage('Add at least Topic + one supporting field to generate draft cards.')
  }

  function generateNoteDrafts() {
    const next = buildPasteNoteDrafts(notesText, notesTags)
    setNoteDrafts(next)
    if (!next.length) onMessage('Not enough signal in notes. Add clearer definition, why, and when/tradeoff details.')
  }

  function saveSingleCard() {
    const normalized = normalizeDraftForSave(single)
    if (!normalized.front || !normalized.back) {
      onMessage('Single Card requires Front and Back.')
      return
    }
    const saved = onAddCards([normalized], 'Create')
    if (saved > 0) {
      setSingle(EMPTY_SINGLE)
      onMessage('Card added to your deck.')
    }
  }

  const TABS = [
    ['generate', 'Generate cards'],
    ['notes', 'From notes'],
    ['guided', 'Guided build'],
    ['single', 'Single card'],
  ]

  return (
    <div className="create-panel glass">
      <div className="panel-header">
        <h3>
          Create interview cards
          <InfoHint text="Create cards from topics or notes, then refine each answer for interview quality." />
        </h3>
        <span>Build prompts that train explanation and tradeoff thinking</span>
      </div>

      <div className="segmented wrap-tabs">
        {TABS.map(([id, label]) => (
          <button key={id} className={createMode === id ? 'seg active' : 'seg'} onClick={() => setCreateMode(id)}>
            {label}
          </button>
        ))}
      </div>

      {createMode === 'generate' ? (
        <section className="create-section top-gap">
          <div className="create-hint muted small">
            Start with a concept. Generate draft cards quickly, then edit them into strong interview answers.
          </div>
          <input
            className="input"
            value={quickTopic}
            onChange={e => setQuickTopic(e.target.value)}
            placeholder="Topic (e.g., idempotency, event sourcing, cache invalidation)"
          />
          <textarea
            className="textarea compact-textarea top-gap"
            value={quickContext}
            onChange={e => setQuickContext(e.target.value)}
            placeholder="Optional context — add notes, definitions, or constraints to make cards more specific"
          />
          <div className="button-row">
            <button type="button" className="btn primary" onClick={generateQuickDrafts}>Generate Cards</button>
          </div>
          <DraftList
            drafts={quickDrafts}
            setDrafts={setQuickDrafts}
            title="Generated drafts"
            onSaveSelected={() => saveDraftSelection(quickDrafts, setQuickDrafts)}
          />
        </section>
      ) : null}

      {createMode === 'notes' ? (
        <section className="create-section top-gap">
          <div className="create-hint muted small">
            Paste notes with enough substance. Cards are drafted where your reasoning signal is clear.
            <InfoHint text="Best results include a definition plus why/when/tradeoff wording in the notes." />
          </div>
          <textarea
            className="textarea"
            value={notesText}
            onChange={e => setNotesText(e.target.value)}
            placeholder="Paste technical notes or bullets. Include definition, reason, and usage context when possible."
          />
          <input
            className="input top-gap"
            value={notesTags}
            onChange={e => setNotesTags(e.target.value)}
            placeholder="Optional tags for generated cards"
          />
          <div className="button-row">
            <button type="button" className="btn primary" onClick={generateNoteDrafts}>Generate from notes</button>
          </div>
          <DraftList
            drafts={noteDrafts}
            setDrafts={setNoteDrafts}
            title="Note-based drafts"
            onSaveSelected={() => saveDraftSelection(noteDrafts, setNoteDrafts)}
          />
        </section>
      ) : null}

      {createMode === 'guided' ? (
        <section className="create-section top-gap">
          <div className="create-hint muted small">
            Fill in structured fields for more control over your interview framing.
            <InfoHint text="Guided Topic uses only your form input. It does not fetch external facts." />
          </div>
          <div className="create-grid">
            <input className="input" value={guided.topic} onChange={e => setGuided(prev => ({ ...prev, topic: e.target.value }))} placeholder="Topic (e.g., idempotency)" />
            <input className="input" value={guided.tags} onChange={e => setGuided(prev => ({ ...prev, tags: e.target.value }))} placeholder="Tags (space or comma separated)" />
            <textarea className="textarea" value={guided.definition} onChange={e => setGuided(prev => ({ ...prev, definition: e.target.value }))} placeholder="Definition" />
            <textarea className="textarea" value={guided.whyItMatters} onChange={e => setGuided(prev => ({ ...prev, whyItMatters: e.target.value }))} placeholder="Why it matters" />
            <textarea className="textarea" value={guided.whenToUse} onChange={e => setGuided(prev => ({ ...prev, whenToUse: e.target.value }))} placeholder="When to use" />
            <textarea className="textarea" value={guided.tradeoffs} onChange={e => setGuided(prev => ({ ...prev, tradeoffs: e.target.value }))} placeholder="Tradeoffs" />
            <textarea className="textarea" value={guided.trap} onChange={e => setGuided(prev => ({ ...prev, trap: e.target.value }))} placeholder="Common interview trap" />
            <textarea className="textarea" value={guided.scenario} onChange={e => setGuided(prev => ({ ...prev, scenario: e.target.value }))} placeholder="Optional scenario" />
          </div>
          <div className="button-row">
            <button type="button" className="btn primary" onClick={generateGuidedDrafts}>Generate drafts</button>
          </div>
          <DraftList
            drafts={guidedDrafts}
            setDrafts={setGuidedDrafts}
            title="Guided drafts"
            onSaveSelected={() => saveDraftSelection(guidedDrafts, setGuidedDrafts)}
          />
        </section>
      ) : null}

      {createMode === 'single' ? (
        <section className="create-section top-gap">
          <div className="create-hint muted small">
            Full control when you already know the exact interview prompt.
            <InfoHint text="Only Front and Back are required; other interview fields are optional but recommended." />
          </div>
          <div className="create-grid">
            <input className="input" value={single.front} onChange={e => setSingle(prev => ({ ...prev, front: e.target.value }))} placeholder="Front" />
            <input className="input" value={single.back} onChange={e => setSingle(prev => ({ ...prev, back: e.target.value }))} placeholder="Back" />
            <textarea className="textarea" value={single.why} onChange={e => setSingle(prev => ({ ...prev, why: e.target.value }))} placeholder="Why" />
            <textarea className="textarea" value={single.when} onChange={e => setSingle(prev => ({ ...prev, when: e.target.value }))} placeholder="When to use" />
            <textarea className="textarea" value={single.tradeoffs} onChange={e => setSingle(prev => ({ ...prev, tradeoffs: e.target.value }))} placeholder="Tradeoffs" />
            <textarea className="textarea" value={single.trap} onChange={e => setSingle(prev => ({ ...prev, trap: e.target.value }))} placeholder="Interview trap" />
            <textarea className="textarea" value={single.scenario} onChange={e => setSingle(prev => ({ ...prev, scenario: e.target.value }))} placeholder="Scenario" />
            <div className="draft-grid two">
              <input className="input" value={single.tags} onChange={e => setSingle(prev => ({ ...prev, tags: e.target.value }))} placeholder="Tags" />
              <input
                type="number"
                min={1}
                max={5}
                className="input"
                value={single.intrinsicDifficulty}
                onChange={e => setSingle(prev => ({ ...prev, intrinsicDifficulty: e.target.value }))}
              />
            </div>
          </div>
          <div className="button-row">
            <button type="button" className="btn primary" onClick={saveSingleCard}>Add card</button>
          </div>
        </section>
      ) : null}
    </div>
  )
}
