export default function StatusBadge({ status, grade }) {
  // Mapear estados a textos en español
  const statusText = {
    'GREEN': 'Aprobado',
    'YELLOW': 'Suficiente',
    'RED': 'Reprobado'
  }

  const currentStatus = status || 'RED'
  const displayText = statusText[currentStatus] || 'Reprobado'

  return (
    <span className={`badge ${currentStatus}`} title={`Nota: ${grade ?? '-'}`}>
      {displayText}
    </span>
  )
}
