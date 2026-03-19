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
        <div className="eyebrow">InterviewForge</div>
        <label className="label sidebar-deck-label">Deck</label>
        <input value={deckName} onChange={e => setDeckName(e.target.value)} className="input input-compact" />
      </div>

      <section className="panel-stack">
        <div className="mini-panel summary-panel">
          <div className="summary-stats">
            <Stat label="Cards" value={stats.total} />
            <Stat label="Due" value={stats.due} />
            <Stat label="Review" value={stats.review} />
            <Stat label="Starred" value={stats.starred} />
          </div>
        </div>

        <div className="mini-panel">
          <label className="label label-row">
            Focus Your Practice
            <InfoHint text="Narrow which cards you study right now. This does not delete anything from your deck." />
          </label>
          <p className="muted xsmall">Choose what you want to practice right now.</p>
          <input value={search} onChange={e => setSearch(e.target.value)} className="input" placeholder="Search questions, answers, tags…" />
          <div className="button-row compact wrap-top filter-row">
            <button className={`btn smallish ${!dueOnly ? 'primary' : ''}`} onClick={() => setDueOnly(false)}>All cards</button>
            <button className={`btn smallish ${dueOnly ? 'primary' : ''}`} onClick={() => setDueOnly(true)}>Due only</button>
            <button className="btn smallish" onClick={onShuffle}>Shuffle</button>
            <button className="btn smallish" onClick={resetDeckState}>Reset</button>
          </div>

          <DifficultyRangeEditor
            min={difficultyTargetMin}
            max={difficultyTargetMax}
            onMinDelta={adjustDifficultyTargetMin}
            onMaxDelta={adjustDifficultyTargetMax}
          />
          <details className="advanced-disclosure top-gap">
            <summary>
              Advanced filters
              <InfoHint text="Switch between intrinsic/effective/personal difficulty behavior or prioritize weak cards." />
            </summary>
            <DifficultySourceButtons
              difficultySource={difficultySource}
              onSelect={setDifficultySource}
              onReset={onDifficultySourceReset}
            />
            <WeakCardBoostButton weakCardBoost={weakCardBoost} onToggle={onToggleWeakCardBoost} />
          </details>
        </div>

        <details className="utilities-disclosure">
          <summary className="utilities-summary">Utilities</summary>
          <div className="utilities-panel">
            <button className="btn smallish utility-btn" onClick={exportFiltered}>Export filtered</button>
            <button className="btn smallish utility-btn" onClick={backupDeck}>Backup CSV</button>
            <button className="btn smallish utility-btn" onClick={restoreDeckFromBackup}>Restore backup</button>
            <button className="btn smallish utility-btn" onClick={loadSamples}>Load starter deck</button>
            <button className="btn smallish danger utility-btn" onClick={clearDeck}>Clear deck</button>
          </div>
        </details>
      </section>

      {message ? <p className="message">{message}</p> : null}
    </aside>
  )
}

