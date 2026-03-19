import './DifficultyRangeEditor.scss'

export default function DifficultyRangeEditor({ min, max, onMinDelta, onMaxDelta }) {
  return (
    <div className="sidebar-difficulty-range">
      <div className="difficulty-target-row sidebar-range-row">
        <div className="difficulty-target-control">
          <div className="muted small">Min</div>
          <div className="difficulty-range-arrows">
            <button type="button" className="btn smallish" onClick={() => onMinDelta(-1)}>
              v
            </button>
            <div className="difficulty-range-value">{min}</div>
            <button type="button" className="btn smallish" onClick={() => onMinDelta(1)}>
              ^
            </button>
          </div>
        </div>

        <div className="difficulty-target-center">
          <div className="muted small">Difficulty range</div>
          <div className="difficulty-range-title">{min}–{max}</div>
        </div>

        <div className="difficulty-target-control">
          <div className="muted small">Max</div>
          <div className="difficulty-range-arrows">
            <button type="button" className="btn smallish" onClick={() => onMaxDelta(-1)}>
              v
            </button>
            <div className="difficulty-range-value">{max}</div>
            <button type="button" className="btn smallish" onClick={() => onMaxDelta(1)}>
              ^
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

