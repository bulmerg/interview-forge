import { useEffect, useState } from 'react'
import ReasoningSections from '../ReasoningSections'
import './SimulationView.scss'

export default function SimulationView({ cards, simCount, setSimCount }) {
  const [revealedIds, setRevealedIds] = useState([])
  useEffect(() => setRevealedIds([]), [cards])

  function toggle(id) {
    setRevealedIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]))
  }

  return (
    <div className="browser-panel glass">
      <div className="panel-header">
        <h3>Interview practice</h3>
        <span>{cards.length} prompts</span>
      </div>
      <p className="muted small">Speak your answer first, then reveal a strong reference response.</p>
      <div className="button-row compact wrap-top">
        {[8, 12, 20].map(count => (
          <button key={count} className={`pill ${simCount === count ? 'active' : ''}`} onClick={() => setSimCount(count)}>
            {count} prompts
          </button>
        ))}
      </div>
      <div className="simulation-list top-gap">
        {cards.map((card, index) => {
          const revealed = revealedIds.includes(card.id)
          return (
            <article key={card.id} className="simulation-card">
              <div className="card-meta">Prompt {index + 1}</div>
              <h4>{card.front}</h4>
              <div className="chip-row">{(card.tags || []).map(tag => <span key={`${card.id}-${tag}`} className="tiny-chip">{tag}</span>)}</div>
              <div className="button-row compact top-gap">
                <button className={revealed ? 'btn' : 'btn primary'} onClick={() => toggle(card.id)}>{revealed ? 'Hide response' : 'Reveal strong answer'}</button>
              </div>
              {revealed ? (
                <div className="why-box top-gap">
                  <ReasoningSections card={card} />
                </div>
              ) : null}
            </article>
          )
        })}
      </div>
    </div>
  )
}

