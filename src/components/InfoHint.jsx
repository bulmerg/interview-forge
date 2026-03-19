import './InfoHint.scss'

export default function InfoHint({ text, label = 'More info' }) {
  return (
    <span className="info-hint" tabIndex={0} role="button" aria-label={label}>
      <span className="info-hint-icon">i</span>
      <span className="info-hint-tooltip" role="tooltip">{text}</span>
    </span>
  )
}
