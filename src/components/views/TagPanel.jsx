import './TagPanel.scss'

export default function TagPanel({ groupedTags, includeTags, excludeTags, toggleTag, toggleTagGroup }) {
  const otherGroup = groupedTags.find(([groupName]) => groupName === 'Other')
  const suspiciousOtherTags = (otherGroup?.[1] || []).filter(
    item => /^\d+$/.test(String(item.tag)) || /difficulty/i.test(String(item.tag)),
  )
  const selectedCount = includeTags.length
  const excludedCount = excludeTags.length

  return (
    <div className="tag-panel glass">
      <div className="panel-header">
        <h3>Focus areas</h3>
        <span>Select focus areas · minus to exclude</span>
      </div>
      <div className="tag-summary" role="status" aria-live="polite">
        <span className="tag-summary-pill include">Selected: {selectedCount}</span>
        <span className="tag-summary-pill exclude">Excluded: {excludedCount}</span>
      </div>
      {suspiciousOtherTags.length > 0 ? (
        <div className="tag-panel-warning">
          Some tags look like difficulty/header values ({suspiciousOtherTags.length}).
          This usually means the CSV was imported with mismatched columns.
        </div>
      ) : null}
      <div className="active-filters">
        {selectedCount === 0 && excludedCount === 0 ? (
          <span className="active-filters-empty">No focus filters yet</span>
        ) : null}
        {includeTags.map(tag => (
          <span key={`i-${tag}`} className="filter-chip include">+ {tag}</span>
        ))}
        {excludeTags.map(tag => (
          <span key={`e-${tag}`} className="filter-chip exclude">− {tag}</span>
        ))}
      </div>
      <div className="tag-groups-scroll">
        {groupedTags.map(([groupName, tags]) => {
          const groupTagNames = tags.map(item => item.tag)
          const includedInGroup = groupTagNames.filter(tag => includeTags.includes(tag)).length
          const excludedInGroup = groupTagNames.filter(tag => excludeTags.includes(tag)).length
          const groupSize = groupTagNames.length
          const allIncluded = groupSize > 0 && includedInGroup === groupSize
          const mostlyIncluded = !allIncluded && groupSize > 0 && includedInGroup >= Math.ceil(groupSize * 0.6)
          const partiallyIncluded = !allIncluded && includedInGroup > 0

          return (
            <section
              key={groupName}
              className={`tag-group-block ${allIncluded ? 'group-selected' : ''} ${mostlyIncluded ? 'group-mostly' : ''} ${partiallyIncluded ? 'group-partial' : ''} ${excludedInGroup > 0 ? 'group-has-excluded' : ''}`}
            >
              <div className="tag-group-head">
                <button
                  type="button"
                  className="tag-group-title-btn"
                  onClick={() => toggleTagGroup(groupTagNames, 'include')}
                  title="Include all tags in this group"
                >
                  {groupName}
                </button>
                <span className="tag-group-count">
                  {includedInGroup > 0 ? `${includedInGroup}/${groupSize} selected` : `${groupSize} tags`}
                  {excludedInGroup > 0 ? ` · ${excludedInGroup} excluded` : ''}
                </span>
              </div>
              <div className="tag-cloud">
                {tags.map(({ tag, count }) => {
                  const include = includeTags.includes(tag)
                  const exclude = excludeTags.includes(tag)
                  return (
                    <div key={tag} className={`tag-card ${include ? 'include' : ''} ${exclude ? 'exclude' : ''} ${!include && !exclude ? 'neutral' : ''}`}>
                      <button className="tag-main" onClick={() => toggleTag(tag, 'include')} title={`Include ${tag}`}>
                        <span className="tag-label">{tag}</span>
                        <strong className="tag-count">{count}</strong>
                      </button>
                      <button className="tag-minus" onClick={() => toggleTag(tag, 'exclude')} title={`Exclude ${tag}`} aria-label={`Exclude ${tag}`}>−</button>
                    </div>
                  )
                })}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}

