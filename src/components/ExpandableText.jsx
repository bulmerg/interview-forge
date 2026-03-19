import { useEffect, useMemo, useState } from 'react'
import './ExpandableText.scss'

function buildPreview(text, maxChars) {
  if (!text || text.length <= maxChars) return text
  const rough = text.slice(0, maxChars).trim()
  const lastSpace = rough.lastIndexOf(' ')
  if (lastSpace > maxChars * 0.6) return rough.slice(0, lastSpace).trim()
  return rough
}

export default function ExpandableText({
  text,
  label = '',
  previewChars = 170,
  modalTitle = 'Details',
  className = '',
}) {
  const [open, setOpen] = useState(false)
  const value = String(text || '').trim()
  const preview = useMemo(() => buildPreview(value, previewChars), [value, previewChars])
  const isTruncated = value.length > preview.length

  useEffect(() => {
    if (!open) return undefined
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    function onKeyDown(event) {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = originalOverflow
    }
  }, [open])

  if (!value) return null

  return (
    <div className={`expandable-text ${className}`.trim()}>
      <p>
        {label ? <strong>{label}</strong> : null}
        {label ? ' ' : null}
        <span>{preview}</span>
        {isTruncated ? (
          <button type="button" className="ellipsis-btn" onClick={() => setOpen(true)} aria-label={`Read full ${label || 'text'}`}>
            ...
          </button>
        ) : null}
      </p>

      {open ? (
        <div className="text-modal-overlay" role="presentation" onClick={() => setOpen(false)}>
          <div
            className="text-modal"
            role="dialog"
            aria-modal="true"
            aria-label={modalTitle}
            onClick={event => event.stopPropagation()}
          >
            <div className="text-modal-header">
              <h4>{modalTitle}</h4>
              <button type="button" className="btn" onClick={() => setOpen(false)}>Close</button>
            </div>
            <div className="text-modal-content">
              <p>{value}</p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
