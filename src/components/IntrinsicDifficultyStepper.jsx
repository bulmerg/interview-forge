import './IntrinsicDifficultyStepper.scss'

export default function IntrinsicDifficultyStepper({ value, onDelta, showEffective, effectiveValue, showPersonal, personalValue }) {
  return (
    <div className="mini-meta difficulty-meta">
      <span>Difficulty (intrinsic)</span>
      <div className="difficulty-stepper">
        <button
          type="button"
          className="difficulty-step-btn"
          aria-label="Decrease intrinsic difficulty"
          onClick={() => onDelta(-1)}
        >
          v
        </button>
        <strong>{value}</strong>
        <button
          type="button"
          className="difficulty-step-btn"
          aria-label="Increase intrinsic difficulty"
          onClick={() => onDelta(1)}
        >
          ^
        </button>
      </div>

      {showEffective ? (
        <div className="difficulty-effective-row">
          <span>Effective</span>
          <strong>{effectiveValue}</strong>
        </div>
      ) : null}

      {showPersonal ? (
        <div className="difficulty-effective-row">
          <span>Personal</span>
          <strong>{personalValue}</strong>
        </div>
      ) : null}
    </div>
  )
}

