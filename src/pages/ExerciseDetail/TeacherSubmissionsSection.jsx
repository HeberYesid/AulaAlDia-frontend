import StatusBadge from '../../components/StatusBadge'

export default function TeacherSubmissionsSection({ results }) {
  if (!results.length) {
    return (
      <div className="card card--static" style={{ margin: 0 }}>
        <h3>Entregas de estudiantes</h3>
        <p className="empty-state__text">Aún no hay entregas para este ejercicio.</p>
      </div>
    )
  }

  return (
    <div className="card card--static" style={{ margin: 0 }}>
      <h3>Entregas de estudiantes ({results.length})</h3>
      <div className="data-table" style={{ marginTop: 'var(--space-md)' }}>
        <table className="table mobile-card-view">
          <thead>
            <tr>
              <th>Estudiante</th>
              <th>Estado</th>
              <th>Entrega</th>
              <th>Comentario</th>
              <th>Actualizado</th>
            </tr>
          </thead>
          <tbody>
            {results.map((result) => (
              <tr key={result.id}>
                <td data-label="Estudiante">{result.student_name || result.student_email}</td>
                <td data-label="Estado">
                  <StatusBadge status={result.status} grade={result.score} />
                </td>
                <td data-label="Entrega">
                  {result.submission_download_url ? (
                    <a
                      href={result.submission_download_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: 'var(--primary)', textDecoration: 'underline' }}
                    >
                      Descargar
                    </a>
                  ) : (
                    <span style={{ color: 'var(--text-muted)' }}>—</span>
                  )}
                </td>
                <td data-label="Comentario">{result.comment || '—'}</td>
                <td data-label="Actualizado">
                  {result.updated_at ? new Date(result.updated_at).toLocaleString('es-CO') : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
