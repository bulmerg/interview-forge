import { useMemo } from 'react'
import TagGraph from './TagGraph'
import './AnalyticsView.scss'

export default function AnalyticsView({ cards, tagPerformance, weakCards, groupedTags }) {
  const overallAccuracy = useMemo(() => {
    const seen = cards.reduce((sum, card) => sum + (card.stats?.seen || 0), 0)
    const correct = cards.reduce((sum, card) => sum + (card.stats?.correct || 0), 0)
    return seen ? Math.round((correct / seen) * 100) : 0
  }, [cards])

  return (
    <div className="analytics-panel glass">
      <div className="panel-header">
        <h3>Analytics + weak areas</h3>
        <span>{overallAccuracy}% overall accuracy</span>
      </div>
      <div className="analytics-grid">
        <section className="analytics-card">
          <h4>Weak areas dashboard</h4>
          <div className="weak-list">
            {tagPerformance.slice(0, 8).map(item => (
              <div key={item.tag} className="weak-row">
                <div>
                  <strong>{item.tag}</strong>
                  <div className="muted small">{item.seen || 0} reviews · {item.count} cards</div>
                </div>
                <div className="weak-metrics">
                  <span>{item.accuracy}%</span>
                  <div className="bar"><div style={{ width: `${Math.max(8, item.accuracy)}%` }} /></div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="analytics-card">
          <h4>Most missed cards</h4>
          <div className="missed-list">
            {weakCards.map(card => (
              <div key={card.id} className="missed-card">
                <strong>{card.front}</strong>
                <div className="muted small">Accuracy {card.accuracy}% · strain {card.strain}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="analytics-card span-2">
          <h4>Tag graph visualization</h4>
          <TagGraph groupedTags={groupedTags} performance={tagPerformance} />
        </section>
      </div>
    </div>
  )
}

