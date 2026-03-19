import Dexie from 'dexie'

const DB_NAME = 'flashforge-study-deck'
const SNAPSHOT_KEY = 'deck-snapshot'
const LEGACY_STORAGE_KEY = 'flashforge-decks-v2'
const LOCAL_BACKUP_KEY = 'flashforge-backup-csv'

const db = new Dexie(DB_NAME)
db.version(1).stores({
  appState: '&key',
})

function readLegacyCards() {
  try {
    const raw = localStorage.getItem(LEGACY_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : null
  } catch {
    return null
  }
}

export async function readAppState() {
  const snapshot = await db.table('appState').get(SNAPSHOT_KEY)
  if (snapshot?.value && Array.isArray(snapshot.value.cards)) {
    return {
      cards: snapshot.value.cards,
      deckName: snapshot.value.deckName || 'Senior Engineer Study',
      source: 'indexeddb',
    }
  }

  const legacyCards = readLegacyCards()
  if (legacyCards) {
    const migrated = { cards: legacyCards, deckName: 'Senior Engineer Study' }
    await db.table('appState').put({ key: SNAPSHOT_KEY, value: migrated, updatedAt: Date.now() })
    return { ...migrated, source: 'migrated-localstorage' }
  }

  return null
}

export async function writeAppState({ cards, deckName }) {
  await db.table('appState').put({
    key: SNAPSHOT_KEY,
    value: { cards, deckName },
    updatedAt: Date.now(),
  })
}

export async function clearAppState() {
  await db.table('appState').delete(SNAPSHOT_KEY)
  localStorage.removeItem(LEGACY_STORAGE_KEY)
}

export function saveCsvBackupToLocalStorage(csvText) {
  localStorage.setItem(LOCAL_BACKUP_KEY, csvText)
}

export function readCsvBackupFromLocalStorage() {
  return localStorage.getItem(LOCAL_BACKUP_KEY)
}

export function getCsvBackupInfo() {
  const csv = localStorage.getItem(LOCAL_BACKUP_KEY)
  if (!csv) return null
  const lines = csv.split('\n')
  const cardCount = Math.max(lines.length - 1, 0)
  return {
    cardCount,
    bytes: csv.length,
  }
}
