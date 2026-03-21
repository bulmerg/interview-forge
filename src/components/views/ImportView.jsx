import ImportBehaviorButtons from '../ImportBehaviorButtons'
import InfoHint from '../InfoHint'
import './ImportView.scss'

export default function ImportView({
  importOverwriteMode,
  setImportOverwriteMode,
  onFileUpload,
  sourceName,
  setSourceName,
  sourceText,
  setSourceText,
  ingestText,
  loadSamples,
}) {
  return (
    <div className="import-panel glass">
      <div className="panel-header">
        <h3>
          Import utilities
          <InfoHint text="Use this when bringing external CSV decks. For everyday flow, use Practice and Create first." />
        </h3>
        <span>Optional CSV merge and restore tools</span>
      </div>

      <p className="muted small">
        Starter cards are already available. Use this section when you need migration, merge, or external CSV workflows.
      </p>

      <div className="mini-panel import-box">
        <label className="label">Starter deck</label>
        <div className="button-row compact">
          <button type="button" className="btn smallish ghost" onClick={loadSamples}>Reload starter deck</button>
        </div>
      </div>

      <div className="mini-panel import-box top-gap">
        <label className="label label-row">
          Upload deck CSV
          <InfoHint text="Merge keeps existing cards. Overwrite modes replace matching question content during import." />
        </label>
        <input type="file" accept=".csv,text/csv" multiple onChange={onFileUpload} className="input file-input" />
        <ImportBehaviorButtons importOverwriteMode={importOverwriteMode} onSetMode={setImportOverwriteMode} />
      </div>

      <div className="mini-panel import-box top-gap">
        <label className="label">Paste raw CSV</label>
        <input value={sourceName} onChange={e => setSourceName(e.target.value)} className="input" placeholder="Deck name" />
        <textarea value={sourceText} onChange={e => setSourceText(e.target.value)} className="textarea" placeholder="Paste CSV with headers..." />
        <div className="button-row">
          <button type="button" className="btn smallish" onClick={ingestText}>Import text</button>
        </div>
      </div>
    </div>
  )
}
