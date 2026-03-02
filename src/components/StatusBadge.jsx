export default function StatusBadge({ status, grade }) {
  const hasScore = grade !== null && grade !== undefined && grade !== ''
  const parsedScore = hasScore ? Number(grade) : null

  const getBadgeState = () => {
    if (status === 'SUBMITTED') return 'SUBMITTED'
    if (hasScore && !Number.isNaN(parsedScore)) return 'SCORE'
    return 'PENDING'
  }

  const getDisplayText = () => {
    const state = getBadgeState()
    if (state === 'SUBMITTED') return 'Entregado'
    if (state === 'SCORE') return `Nota: ${parsedScore.toFixed(2)}`
    return 'Pendiente'
  }

  const currentState = getBadgeState()
  const displayText = getDisplayText()

  return (
    <span className={`badge ${currentState}`} title={`Nota: ${hasScore ? parsedScore.toFixed(2) : '-'}`}>
      {displayText}
    </span>
  )
}
