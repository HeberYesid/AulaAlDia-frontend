export default function StatusBadge({ status, grade }) {
  return (
    <span className={`badge ${status || 'RED'}`} title={`Nota: ${grade ?? '-'}`}>
      {status || 'RED'}
    </span>
  )
}
