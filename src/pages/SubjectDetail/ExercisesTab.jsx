import { useState, useMemo, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../api/axios'
import ConfirmDialog from '../../components/ConfirmDialog'
import { getApiErrorMessage } from '../../utils/apiErrorMessage'

const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'

function handleFocusTrap(e, ref) {
  if (e.key !== 'Tab') return
  const focusables = [...(ref.current?.querySelectorAll(FOCUSABLE) || [])]
  if (focusables.length < 2) return
  const first = focusables[0]
  const last = focusables[focusables.length - 1]
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
}

function resolveExerciseSubjectPayload(id) {
  const numericId = Number(id)
  if (Number.isNaN(numericId)) return { subject: id }
  if (numericId < 0) return { course_subject: Math.abs(numericId) }
  return { subject: numericId }
}

export default function ExercisesTab({ user, id, exercises, loadAll, setError, setSuccess }) {
  const [exerciseSearch, setExerciseSearch] = useState('')
  const [showExerciseForm, setShowExerciseForm] = useState(false)
  const [newExerciseName, setNewExerciseName] = useState('')
  const [newExerciseDeadline, setNewExerciseDeadline] = useState('')
  const [newExerciseDescription, setNewExerciseDescription] = useState('')
  const [newExerciseFile, setNewExerciseFile] = useState(null)

  const [editingExercise, setEditingExercise] = useState(null)
  const [editExerciseName, setEditExerciseName] = useState('')
  const [editExerciseDeadline, setEditExerciseDeadline] = useState('')
  const [editExerciseDescription, setEditExerciseDescription] = useState('')
  const [editExerciseFile, setEditExerciseFile] = useState(null)

  const [confirmDeleteExercise, setConfirmDeleteExercise] = useState(null)

  const editExerciseDialogRef = useRef(null)
  const lastFocusRef = useRef(null)

  useEffect(() => { if (editingExercise) editExerciseDialogRef.current?.focus() }, [editingExercise])

  const isTeacherOrAdmin = user?.role === 'TEACHER' || user?.role === 'ADMIN'

  const filteredExercises = useMemo(() => {
    if (!exerciseSearch.trim()) return exercises
    const search = exerciseSearch.toLowerCase()
    return exercises.filter(ex => ex.name.toLowerCase().includes(search))
  }, [exercises, exerciseSearch])

  /* ── Handlers ── */

  const handleCreateExercise = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    try {
      const formData = new FormData()
      const subjectPayload = resolveExerciseSubjectPayload(id)
      Object.entries(subjectPayload).forEach(([key, value]) => {
        formData.append(key, value)
      })
      formData.append('name', newExerciseName)
      formData.append('order', exercises.length)
      if (newExerciseDeadline) formData.append('deadline', newExerciseDeadline)
      if (newExerciseDescription) formData.append('description', newExerciseDescription)
      if (newExerciseFile) formData.append('attachment', newExerciseFile)

      await api.post('/api/v1/courses/exercises/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setSuccess(`Ejercicio "${newExerciseName}" creado correctamente`)
      setNewExerciseName('')
      setNewExerciseDeadline('')
      setNewExerciseDescription('')
      setNewExerciseFile(null)
      setShowExerciseForm(false)
      loadAll()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      const errorMsg = err.response?.data?.name?.[0] ||
        err.response?.data?.non_field_errors?.[0] ||
        getApiErrorMessage(err, {
          action: 'crear el ejercicio',
          fallback: 'No se pudo crear el ejercicio. Verifica el nombre, la fecha limite y el periodo academico.',
        })
      setError(errorMsg)
    }
  }

  const handleDeleteExercise = async (exerciseId) => {
    try {
      await api.delete(`/api/v1/courses/exercises/${exerciseId}/`)
      setSuccess('Ejercicio eliminado correctamente')
      loadAll()
      setTimeout(() => setSuccess(''), 3000)
    } catch {
      setError('No se pudo eliminar el ejercicio. Es posible que tenga resultados asociados o que no tengas permisos.')
    }
  }

  const openEditModal = (exercise) => {
    lastFocusRef.current = document.activeElement
    setEditingExercise(exercise)
    setEditExerciseName(exercise.name)
    setEditExerciseDeadline(exercise.deadline || '')
    setEditExerciseDescription(exercise.description || '')
    setError('')
    setSuccess('')
  }

  const closeEditModal = () => {
    setEditingExercise(null)
    setEditExerciseName('')
    setEditExerciseDeadline('')
    setEditExerciseDescription('')
    setEditExerciseFile(null)
    setError('')
    setTimeout(() => lastFocusRef.current?.focus(), 0)
  }

  const handleUpdateExercise = async (e) => {
    e.preventDefault()
    if (!editingExercise) return
    if (!editExerciseName.trim()) { setError('El nombre del ejercicio es obligatorio'); return }
    setError('')
    setSuccess('')

    try {
      const formData = new FormData()
      formData.append('name', editExerciseName.trim())
      formData.append('deadline', editExerciseDeadline || '')
      formData.append('description', editExerciseDescription.trim() || '')
      if (editExerciseFile) formData.append('attachment', editExerciseFile)

      await api.patch(`/api/v1/courses/exercises/${editingExercise.id}/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setSuccess(`Ejercicio "${editExerciseName}" actualizado correctamente`)
      closeEditModal()
      loadAll()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      const errorMsg = err.response?.data?.name?.[0] ||
        err.response?.data?.non_field_errors?.[0] ||
        getApiErrorMessage(err, {
          action: 'actualizar el ejercicio',
          fallback: 'No se pudo actualizar el ejercicio. Verifica los campos del formulario y vuelve a intentarlo.',
        })
      setError(errorMsg)
    }
  }

  /* ── Deadline badge helper ── */
  const getDeadlineBadge = (ex) => {
    if (!ex.deadline) return null
    const deadlineDate = new Date(ex.deadline)
    const now = new Date()
    const diffDays = Math.ceil((deadlineDate - now) / (1000 * 60 * 60 * 24))

    let color = 'var(--success)'
    let icon = '\u2713'
    let text = `${diffDays} días`

    if (diffDays < 0) {
      color = 'var(--danger)'; icon = ''; text = `Vencido hace ${Math.abs(diffDays)} días`
    } else if (diffDays === 0) {
      color = 'var(--danger)'; icon = '\uD83D\uDD25'; text = 'Vence HOY'
    } else if (diffDays <= 3) {
      color = 'var(--warning)'; icon = '\u2717'; text = `${diffDays} día${diffDays > 1 ? 's' : ''}`
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
        <span style={{ fontSize: 'var(--font-size-sm)' }}>
          {deadlineDate.toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </span>
        <span style={{ fontSize: 'var(--font-size-xs)', color, fontWeight: 'bold' }}>{icon} {text}</span>
      </div>
    )
  }

  /* ── Render ── */
  return (
    <div className="tab-sections" role="tabpanel" aria-labelledby="tab-exercises">
      {confirmDeleteExercise && (
        <ConfirmDialog
          title="¿Eliminar ejercicio?"
          message={`¿Estás seguro de eliminar el ejercicio "${confirmDeleteExercise.name}"? Esto eliminará todos los resultados asociados. Esta acción no se puede deshacer.`}
          onConfirm={() => { const ex = confirmDeleteExercise; setConfirmDeleteExercise(null); handleDeleteExercise(ex.id) }}
          onCancel={() => setConfirmDeleteExercise(null)}
        />
      )}

      {/* ── Create Exercise ── */}
      {isTeacherOrAdmin && (
        <div className="card card--static section-card">
          <div className="section-header">
            <h3>Crear Ejercicio</h3>
            {!showExerciseForm && (
              <button className="btn" onClick={() => setShowExerciseForm(true)}>Nuevo Ejercicio</button>
            )}
          </div>

          {showExerciseForm && (
            <div className="form-panel">
              <form onSubmit={handleCreateExercise} style={{ maxWidth: '700px' }}>
                <div>
                  <label htmlFor="create-exercise-name">Nombre del Ejercicio *</label>
                  <input id="create-exercise-name" type="text" value={newExerciseName} onChange={(e) => setNewExerciseName(e.target.value)} placeholder="Ej: Ejercicio 1 - Ecuaciones Lineales" required />
                </div>

                <div>
                  <label htmlFor="create-exercise-desc">Descripción (Opcional)</label>
                  <textarea id="create-exercise-desc" value={newExerciseDescription} onChange={(e) => setNewExerciseDescription(e.target.value)} placeholder="Describe en qué consiste este ejercicio…" rows="3" />
                </div>

                <div>
                  <label htmlFor="create-exercise-deadline">Fecha Límite (Opcional)</label>
                  <input id="create-exercise-deadline" type="datetime-local" value={newExerciseDeadline} onChange={(e) => setNewExerciseDeadline(e.target.value)} />
                </div>

                <div>
                  <label htmlFor="create-exercise-file">Archivo Adjunto (Opcional)</label>
                  <input id="create-exercise-file" type="file" onChange={(e) => setNewExerciseFile(e.target.files[0])} />
                </div>

                <p className="notice" style={{ margin: '0 0 var(--space-md)' }}>
                  El ejercicio se vincula automáticamente al periodo académico vigente.
                </p>

                <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                  <button className="btn" type="submit" style={{ flex: 1 }}>Crear Ejercicio</button>
                  <button className="btn secondary" type="button" style={{ flex: 1 }} onClick={() => { setShowExerciseForm(false); setNewExerciseName(''); setNewExerciseDeadline(''); setNewExerciseDescription(''); setNewExerciseFile(null); setError('') }}>Cancelar</button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* ── Exercise List ── */}
      <div className="card card--static section-card">
        <div className="section-header">
          <h3>Lista de Ejercicios ({exercises.length})</h3>
        </div>

        {exercises.length > 0 && (
          <div className="search-bar" style={{ marginBottom: 'var(--space-md)' }}>
            <input type="text" aria-label="Buscar ejercicio por nombre" placeholder="Buscar ejercicio por nombre…" value={exerciseSearch} onChange={(e) => setExerciseSearch(e.target.value)} />
            {exerciseSearch && (
              <p className="notice" style={{ marginTop: 'var(--space-sm)' }}>Mostrando {filteredExercises.length} de {exercises.length} ejercicios</p>
            )}
          </div>
        )}

        {exercises.length === 0 ? (
          <div className="empty-state">
            <p className="empty-state__title">No hay ejercicios creados</p>
            <p className="empty-state__text">Crea el primer ejercicio para empezar a cargar resultados.</p>
          </div>
        ) : filteredExercises.length === 0 ? (
          <p className="notice">No se encontraron ejercicios que coincidan con &ldquo;{exerciseSearch}&rdquo;</p>
        ) : (
          <div className="data-table">
            <table className="table mobile-card-view">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Nombre</th>
                  <th>Descripción</th>
                  <th>Archivo</th>
                  <th>Fecha Límite</th>
                  {isTeacherOrAdmin && <th>Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {filteredExercises.map((ex, index) => (
                  <tr key={ex.id}>
                    <td data-label="#"><strong>{index + 1}</strong></td>
                    <td data-label="Nombre">
                      <strong>
                        <Link to={`/subjects/${id}/exercises/${ex.id}`} style={{ color: 'var(--primary)' }}>
                          {ex.name}
                        </Link>
                      </strong>
                    </td>
                    <td data-label="Descripción" style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
                      {ex.description || <em>Sin descripción</em>}
                    </td>
                    <td data-label="Archivo">
                      {ex.attachment_download_url ? (
                        <a href={ex.attachment_download_url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', textDecoration: 'underline' }}>Descargar</a>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>—</span>
                      )}
                    </td>
                    <td data-label="Fecha Límite">
                      {getDeadlineBadge(ex) || <em style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>Sin fecha límite</em>}
                    </td>
                    {isTeacherOrAdmin && (
                      <td data-label="Acciones">
                        <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                          <button className="btn" style={{ padding: '0.4rem 0.8rem', fontSize: 'var(--font-size-sm)', flex: 1 }} onClick={() => openEditModal(ex)}>Editar</button>
                          <button className="btn danger" style={{ padding: '0.4rem 0.8rem', fontSize: 'var(--font-size-sm)', flex: 1 }} onClick={() => setConfirmDeleteExercise({ id: ex.id, name: ex.name })}>Eliminar</button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Edit Exercise Modal ── */}
      {editingExercise && isTeacherOrAdmin && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 'var(--space-md)' }} role="presentation">
          <button type="button" className="modal-backdrop-button" aria-label="Cerrar modal de editar ejercicio" onClick={closeEditModal} />
          <div
            className="card modal-responsive"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-exercise-modal-title"
            tabIndex={-1}
            ref={editExerciseDialogRef}
            onKeyDown={(e) => handleFocusTrap(e, editExerciseDialogRef)}
            style={{ maxWidth: 600, width: '100%', margin: 0, position: 'relative', zIndex: 1, animation: 'fadeIn 0.2s ease' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="edit-exercise-modal-title">Editar Ejercicio</h2>

            <div style={{ background: 'var(--bg-secondary)', padding: 'var(--space-md)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-lg)' }}>
              <p style={{ margin: 'var(--space-xs) 0' }}><strong>Ejercicio Original:</strong> {editingExercise.name}</p>
              {editingExercise.deadline && (
                <p style={{ margin: 'var(--space-xs) 0' }}>
                  <strong>Fecha Límite Actual:</strong>{' '}
                  {new Date(editingExercise.deadline).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              )}
            </div>

            <form onSubmit={handleUpdateExercise}>
              <div>
                <label htmlFor="edit-exercise-name">Nombre del Ejercicio *</label>
                <input id="edit-exercise-name" type="text" value={editExerciseName} onChange={(e) => setEditExerciseName(e.target.value)} placeholder="Ej: Taller 1 - Variables" required />
              </div>
              <div>
                <label htmlFor="edit-exercise-deadline">Fecha Límite (Opcional)</label>
                <input id="edit-exercise-deadline" type="datetime-local" value={editExerciseDeadline} onChange={(e) => setEditExerciseDeadline(e.target.value)} />
              </div>
              <div>
                <label htmlFor="edit-exercise-desc">Descripción (Opcional)</label>
                <textarea id="edit-exercise-desc" value={editExerciseDescription} onChange={(e) => setEditExerciseDescription(e.target.value)} placeholder="Descripción detallada del ejercicio…" rows="4" />
              </div>
              <div>
                <label htmlFor="edit-exercise-file">Archivo Adjunto (Opcional)</label>
                <input id="edit-exercise-file" type="file" onChange={(e) => setEditExerciseFile(e.target.files[0])} />
              </div>

              <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                <button type="submit" className="btn" style={{ flex: 1 }}>Guardar Cambios</button>
                <button type="button" className="btn secondary" onClick={closeEditModal} style={{ flex: 1 }}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
