import TagPanelView from './views/TagPanel'
import { useAppContext } from '../context/AppContext'

export default function TagGroups() {
  const { groupedTags, includeTags, excludeTags, toggleTag, toggleTagGroup } = useAppContext()
  return (
    <TagPanelView
      groupedTags={groupedTags}
      includeTags={includeTags}
      excludeTags={excludeTags}
      toggleTag={toggleTag}
      toggleTagGroup={toggleTagGroup}
    />
  )
}

