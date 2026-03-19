import './TagPanel.scss'

export default function TagPanel({ groupedTags, includeTags, excludeTags, toggleTag, toggleTagGroup }) {
  const otherGroup = groupedTags.find(([groupName]) => groupName === 'Other')
  const suspiciousOtherTags = (otherGroup?.[1] || []).filter(
    item => /^\d+$/.test(String(item.tag)) || /difficulty/i.test(String(item.tag)),
  )

  return (
    <div className="tag-panel glass">
      <div className="panel-header">
        <h3>Current study set</h3>
        <span>Filter by tags</span>
      </div>
      <p className="muted small">
        Click a tag to include it. Use the minus button to exclude it.
        The number on each row is card count.
      </p>
      {suspiciousOtherTags.length > 0 ? (
        <div className="tag-panel-warning">
          Some tags look like difficulty/header values ({suspiciousOtherTags.length}).
          This usually means the CSV was imported with mismatched columns.
        </div>
      ) : null}
      <div className="active-filters">
        {includeTags.map(tag => (
          <span key={`i-${tag}`} className="filter-chip include">+ {tag}</span>
        ))}
        {excludeTags.map(tag => (
          <span key={`e-${tag}`} className="filter-chip exclude">− {tag}</span>
        ))}
      </div>
      <div className="tag-groups-scroll">
        {groupedTags.map(([groupName, tags]) => (
          <section
            key={groupName}
            className={`tag-group-block ${tags.every(({ tag }) => includeTags.includes(tag)) ? 'group-selected' : ''}`}
          >
            <div className="tag-group-head">
              <button
                type="button"
                className="tag-group-title-btn"
                onClick={() => toggleTagGroup(tags.map(item => item.tag), 'include')}
                title="Include all tags in this group"
              >
                {groupName}
              </button>
              <span className="tag-group-count">
                {tags.length} tags
              </span>
            </div>
            <div className="tag-cloud">
              {tags.map(({ tag, count }) => {
                const include = includeTags.includes(tag)
                const exclude = excludeTags.includes(tag)
                return (
                  <div key={tag} className={`tag-card ${include ? 'include' : ''} ${exclude ? 'exclude' : ''}`}>
                    <button className="tag-main" onClick={() => toggleTag(tag, 'include')}>
                      <span>{tag}</span>
                      <strong>{count}</strong>
                    </button>
                    <button className="tag-minus" onClick={() => toggleTag(tag, 'exclude')}>−</button>
                  </div>
                )
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}

