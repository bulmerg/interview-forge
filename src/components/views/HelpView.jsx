import './HelpView.scss'

const HELP_SECTIONS = [
  {
    title: 'Study',
    points: [
      'Use Build Study Set filters (tags, due-only, search, difficulty) to focus your session.',
      'Reveal the answer, then grade with Again/Hard/Good/Easy to drive spaced repetition.',
      'Use Star to mark cards you want to revisit later.',
    ],
  },
  {
    title: 'Quiz',
    points: [
      'Quiz alternates direct answer checks and reasoning prompts when Why is available.',
      'Use it to rehearse concise interview responses, not just recognition.',
    ],
  },
  {
    title: 'Interview',
    points: [
      'Generates a prompt set for mock interview rounds.',
      'Reveal answers only after attempting your spoken response first.',
    ],
  },
  {
    title: 'Analytics',
    points: [
      'Shows weak topics and missed cards based on your review history.',
      'Use this to choose what to study next.',
    ],
  },
  {
    title: 'Create',
    points: [
      'Guided Topic creates multiple interview-style draft cards from one concept.',
      'Paste Notes extracts draft cards without AI using rule-based parsing.',
      'Single Card is fastest when you already know the exact prompt.',
    ],
  },
  {
    title: 'Import (Advanced)',
    points: [
      'Use this for CSV merge/overwrite workflows.',
      'Starter deck loading and Create are the default MVP workflows.',
    ],
  },
]

export default function HelpView() {
  return (
    <div className="help-panel glass">
      <div className="panel-header">
        <h3>Help and onboarding</h3>
        <span>Quick guide</span>
      </div>
      <p className="muted small">
        Practice interview thinking: what, why, when, tradeoffs, traps, and scenario reasoning.
      </p>

      <div className="help-grid top-gap">
        {HELP_SECTIONS.map(section => (
          <article className="help-card" key={section.title}>
            <h4>{section.title}</h4>
            <ul>
              {section.points.map(point => <li key={point}>{point}</li>)}
            </ul>
          </article>
        ))}
      </div>
    </div>
  )
}
