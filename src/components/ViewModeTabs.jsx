export default function ViewModeTabs({ viewMode, onSetViewMode }) {
  const tabs = [
    { mode: 'study', label: 'Practice', emphasis: 'primary-action' },
    { mode: 'create', label: 'Create', emphasis: 'primary-action' },
    { mode: 'interview', label: 'Interview practice', emphasis: 'primary-action' },
    { mode: 'quiz', label: 'Explore cards', emphasis: 'secondary-action' },
    { mode: 'analytics', label: 'Insights', emphasis: 'secondary-action' },
    {
      mode: 'import',
      label: viewMode === 'import' ? 'Close import utilities' : 'Import utilities',
      emphasis: 'utility-action',
    },
    { mode: 'help', label: 'Guide', emphasis: 'utility-action' },
  ]

  return (
    <div className="segmented wrap-tabs">
      {tabs.map(({ mode, label, emphasis }) => (
        <button
          key={mode}
          className={viewMode === mode ? `seg ${emphasis} active` : `seg ${emphasis}`}
          onClick={() => onSetViewMode(mode === 'import' && viewMode === 'import' ? 'study' : mode)}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

