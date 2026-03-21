import ViewModeTabs from './ViewModeTabs'
import { useAppContext } from '../context/AppContext'
import './Header.scss'

export default function Header() {
  const {
    sidebarCollapsed,
    onToggleSidebarCollapsed,
    deckName,
    cards,
    filteredCount,
    viewMode,
    onSetViewMode,
  } = useAppContext()

  return (
    <header className="hero glass">
      <div>
        <button
          type="button"
          className="btn smallish sidebar-toggle"
          onClick={onToggleSidebarCollapsed}
        >
          {sidebarCollapsed ? 'Show sidebar' : 'Hide sidebar'}
        </button>
        <div className="eyebrow">Interview Thinking Trainer</div>
        <h2>{deckName}</h2>
        <p className="muted">Practice explanations, build better cards, and rehearse interviews with intent. {filteredCount} of {cards.length} cards are in your current set.</p>
      </div>
      <ViewModeTabs viewMode={viewMode} onSetViewMode={onSetViewMode} />
    </header>
  )
}

