import StudyViewComponent from './views/StudyView'
import { useAppContext } from '../context/AppContext'

export default function StudyMode() {
  const {
    activeCard,
    currentIndex,
    filteredCount,
    flipped,
    onFlip,
    onPrev,
    onNext,
    onReview,
    onStar,
    onCardDifficulty,
    difficultyTargetMin,
    difficultyTargetMax,
  } = useAppContext()

  return (
    <StudyViewComponent
      activeCard={activeCard}
      currentIndex={currentIndex}
      total={filteredCount}
      flipped={flipped}
      onFlip={onFlip}
      onPrev={onPrev}
      onNext={onNext}
      onReview={onReview}
      onStar={onStar}
      onCardDifficulty={onCardDifficulty}
      difficultyTargetMin={difficultyTargetMin}
      difficultyTargetMax={difficultyTargetMax}
    />
  )
}

