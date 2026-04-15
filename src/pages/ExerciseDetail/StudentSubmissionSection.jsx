import { useMemo, useState } from 'react'
import StatusBadge from '../../components/StatusBadge'
import { getApiErrorMessage } from '../../utils/apiErrorMessage'

export default function StudentSubmissionSection({ exercise, myResult, onSubmit }) {
  const [submissionFile, setSubmissionFile] = useState(null)
  const [submissionText, setSubmissionText] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const dueLabel = useMemo(() => {
    if (!exercise?.deadline) return 'Sin fecha límite'
    const dateLabel = new Date(exercise.deadline).toLocaleString('es-CO')
    if (exercise.deadline_status === 'OVERDUE') return `Vencido · ${dateLabel}`
    if (exercise.deadline_status === 'URGENT') return `Próximo a vencer · ${dateLabel}`
    return `Entrega: ${dateLabel}`
  }, [exercise])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (!submissionFile && !submissionText.trim()) {
      setError('Debes adjuntar un archivo o escribir una respuesta.')
      return
    }

    if (submissionFile && submissionFile.size > 1024 * 1024) {
      setError('El archivo no puede superar 1MB.')
      return
    }

    const formData = new FormData()
    if (submissionFile) formData.append('submission_file', submissionFile)
    if (submissionText.trim()) formData.append('submission_text', submissionText.trim())

    setSubmitting(true)
    try {
      await onSubmit(formData)
      setSubmissionFile(null)
      setSubmissionText('')
    } catch (err) {
      setError(getApiErrorMessage(err, {
        action: 'enviar tu solución',
        fallback: 'No se pudo enviar tu solución. Revisa el archivo o intentá nuevamente.',
      }))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="card card--static" style={{ margin: 0 }}>
      <h3>Tu entrega</h3>
      <p className="notice" style={{ marginTop: 'var(--space-xs)' }}>{dueLabel}</p>

      {myResult ? (
        <div style={{ margin: 'var(--space-md) 0' }}>
          <StatusBadge status={myResult.status} grade={myResult.score} />
          {myResult.comment ? (
            <p style={{ marginTop: 'var(--space-sm)', color: 'var(--text-secondary)' }}>{myResult.comment}</p>
          ) : null}
          {myResult.submission_download_url ? (
            <a
              href={myResult.submission_download_url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--primary)', textDecoration: 'underline' }}
            >
              Ver archivo enviado
            </a>
          ) : null}
        </div>
      ) : (
        <p className="empty-state__text" style={{ marginTop: 'var(--space-sm)' }}>
          Aún no registraste una entrega para este ejercicio.
        </p>
      )}

      {error ? (
        <div className="card" style={{ marginTop: 'var(--space-md)', background: 'var(--danger)', color: 'white' }}>
          {error}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} style={{ marginTop: 'var(--space-md)' }}>
        <div>
          <label htmlFor="exercise-submission-file">Archivo (PDF, DOCX, XLSX — Máx 1MB)</label>
          <input
            id="exercise-submission-file"
            type="file"
            accept=".pdf,.docx,.xlsx"
            onChange={(e) => setSubmissionFile(e.target.files?.[0] || null)}
          />
        </div>

        <div style={{ marginTop: 'var(--space-md)' }}>
          <label htmlFor="exercise-submission-text">Respuesta en texto</label>
          <textarea
            id="exercise-submission-text"
            rows="5"
            maxLength={5000}
            value={submissionText}
            onChange={(e) => setSubmissionText(e.target.value)}
            placeholder="Escribí tu respuesta..."
          />
        </div>

        <button type="submit" className="btn" disabled={submitting} style={{ marginTop: 'var(--space-md)' }}>
          {submitting ? 'Enviando...' : myResult ? 'Reenviar solución' : 'Enviar solución'}
        </button>
      </form>
    </div>
  )
}
