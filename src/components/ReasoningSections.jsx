import './ReasoningSections.scss'

function normalizeText(value) {
  return String(value ?? '').trim()
}

function toBulletItems(text) {
  const normalized = normalizeText(text)
  if (!normalized) return []
  if (normalized.includes('\n')) {
    const lines = normalized
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean)
      .map(line => line.replace(/^[-*•]\s*/, '').trim())
      .filter(Boolean)
    if (lines.length >= 2) return lines
  }

  if (normalized.includes(';')) {
    const items = normalized
      .split(';')
      .map(item => item.trim())
      .filter(Boolean)
    if (items.length >= 2) return items
  }

  return []
}

function InsightBody({ text, preferBullets = false }) {
  const value = normalizeText(text)
  if (!value) return null

  const bulletItems = toBulletItems(value)
  if (bulletItems.length >= 2 && (preferBullets || bulletItems.length <= 6)) {
    return (
      <ul className="reasoning-list">
        {bulletItems.map((item, index) => (
          <li key={`${item}-${index}`}>{item}</li>
        ))}
      </ul>
    )
  }

  return <p className="reasoning-paragraph">{value}</p>
}

export default function ReasoningSections({
  card,
  includeAnswer = true,
  className = '',
}) {
  const sections = [
    includeAnswer ? { key: 'back', label: 'Answer', text: card?.back, tier: 'primary' } : null,
    { key: 'why', label: 'Why it matters', text: card?.why, tier: 'secondary' },
    { key: 'when', label: 'When to use', text: card?.when, tier: 'secondary' },
    { key: 'tradeoffs', label: 'Tradeoffs', text: card?.tradeoffs, tier: 'tertiary', preferBullets: true },
    { key: 'trap', label: 'Interview trap', text: card?.trap, tier: 'tertiary' },
    { key: 'scenario', label: 'Scenario', text: card?.scenario, tier: 'tertiary', preferBullets: true },
  ]
    .filter(Boolean)
    .map(section => ({ ...section, text: normalizeText(section.text) }))
    .filter(section => section.text)

  if (sections.length === 0) return null

  return (
    <div className={`reasoning-sections ${className}`.trim()}>
      {sections.map(section => (
        <section key={section.key} className={`reasoning-section ${section.tier}`}>
          <div className="reasoning-label">{section.label}</div>
          <InsightBody text={section.text} preferBullets={section.preferBullets} />
        </section>
      ))}
    </div>
  )
}

