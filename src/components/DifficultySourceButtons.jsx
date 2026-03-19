export default function DifficultySourceButtons({ difficultySource, onSelect, onReset }) {
  return (
    <div className="difficulty-source-block top-gap">
      <div className="muted small">Difficulty source</div>
      <div className="button-row compact wrap-top">
        <button
          type="button"
          className={`btn smallish ${difficultySource === 'intrinsic' ? 'primary' : ''}`}
          onClick={() => {
            onSelect('intrinsic')
            onReset()
          }}
        >
          Intrinsic
        </button>
        <button
          type="button"
          className={`btn smallish ${difficultySource === 'effective' ? 'primary' : ''}`}
          onClick={() => {
            onSelect('effective')
            onReset()
          }}
        >
          Effective
        </button>
        <button
          type="button"
          className={`btn smallish ${difficultySource === 'personal' ? 'primary' : ''}`}
          onClick={() => {
            onSelect('personal')
            onReset()
          }}
        >
          Personal
        </button>
      </div>
    </div>
  )
}

