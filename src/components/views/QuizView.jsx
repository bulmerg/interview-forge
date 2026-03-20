import { useEffect, useRef, useState } from 'react'
import CardGlows from '../CardGlows'
import ExpandableText from '../ExpandableText'
import ReasoningSections from '../ReasoningSections'
import { answerMatches, shuffle } from '../../lib/shared'
import './QuizView.scss'

export default function QuizView({ cards }) {
  const [quizDeck, setQuizDeck] = useState(() =>
    cards.length ? shuffle([...cards], Date.now() + Math.random() * 1e6) : [],
  )
  const [quizIndex, setQuizIndex] = useState(0)
  const [userAnswer, setUserAnswer] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [wasCorrect, setWasCorrect] = useState(false)
  const totalRef = useRef(0)
  totalRef.current = quizDeck.length

  useEffect(() => {
    if (!cards.length) {
      setQuizDeck([])
      return
    }
    setQuizDeck(shuffle([...cards], Date.now() + Math.random() * 1e6))
    setQuizIndex(0)
  }, [cards])

  const card = quizDeck[quizIndex] || null
  const questionType = card?.why ? (quizIndex % 2 === 0 ? 'what' : 'why') : 'what'
  const total = quizDeck.length

  function handleSubmit(e) {
    e?.preventDefault()
    if (!card || !userAnswer.trim()) return
    const correct = questionType === 'what' ? card.back : card.why
    const correctFlag = answerMatches(userAnswer.trim(), correct)
    setWasCorrect(correctFlag)
    setSubmitted(true)
  }

  function handleNext() {
    const n = Math.max(totalRef.current, 1)
    setQuizIndex(prev => (prev + 1) % n)
    setUserAnswer('')
    setSubmitted(false)
  }

  if (!total) {
    return (
      <div className="study-panel glass">
        <div className="panel-header">
          <h3>Quiz mode</h3>
        </div>
        <div className="empty-state">No cards match the current filters.</div>
      </div>
    )
  }

  return (
    <div className="study-panel glass">
      <div className="panel-header">
        <h3>Quiz mode</h3>
        <span>{total === 0 ? '' : `${quizIndex + 1} / ${total}`}</span>
      </div>
      <div className="quiz-card" key={quizIndex}>
        <CardGlows />
        <div className="flashcard-inner">
          <div className="card-meta">{questionType === 'what' ? 'What' : 'Why'}</div>
          <h4>{card.front}</h4>
          {questionType === 'why' && (
            <div className="quiz-context">
              <ExpandableText text={card.back} label="Answer:" previewChars={170} modalTitle="Full answer" />
              <p className="quiz-prompt">Why does this matter?</p>
            </div>
          )}
          {!submitted ? (
            <form onSubmit={handleSubmit} className="quiz-form">
              <input
                type="text"
                className="input quiz-input"
                placeholder={questionType === 'what' ? 'Type your answer…' : 'Explain why it matters…'}
                value={userAnswer}
                onChange={e => setUserAnswer(e.target.value)}
                autoFocus
              />
              <button type="submit" className="btn primary" disabled={!userAnswer.trim()}>Submit</button>
            </form>
          ) : (
            <div className="quiz-result">
              {wasCorrect ? (
                <p className="quiz-feedback correct">Correct! Well done.</p>
              ) : (
                <div className="quiz-feedback wrong">
                  <p><strong>Not quite.</strong></p>
                  <div className="why-box">
                    <ReasoningSections card={card} includeAnswer={questionType === 'what'} />
                  </div>
                </div>
              )}
              <button type="button" className="btn primary top-gap" onClick={handleNext}>Next question</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

