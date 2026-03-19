export default function ImportBehaviorButtons({ importOverwriteMode, onSetMode }) {
  return (
    <>
      <div className="divider">Import behavior</div>
      <div className="button-row compact wrap-top">
        <button
          type="button"
          className={`btn smallish ${importOverwriteMode === 'keepExisting' ? 'primary' : ''}`}
          onClick={() => onSetMode('keepExisting')}
        >
          Merge
        </button>
        <button
          type="button"
          className={`btn smallish ${importOverwriteMode === 'overwriteAll' ? 'primary' : ''}`}
          onClick={() => onSetMode('overwriteAll')}
        >
          Overwrite questions + intrinsic
        </button>
        <button
          type="button"
          className={`btn smallish ${importOverwriteMode === 'overwriteKeepIntrinsic' ? 'primary' : ''}`}
          onClick={() => onSetMode('overwriteKeepIntrinsic')}
        >
          Overwrite questions (keep intrinsic)
        </button>
      </div>
    </>
  )
}

