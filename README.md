# FlashForge Study Deck

A React + Vite flashcard generator/viewer for technical interview prep.

## Features

- Imports the same 4-column deck format used in the earlier CSV batches:
  - `Front`
  - `Back`
  - `Why`
  - `Tags`
- Accepts file upload or direct paste of raw deck text.
- Auto-extracts tags from the `Tags` column.
- Lets you include or exclude tags to build a filtered deck.
- Study mode with flip card UI.
- Browse mode to skim all filtered cards.
- Tracks simple statuses:
  - know
  - review
  - starred
- Persists the deck locally in browser storage.
- Can export the currently filtered deck back to CSV.

## Run locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## CSV notes

The app supports:

1. Proper CSV rows with quoted values
2. The more tolerant raw format generated in the chat earlier

The expected column order is:

```text
Front,Back,Why,Tags
```

Example:

```csv
Front,Back,Why,Tags
"What is React reconciliation?","The process of comparing the new virtual DOM tree with the previous tree to determine minimal DOM updates.","Efficient diffing minimizes DOM operations.","react rendering"
```

## Sample data

The app ships with 3 small sample files in `public/data` so you can see the UI immediately. You can then import your full deck CSV files.
