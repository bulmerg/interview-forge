import MiniMeta from '../MiniMeta'
import ExpandableText from '../ExpandableText'
import { formatDue, getEffectiveDifficulty } from '../../lib/shared'
import './BrowserView.scss'

export default function BrowserView({ cards }) {
  return (
    <div className="browser-panel glass">
      <div className="panel-header">
        <h3>Card browser</h3>
        <span>{cards.length} results</span>
      </div>
      <div className="browser-list">
        {cards.map(card => (
          <CardRow key={card.id} card={card} />
        ))}
      </div>
    </div>
  )
}

function CardRow({ card }) {
  const details = [
    { key: 'why', label: 'Why', text: card.why },
    { key: 'when', label: 'When', text: card.when },
    { key: 'tradeoffs', label: 'Tradeoffs', text: card.tradeoffs },
    { key: 'trap', label: 'Interview trap', text: card.trap },
    { key: 'scenario', label: 'Scenario', text: card.scenario },
  ].filter(item => item.text)

  return (
    <article className="browser-card" key={card.id}>
      <div className="card-meta-row">
        <div className="card-meta">Question</div>
        <div className="chip-row">{card.tags.map(tag => <span className="tiny-chip" key={`${card.id}-${tag}`}>{tag}</span>)}</div>
      </div>
      <h4>{card.front}</h4>
      <ExpandableText text={card.back} label="Answer:" previewChars={180} modalTitle="Full answer" />
      {details.map(detail => (
        <ExpandableText
          key={detail.key}
          text={detail.text}
          label={`${detail.label}:`}
          previewChars={220}
          modalTitle={detail.label}
        />
      ))}
      <div className="meta-grid">
        <MiniMeta label="Difficulty" value={getEffectiveDifficulty(card)} />
        <MiniMeta label="Seen" value={card.stats?.seen || 0} />
        <MiniMeta label="Due" value={formatDue(card.srs?.dueAt || Date.now())} />
      </div>
    </article>
  )
}

