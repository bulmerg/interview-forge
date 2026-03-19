import Stat from './Stat'
import DifficultyRangeEditor from './DifficultyRangeEditor'
import DifficultySourceButtons from './DifficultySourceButtons'
import WeakCardBoostButton from './WeakCardBoostButton'
import InfoHint from './InfoHint'
import useDeckStats from '../hooks/useDeckStats'
import { useAppContext } from '../context/AppContext'
import './Sidebar.scss'

export default function Sidebar() {
  const {
    cards,
    deckName,
    setDeckName,
    loadSamples,
    message,
    search,
    setSearch,
    dueOnly,
    setDueOnly,
    onShuffle,
    resetDeckState,
    exportFiltered,
    backupDeck,
    restoreDeckFromBackup,
    clearDeck,
    difficultyTargetMin,
    difficultyTargetMax,
    adjustDifficultyTargetMin,
    adjustDifficultyTargetMax,
    difficultySource,
    setDifficultySource,
    onDifficultySourceReset,
    weakCardBoost,
    onToggleWeakCardBoost,
  } = useAppContext()

  const stats = useDeckStats(cards)
  return (
    <aside className="sidebar glass">
      <div>
        <div className="eyebrow">FlashForge Pro</div>
        <h1>Stop memorizing. Start thinking like a senior engineer.</h1>
        <p className="muted">Build a focused study set, create interview-ready cards, and practice what, why, when, and tradeoffs.</p>
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
          <div className="deck-actions-row">
            <button className="btn smallish" onClick={exportFiltered}>Export filtered</button>
            <button className="btn smallish" onClick={backupDeck}>Backup CSV</button>
            <button className="btn smallish" onClick={restoreDeckFromBackup}>Restore backup</button>
            <button className="btn smallish" onClick={loadSamples}>Load starter deck</button>
            <button className="btn smallish danger" onClick={clearDeck}>Clear deck</button>
          </div>
        </div>

        <div className="mini-panel">
          <label className="label label-row">
            Build Study Set
            <InfoHint text="This narrows the cards you study right now; it does not delete anything from your deck." />
          </label>
          <input value={search} onChange={e => setSearch(e.target.value)} className="input" placeholder="Search questions, answers, tags…" />
          <div className="button-row compact wrap-top filter-row">
            <button className={`btn smallish ${!dueOnly ? 'primary' : ''}`} onClick={() => setDueOnly(false)}>All cards</button>
            <button className={`btn smallish ${dueOnly ? 'primary' : ''}`} onClick={() => setDueOnly(true)}>Due only</button>
            <button className="btn smallish" onClick={onShuffle}>Shuffle</button>
            <button className="btn smallish" onClick={resetDeckState}>Reset</button>
          </div>
          <p className="muted small">
            Due only = cards scheduled for review now.
            <InfoHint text="Due-only follows spaced repetition scheduling. Turn it off to include not-yet-due cards too." />
          </p>

          <DifficultyRangeEditor
            min={difficultyTargetMin}
            max={difficultyTargetMax}
            onMinDelta={adjustDifficultyTargetMin}
            onMaxDelta={adjustDifficultyTargetMax}
          />
          <details className="advanced-disclosure top-gap">
            <summary>
              Advanced filters
              <InfoHint text="Use this when you want to switch between intrinsic/effective/personal difficulty behavior or prioritize weak cards." />
            </summary>
            <DifficultySourceButtons
              difficultySource={difficultySource}
              onSelect={setDifficultySource}
              onReset={onDifficultySourceReset}
            />
            <WeakCardBoostButton weakCardBoost={weakCardBoost} onToggle={onToggleWeakCardBoost} />
          </details>
          <p className="muted small top-gap">Need CSV merge options? Use the Import tab.</p>
        </div>
      </section>

      {message ? <p className="message">{message}</p> : null}
    </aside>
  )
}

