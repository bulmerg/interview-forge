import { useEffect, useState } from 'react'
import CardGlows from '../CardGlows'
import InfoHint from '../InfoHint'
import ReasoningSections from '../ReasoningSections'
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
  studyViewMode = 'setup',
  onEnterFocusMode,
}) {
  const isFocusMode = studyViewMode === 'focus'
  const [revealed, setRevealed] = useState(false)
  const intrinsicDifficulty = getIntrinsicDifficulty(activeCard)
  const effectiveDifficulty = getEffectiveDifficulty(activeCard)
  const personalDifficulty = getPersonalDifficulty(activeCard)

  useEffect(() => {
    setRevealed(Boolean(flipped))
  }, [flipped, activeCard?.id])

  return (
    <div className={`study-panel glass ${isFocusMode ? 'study-panel-focus' : ''}`}>
      {!isFocusMode ? (
        <div className="panel-header">
          <h3>
            Practice
            <InfoHint text="Attempt an answer first, then reveal a strong answer and grade recall to keep spacing accurate." />
          </h3>
          <div className="study-header-actions">
            <span>{total === 0 ? 'No cards' : `${currentIndex + 1} / ${total}`}</span>
            <button type="button" className="btn smallish" onClick={onEnterFocusMode}>Enter Focus Mode</button>
          </div>
        </div>
      ) : null}
      {!activeCard ? (
        <div className="empty-state">No cards match this setup yet. Select a few focus areas or practice all cards.</div>
      ) : (
        <>
          <div className={`flashcard ${flipped ? 'flipped' : ''}`}>
            <CardGlows />
            <div className="flashcard-inner">
              <div className="card-meta">Question</div>
              <h4>{activeCard.front}</h4>
              {!isFocusMode ? (
                <>
                  <div className="chip-row">{(activeCard.tags || []).map(tag => <span className="tiny-chip" key={tag}>{tag}</span>)}</div>
                  <div className="study-meta">
                    <button
                      type="button"
                      className="study-inline-step"
                      aria-label="Decrease intrinsic difficulty"
                      onClick={() => onCardDifficulty(-1)}
                    >
                      -
                    </button>
                    <span>Difficulty: {intrinsicDifficulty} (Eff: {effectiveDifficulty} / Pers: {personalDifficulty})</span>
                    <span>•</span>
                    <span>Status: {activeCard.status}</span>
                    <span>•</span>
                    <span>Due: {formatDue(activeCard.srs?.dueAt || Date.now())}</span>
                    <button
                      type="button"
                      className="study-inline-step"
                      aria-label="Increase intrinsic difficulty"
                      onClick={() => onCardDifficulty(1)}
                    >
                      +
                    </button>
                  </div>
                </>
              ) : null}
              {!revealed && <div className="hint">Try your answer first, then reveal a strong answer.</div>}
              {revealed && (
                <div className="answer-block">
                  <ReasoningSections card={activeCard} />
                </div>
              )}
              <div className="study-stats-footer">
                Seen: {activeCard.stats?.seen || 0} • Correct: {activeCard.stats?.correct || 0} • Ease: {activeCard.srs?.ease || 2.5}
              </div>
            </div>
          </div>

          <div className={`study-actions-primary top-gap ${!revealed ? 'pending-reveal' : ''}`}>
            <button className="review-btn again" onClick={() => onReview('again')} title="Forgot — reset interval to 15 min">Again</button>
            <button className="review-btn hard" onClick={() => onReview('hard')} title="Struggled — slower interval growth">Hard</button>
            <button className="review-btn good" onClick={() => onReview('good')} title="Solid recall — normal spacing">Good</button>
            <button className="review-btn easy" onClick={() => onReview('easy')} title="Effortless — longer gap before next review">Easy</button>
          </div>

          <div className="study-actions-secondary top-gap">
            <button className="btn smallish ghost" onClick={onPrev}>Previous</button>
            {!revealed ? (
              <button
                className="btn smallish ghost"
                onClick={() => {
                  setRevealed(false)
                  onNext()
                }}
              >
                Skip
              </button>
            ) : null}
            <button
              className={revealed ? 'btn smallish' : 'btn smallish primary'}
              onClick={() => {
                if (!revealed) {
                  setRevealed(true)
                  onFlip()
                  return
                }
                setRevealed(false)
                onNext()
              }}
            >
              {revealed ? 'Next prompt' : 'Reveal strong answer'}
            </button>
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

