export default function MiniMeta({ label, value }) {
  return (
    <div className="mini-meta">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

