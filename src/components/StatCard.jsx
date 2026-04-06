export default function StatCard({ label, value, icon = null, className = '' }) {
  const classes = ['stat-card', className].filter(Boolean).join(' ')

  return (
    <div className={classes}>
      {icon ? <div className="stat-icon" aria-hidden="true">{icon}</div> : null}
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  )
}
