import './StudyFocusLayout.scss'

export default function StudyFocusLayout({
  deckName,
  currentIndex,
  total,
  onAdjustPractice,
  onExitFocusMode,
  children,
}) {
  const progressLabel = total === 0 ? 'No cards' : `${currentIndex + 1} / ${total}`

  return (
    <div className="focus-layout">
      <header className="focus-topbar glass">
        <div className="focus-title">{deckName}</div>
        <div className="focus-progress">{progressLabel}</div>
        <div className="focus-topbar-actions">
          <button type="button" className="btn smallish ghost" onClick={onAdjustPractice}>
            Adjust
          </button>
          <button type="button" className="btn smallish ghost" onClick={onExitFocusMode}>
            Exit
          </button>
        </div>
      </header>

      <div className="focus-main">
        {children}
      </div>
    </div>
  )
}
