export default function StatusBadge({ status, grade, locked = false }) {
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
  const titleParts = [`Nota: ${hasScore ? parsedScore.toFixed(2) : '-'}`]
  if (locked) titleParts.push('Periodo bloqueado para edición')

  return (
    <span className={`badge ${currentState}${locked ? ' LOCKED' : ''}`} title={titleParts.join(' | ')}>
      {displayText}
    </span>
  )
}
