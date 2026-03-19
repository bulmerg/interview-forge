import CardGlows from '../CardGlows'
import ExpandableText from '../ExpandableText'
import InfoHint from '../InfoHint'
import IntrinsicDifficultyStepper from '../IntrinsicDifficultyStepper'
import MiniMeta from '../MiniMeta'
import { formatDue, getEffectiveDifficulty, getIntrinsicDifficulty, getPersonalDifficulty } from '../../lib/shared'
import './StudyView.scss'

export default function StudyView({
  activeCard,
  currentIndex,
  total,
  flipped,
  onFlip,
  onPrev,
  onNext,
  onReview,
  onStar,
  onCardDifficulty,
  difficultyTargetMin,
  difficultyTargetMax,
  studyViewMode = 'setup',
  onEnterFocusMode,
}) {
  const isFocusMode = studyViewMode === 'focus'
  const detailSections = [
    { key: 'why', label: 'Why it matters', text: activeCard?.why || '' },
    { key: 'when', label: 'When to use', text: activeCard?.when || '' },
    { key: 'tradeoffs', label: 'Tradeoffs', text: activeCard?.tradeoffs || '' },
    { key: 'trap', label: 'Interview trap', text: activeCard?.trap || '' },
    { key: 'scenario', label: 'Scenario', text: activeCard?.scenario || '' },
  ].filter(item => item.text)

  return (
    <div className={`study-panel glass ${isFocusMode ? 'study-panel-focus' : ''}`}>
      {!isFocusMode ? (
        <div className="panel-header">
          <h3>
            Study mode
            <InfoHint text="Reveal answer first, then grade recall with Again/Hard/Good/Easy to update scheduling." />
          </h3>
          <div className="study-header-actions">
            <span>{total === 0 ? 'No cards' : `${currentIndex + 1} / ${total}`}</span>
            <button type="button" className="btn smallish" onClick={onEnterFocusMode}>Enter Focus Mode</button>
          </div>
        </div>
      ) : null}
      {!activeCard ? (
        <div className="empty-state">No cards match the current filters.</div>
      ) : (
        <>
          <div className={`flashcard ${flipped ? 'flipped' : ''}`}>
            <CardGlows />
            <div className="flashcard-inner">
              <div className="card-meta">Question</div>
              <h4>{activeCard.front}</h4>
              {!isFocusMode ? (
                <>
                  <div className="chip-row">{activeCard.tags.map(tag => <span className="tiny-chip" key={tag}>{tag}</span>)}</div>
                  <div className="meta-grid compact-study">
                    <IntrinsicDifficultyStepper
                      value={getIntrinsicDifficulty(activeCard)}
                      onDelta={onCardDifficulty}
                      showEffective
                      effectiveValue={getEffectiveDifficulty(activeCard)}
                      showPersonal
                      personalValue={getPersonalDifficulty(activeCard)}
                    />
                    <MiniMeta label="Status" value={activeCard.status} />
                    <MiniMeta label="Schedule" value={formatDue(activeCard.srs?.dueAt || Date.now())} />
                  </div>
                </>
              ) : null}
              {!flipped && <div className="hint">Press Reveal answer</div>}
              {flipped && (
                <div className="answer-block">
                  <div className="card-meta">Answer</div>
                  <ExpandableText
                    text={activeCard.back}
                    previewChars={220}
                    modalTitle={`Answer details`}
                  />
                  {detailSections.map(section => (
                    <div className="why-box top-gap" key={section.key}>
                      <strong>{section.label}</strong>
                      <ExpandableText
                        text={section.text}
                        previewChars={240}
                        modalTitle={section.label}
                      />
                    </div>
                  ))}
                </div>
              )}
              <div className="meta-grid compact-study top-gap">
                <MiniMeta label="Seen" value={activeCard.stats?.seen || 0} />
                <MiniMeta label="Correct" value={activeCard.stats?.correct || 0} />
                <MiniMeta label="Ease" value={activeCard.srs?.ease || 2.5} />
              </div>
            </div>
          </div>

          <div className="button-row spread top-gap">
            <button className="btn" onClick={onPrev}>Previous</button>
            <button className="btn" onClick={onFlip}>{flipped ? 'Show question' : 'Reveal answer'}</button>
            <button className="btn" onClick={onNext}>Next</button>
          </div>

          <div className="review-grid top-gap">
            <button className="review-btn again" onClick={() => onReview('again')} title="Forgot — reset interval to 15 min">Again</button>
            <button className="review-btn hard" onClick={() => onReview('hard')} title="Struggled — slower interval growth">Hard</button>
            <button className="review-btn good" onClick={() => onReview('good')} title="Solid recall — normal spacing">Good</button>
            <button className="review-btn easy" onClick={() => onReview('easy')} title="Effortless — longer gap before next review">Easy</button>
          </div>

          {!isFocusMode ? (
            <div className="study-bottom-bar top-gap">
              <button className="btn smallish" onClick={onStar}>
                {activeCard.starred ? '★ Starred' : '☆ Star'}
              </button>
            </div>
          ) : null}
        </>
      )}
    </div>
  )
}

