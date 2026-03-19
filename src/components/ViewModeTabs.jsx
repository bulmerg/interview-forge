export default function ViewModeTabs({ viewMode, onSetViewMode }) {
  const tabs = [
    ['study', 'Study'],
    ['quiz', 'Quiz'],
    ['interview', 'Interview'],
    ['analytics', 'Analytics'],
    ['create', 'Create'],
    ['import', viewMode === 'import' ? 'Close Import (Advanced)' : 'Import (Advanced)'],
    ['help', 'Help'],
  ]

  return (
    <div className="segmented wrap-tabs">
      {tabs.map(([mode, label]) => (
        <button
          key={mode}
          className={viewMode === mode ? 'seg active' : 'seg'}
          onClick={() => onSetViewMode(mode === 'import' && viewMode === 'import' ? 'study' : mode)}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

