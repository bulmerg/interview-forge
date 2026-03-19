import { useState } from 'react'
import { dedupeCards, mergeImportedCards, parseDeckCsv } from '../lib/deckEngine'
import { clearAppState } from '../lib/persistence'

export default function useDeckImport({ cards, setCards }) {
  const [sourceText, setSourceText] = useState('')
  const [sourceName, setSourceName] = useState('Pasted Deck')
  const [importOverwriteMode, setImportOverwriteMode] = useState('keepExisting')
  const [message, setMessage] = useState('')

  function ingestCards(imported, label, mode = importOverwriteMode) {
    if (imported.length === 0) {
      setMessage('No cards found. Paste the CSV exactly as generated, including the header row.')
      return
    }
    let merged
    if (mode === 'keepExisting') {
      merged = dedupeCards([...cards, ...imported])
    } else if (mode === 'overwriteAll') {
      merged = mergeImportedCards(cards, imported, { overwriteIntrinsicDifficulty: true })
    } else if (mode === 'overwriteKeepIntrinsic') {
      merged = mergeImportedCards(cards, imported, { overwriteIntrinsicDifficulty: false })
    } else {
      merged = dedupeCards([...cards, ...imported])
    }
    setCards(merged)
    setMessage(`${label} ${imported.length} cards processed. Total deck size: ${merged.length}.`)
  }

  function ingestText() {
    const imported = parseDeckCsv(sourceText, sourceName)
    ingestCards(imported, 'Imported', importOverwriteMode)
    setSourceText('')
  }

  function onFileUpload(event) {
    const files = [...(event.target.files || [])]
    if (!files.length) return
    Promise.all(files.map(file => file.text().then(text => ({ file, text })))).then(results => {
      const imported = results.flatMap(({ file, text }) => parseDeckCsv(text, file.name))
      ingestCards(imported, 'Imported', importOverwriteMode)
    })
  }

  async function loadSamples(sampleFiles) {
    try {
      const texts = await Promise.all(sampleFiles.map(path => fetch(path).then(r => r.text())))
      const imported = dedupeCards(texts.flatMap((text, idx) => parseDeckCsv(text, `Sample Batch ${idx + 1}`)))
      setCards(imported)
      setMessage(`Loaded starter deck (${imported.length} cards).`)
    } catch {
      setMessage('Upload or paste one of your deck CSV files to begin.')
    }
  }

  async function clearDeck() {
    const ok = window.confirm('Clear the deck? This removes all cards from memory and deletes the saved deck from IndexedDB.')
    if (!ok) return false
    await clearAppState()
    setCards([])
    setMessage('Deck cleared.')
    return true
  }

  return {
    sourceText,
    setSourceText,
    sourceName,
    setSourceName,
    importOverwriteMode,
    setImportOverwriteMode,
    message,
    setMessage,
    ingestText,
    onFileUpload,
    loadSamples,
    clearDeck,
  }
}

