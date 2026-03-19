export default function WeakCardBoostButton({ weakCardBoost, onToggle }) {
  return (
    <button
      className={`btn smallish top-gap ${weakCardBoost ? 'primary' : ''}`}
      type="button"
      onClick={onToggle}
    >
      Weak-card boost: {weakCardBoost ? 'On' : 'Off'}
    </button>
  )
}

