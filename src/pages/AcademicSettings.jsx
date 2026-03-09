import { useEffect, useState } from 'react'
import { api } from '../api/axios'
import Alert from '../components/Alert'

const DEFAULT_SETTINGS = {
  period_scheme: 'TRIMESTER',
  min_grade: '1.00',
  max_grade: '5.00',
  passing_grade: '3.00',
  lock_grades_after_deadline: true,
  active_grading_scale: null,
}

const DEFAULT_PERIOD = {
  year: new Date().getFullYear(),
  sequence: 1,
  name: '',
  start_date: '',
  end_date: '',
  grading_deadline: '',
  lock_after_deadline: true,
}

const DEFAULT_SCALE = {
  name: '',
  description: '',
  is_active: false,
  ranges: [
    { label: 'Superior', min_value: '4.60', max_value: '5.00', order: 1 },
    { label: 'Alto', min_value: '4.00', max_value: '4.59', order: 2 },
    { label: 'Básico', min_value: '3.00', max_value: '3.99', order: 3 },
    { label: 'Bajo', min_value: '0.00', max_value: '2.99', order: 4 },
  ],
}

function toLocalDateTimeInput(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const offset = date.getTimezoneOffset()
  const localDate = new Date(date.getTime() - offset * 60 * 1000)
  return localDate.toISOString().slice(0, 16)
}

function normalizeApiError(error, fallback) {
  const detail = error?.response?.data?.detail
  if (typeof detail === 'string' && detail.trim()) return detail

  const firstEntry = Object.values(error?.response?.data || {})[0]
  if (Array.isArray(firstEntry) && firstEntry[0]) return firstEntry[0]
  if (typeof firstEntry === 'string' && firstEntry.trim()) return firstEntry

  return fallback
}

function createDefaultPeriod() {
  return {
    year: new Date().getFullYear(),
    sequence: 1,
    name: '',
    start_date: '',
    end_date: '',
    grading_deadline: '',
    lock_after_deadline: true,
  }
}

function createDefaultScale() {
  return {
    name: '',
    description: '',
    is_active: false,
    ranges: [
      { label: 'Superior', min_value: '4.60', max_value: '5.00', order: 1 },
      { label: 'Alto', min_value: '4.00', max_value: '4.59', order: 2 },
      { label: 'Básico', min_value: '3.00', max_value: '3.99', order: 3 },
      { label: 'Bajo', min_value: '0.00', max_value: '2.99', order: 4 },
    ],
  }
}

function buildPeriodForm(period) {
  return {
    year: period.year,
    sequence: period.sequence,
    name: period.name || '',
    start_date: period.start_date || '',
    end_date: period.end_date || '',
    grading_deadline: toLocalDateTimeInput(period.grading_deadline),
    lock_after_deadline: Boolean(period.lock_after_deadline),
  }
}

function buildScaleForm(scale) {
  return {
    name: scale.name || '',
    description: scale.description || '',
    is_active: Boolean(scale.is_active),
    ranges: (scale.ranges || []).map((range, index) => ({
      id: range.id,
      label: range.label,
      min_value: String(range.min_value),
      max_value: String(range.max_value),
      order: Number(range.order || index + 1),
    })),
  }
}

export default function AcademicSettings() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const [periods, setPeriods] = useState([])
  const [scales, setScales] = useState([])
  const [settingsForm, setSettingsForm] = useState(DEFAULT_SETTINGS)
  const [periodForm, setPeriodForm] = useState(DEFAULT_PERIOD)
  const [scaleForm, setScaleForm] = useState(DEFAULT_SCALE)
  const [editingPeriodId, setEditingPeriodId] = useState(null)
  const [editingScaleId, setEditingScaleId] = useState(null)
  const [savingSettings, setSavingSettings] = useState(false)
  const [savingPeriod, setSavingPeriod] = useState(false)
  const [savingScale, setSavingScale] = useState(false)

  useEffect(() => {
    loadAcademicAdmin()
  }, [])

  async function loadAcademicAdmin() {
    setLoading(true)
    setError('')
    try {
      const [settingsResult, periodsResult, scalesResult] = await Promise.all([
        api.get('/api/v1/courses/academic-settings/'),
        api.get('/api/v1/courses/academic-periods/'),
        api.get('/api/v1/courses/grading-scales/'),
      ])

      const nextSettings = settingsResult.data || DEFAULT_SETTINGS
      const nextPeriods = periodsResult.data?.results || periodsResult.data || []
      const nextScales = scalesResult.data?.results || scalesResult.data || []

      setSettings(nextSettings)
      setSettingsForm({
        period_scheme: nextSettings.period_scheme || 'TRIMESTER',
        min_grade: String(nextSettings.min_grade ?? '1.00'),
        max_grade: String(nextSettings.max_grade ?? '5.00'),
        passing_grade: String(nextSettings.passing_grade ?? '3.00'),
        lock_grades_after_deadline: Boolean(nextSettings.lock_grades_after_deadline),
        active_grading_scale: nextSettings.active_grading_scale,
      })
      setPeriods(Array.isArray(nextPeriods) ? nextPeriods : [])
      setScales(Array.isArray(nextScales) ? nextScales : [])
    } catch (err) {
      setError(normalizeApiError(err, 'No se pudo cargar la configuración académica.'))
    } finally {
      setLoading(false)
    }
  }

  function updateScaleRange(index, field, value) {
    setScaleForm((current) => ({
      ...current,
      ranges: current.ranges.map((range, rangeIndex) => (
        rangeIndex === index ? { ...range, [field]: value } : range
      )),
    }))
  }

  function addScaleRange() {
    setScaleForm((current) => ({
      ...current,
      ranges: [
        ...current.ranges,
        { label: '', min_value: '', max_value: '', order: current.ranges.length + 1 },
      ],
    }))
  }

  function removeScaleRange(index) {
    setScaleForm((current) => ({
      ...current,
      ranges: current.ranges
        .filter((_, rangeIndex) => rangeIndex !== index)
        .map((range, rangeIndex) => ({ ...range, order: rangeIndex + 1 })),
    }))
  }

  async function handleSaveSettings(event) {
    event.preventDefault()
    setSavingSettings(true)
    setError('')
    setSuccess('')

    try {
      const payload = {
        ...settingsForm,
        min_grade: Number(settingsForm.min_grade),
        max_grade: Number(settingsForm.max_grade),
        passing_grade: Number(settingsForm.passing_grade),
        active_grading_scale: settingsForm.active_grading_scale || null,
      }
      const { data } = await api.patch('/api/v1/courses/academic-settings/', payload)
      setSettings(data)
      setSettingsForm({
        period_scheme: data.period_scheme,
        min_grade: String(data.min_grade),
        max_grade: String(data.max_grade),
        passing_grade: String(data.passing_grade),
        lock_grades_after_deadline: Boolean(data.lock_grades_after_deadline),
        active_grading_scale: data.active_grading_scale,
      })
      setSuccess('Configuración académica actualizada.')
    } catch (err) {
      setError(normalizeApiError(err, 'No se pudo actualizar la configuración académica.'))
    } finally {
      setSavingSettings(false)
    }
  }

  async function handleCreatePeriod(event) {
    event.preventDefault()
    setSavingPeriod(true)
    setError('')
    setSuccess('')

    try {
      const payload = {
        year: Number(periodForm.year),
        sequence: Number(periodForm.sequence),
        period_number: Number(periodForm.sequence),
        name: periodForm.name,
        start_date: periodForm.start_date || null,
        end_date: periodForm.end_date || null,
        grading_deadline: periodForm.grading_deadline || null,
        lock_after_deadline: Boolean(periodForm.lock_after_deadline),
      }
      if (editingPeriodId) {
        await api.patch(`/api/v1/courses/academic-periods/${editingPeriodId}/`, payload)
        setSuccess('Periodo académico actualizado.')
      } else {
        await api.post('/api/v1/courses/academic-periods/', payload)
        setSuccess('Periodo académico creado.')
      }
      setPeriodForm(createDefaultPeriod())
      setEditingPeriodId(null)
      loadAcademicAdmin()
    } catch (err) {
      setError(normalizeApiError(err, editingPeriodId ? 'No se pudo actualizar el periodo académico.' : 'No se pudo crear el periodo académico.'))
    } finally {
      setSavingPeriod(false)
    }
  }

  function handleEditPeriod(period) {
    setEditingPeriodId(period.id)
    setPeriodForm(buildPeriodForm(period))
    setError('')
    setSuccess('')
  }

  function handleCancelPeriodEdit() {
    setEditingPeriodId(null)
    setPeriodForm(createDefaultPeriod())
    setError('')
  }

  async function handleClosePeriod(periodId) {
    setError('')
    setSuccess('')
    try {
      const { data } = await api.post(`/api/v1/courses/academic-periods/${periodId}/close/`)
      setSuccess(data?.detail || 'Periodo cerrado correctamente.')
      loadAcademicAdmin()
    } catch (err) {
      setError(normalizeApiError(err, 'No se pudo cerrar el periodo académico.'))
    }
  }

  async function handleCreateScale(event) {
    event.preventDefault()
    setSavingScale(true)
    setError('')
    setSuccess('')

    try {
      const payload = {
        ...scaleForm,
        ranges: scaleForm.ranges.map((range, index) => ({
          ...(range.id ? { id: range.id } : {}),
          ...range,
          order: Number(range.order || index + 1),
          min_value: Number(range.min_value),
          max_value: Number(range.max_value),
        })),
      }
      if (editingScaleId) {
        await api.patch(`/api/v1/courses/grading-scales/${editingScaleId}/`, payload)
        setSuccess('Escala de valoración actualizada.')
      } else {
        await api.post('/api/v1/courses/grading-scales/', payload)
        setSuccess('Escala de valoración creada.')
      }
      setScaleForm(createDefaultScale())
      setEditingScaleId(null)
      loadAcademicAdmin()
    } catch (err) {
      setError(normalizeApiError(err, editingScaleId ? 'No se pudo actualizar la escala de valoración.' : 'No se pudo crear la escala de valoración.'))
    } finally {
      setSavingScale(false)
    }
  }

  function handleEditScale(scale) {
    setEditingScaleId(scale.id)
    setScaleForm(buildScaleForm(scale))
    setError('')
    setSuccess('')
  }

  function handleCancelScaleEdit() {
    setEditingScaleId(null)
    setScaleForm(createDefaultScale())
    setError('')
  }

  if (loading) {
    return <div className="card"><p>Cargando configuración académica...</p></div>
  }

  return (
    <div className="academic-admin">
      <Alert type="error" message={error} />
      <Alert type="success" message={success} />

      <div className="card academic-admin__hero">
        <p className="eyebrow">Administración académica</p>
        <h1>Configuración del año, periodos y escalas</h1>
        <p>
          Define el esquema del calendario académico, la escala numérica operativa y la
          traducción cualitativa usada por tu institución.
        </p>
      </div>

      <div className="grid cols-2 grid-stack-mobile">
        <section className="card">
          <h2>Configuración general</h2>
          <form onSubmit={handleSaveSettings} className="academic-admin__form">
            <div>
              <label htmlFor="period-scheme">Esquema del año</label>
              <select
                id="period-scheme"
                value={settingsForm.period_scheme}
                onChange={(event) => setSettingsForm((current) => ({ ...current, period_scheme: event.target.value }))}
              >
                <option value="TRIMESTER">Trimestral</option>
                <option value="SEMESTER">Semestral</option>
                <option value="CYCLES">Por ciclos</option>
              </select>
            </div>

            <div className="academic-admin__grid-3">
              <div>
                <label htmlFor="min-grade">Nota mínima</label>
                <input
                  id="min-grade"
                  type="number"
                  step="0.01"
                  min="0"
                  max="5"
                  value={settingsForm.min_grade}
                  onChange={(event) => setSettingsForm((current) => ({ ...current, min_grade: event.target.value }))}
                />
              </div>
              <div>
                <label htmlFor="max-grade">Nota máxima</label>
                <input
                  id="max-grade"
                  type="number"
                  step="0.01"
                  min="0"
                  max="5"
                  value={settingsForm.max_grade}
                  onChange={(event) => setSettingsForm((current) => ({ ...current, max_grade: event.target.value }))}
                />
              </div>
              <div>
                <label htmlFor="passing-grade">Nota aprobatoria</label>
                <input
                  id="passing-grade"
                  type="number"
                  step="0.01"
                  min="0"
                  max="5"
                  value={settingsForm.passing_grade}
                  onChange={(event) => setSettingsForm((current) => ({ ...current, passing_grade: event.target.value }))}
                />
              </div>
            </div>

            <div>
              <label htmlFor="active-scale">Escala cualitativa activa</label>
              <select
                id="active-scale"
                value={settingsForm.active_grading_scale || ''}
                onChange={(event) => setSettingsForm((current) => ({
                  ...current,
                  active_grading_scale: event.target.value ? Number(event.target.value) : null,
                }))}
              >
                <option value="">Sin traducción cualitativa</option>
                {scales.map((scale) => (
                  <option key={scale.id} value={scale.id}>{scale.name}</option>
                ))}
              </select>
            </div>

            <label className="academic-admin__checkbox">
              <input
                type="checkbox"
                checked={settingsForm.lock_grades_after_deadline}
                onChange={(event) => setSettingsForm((current) => ({
                  ...current,
                  lock_grades_after_deadline: event.target.checked,
                }))}
              />
              <span>Bloquear edición de notas al vencer la fecha límite del periodo</span>
            </label>

            <button type="submit" className="btn" disabled={savingSettings}>
              {savingSettings ? 'Guardando...' : 'Guardar configuración'}
            </button>
          </form>
        </section>

        <section className="card">
          <h2>{editingPeriodId ? 'Editar periodo' : 'Crear periodo'}</h2>
          <form onSubmit={handleCreatePeriod} className="academic-admin__form">
            <div className="academic-admin__grid-2">
              <div>
                <label htmlFor="period-year">Año</label>
                <input
                  id="period-year"
                  type="number"
                  value={periodForm.year}
                  onChange={(event) => setPeriodForm((current) => ({ ...current, year: event.target.value }))}
                />
              </div>
              <div>
                <label htmlFor="period-sequence">Secuencia</label>
                <input
                  id="period-sequence"
                  type="number"
                  min="1"
                  value={periodForm.sequence}
                  onChange={(event) => setPeriodForm((current) => ({ ...current, sequence: event.target.value }))}
                />
              </div>
            </div>

            <div>
              <label htmlFor="period-name">Nombre del periodo</label>
              <input
                id="period-name"
                value={periodForm.name}
                onChange={(event) => setPeriodForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="Ej: Trimestre 1 o Ciclo A"
              />
            </div>

            <div className="academic-admin__grid-2">
              <div>
                <label htmlFor="period-start">Inicio</label>
                <input
                  id="period-start"
                  type="date"
                  value={periodForm.start_date}
                  onChange={(event) => setPeriodForm((current) => ({ ...current, start_date: event.target.value }))}
                />
              </div>
              <div>
                <label htmlFor="period-end">Fin</label>
                <input
                  id="period-end"
                  type="date"
                  value={periodForm.end_date}
                  onChange={(event) => setPeriodForm((current) => ({ ...current, end_date: event.target.value }))}
                />
              </div>
            </div>

            <div>
              <label htmlFor="grading-deadline">Fecha límite de notas</label>
              <input
                id="grading-deadline"
                type="datetime-local"
                value={periodForm.grading_deadline}
                onChange={(event) => setPeriodForm((current) => ({ ...current, grading_deadline: event.target.value }))}
              />
            </div>

            <label className="academic-admin__checkbox">
              <input
                type="checkbox"
                checked={periodForm.lock_after_deadline}
                onChange={(event) => setPeriodForm((current) => ({
                  ...current,
                  lock_after_deadline: event.target.checked,
                }))}
              />
              <span>Bloquear notas al superar la fecha límite</span>
            </label>

            <button type="submit" className="btn" disabled={savingPeriod}>
              {savingPeriod ? (editingPeriodId ? 'Guardando...' : 'Creando...') : (editingPeriodId ? 'Guardar periodo' : 'Crear periodo')}
            </button>
            {editingPeriodId ? (
              <button type="button" className="btn secondary" onClick={handleCancelPeriodEdit}>
                Cancelar edición
              </button>
            ) : null}
          </form>
        </section>
      </div>

      <section className="card">
        <div className="academic-admin__section-header">
          <div>
            <h2>Escalas cualitativas</h2>
            <p>Convierte la nota numérica a etiquetas institucionales.</p>
          </div>
        </div>

        <div className="grid cols-2 grid-stack-mobile">
          <form onSubmit={handleCreateScale} className="academic-admin__form academic-admin__scale-form">
            <div>
              <h3 style={{ marginTop: 0 }}>{editingScaleId ? 'Editar escala' : 'Nueva escala'}</h3>
              <label htmlFor="scale-name">Nombre de la escala</label>
              <input
                id="scale-name"
                value={scaleForm.name}
                onChange={(event) => setScaleForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="Escala institucional 2026"
                required
              />
            </div>
            <div>
              <label htmlFor="scale-description">Descripción</label>
              <textarea
                id="scale-description"
                rows="3"
                value={scaleForm.description}
                onChange={(event) => setScaleForm((current) => ({ ...current, description: event.target.value }))}
                placeholder="Uso para básica secundaria"
              />
            </div>
            <label className="academic-admin__checkbox">
              <input
                type="checkbox"
                checked={scaleForm.is_active}
                onChange={(event) => setScaleForm((current) => ({ ...current, is_active: event.target.checked }))}
              />
              <span>Activar esta escala al crearla</span>
            </label>

            <div className="academic-admin__ranges">
              {scaleForm.ranges.map((range, index) => (
                <div key={`${range.label}-${index}`} className="academic-admin__range-row">
                  <input
                    aria-label={`Etiqueta del rango ${index + 1}`}
                    value={range.label}
                    placeholder="Etiqueta"
                    onChange={(event) => updateScaleRange(index, 'label', event.target.value)}
                    required
                  />
                  <input
                    aria-label={`Valor mínimo del rango ${index + 1}`}
                    type="number"
                    step="0.01"
                    min="0"
                    max="5"
                    value={range.min_value}
                    placeholder="Min"
                    onChange={(event) => updateScaleRange(index, 'min_value', event.target.value)}
                    required
                  />
                  <input
                    aria-label={`Valor máximo del rango ${index + 1}`}
                    type="number"
                    step="0.01"
                    min="0"
                    max="5"
                    value={range.max_value}
                    placeholder="Max"
                    onChange={(event) => updateScaleRange(index, 'max_value', event.target.value)}
                    required
                  />
                  <button type="button" className="btn secondary" onClick={() => removeScaleRange(index)}>
                    Quitar
                  </button>
                </div>
              ))}
            </div>

            <div className="academic-admin__actions">
              <button type="button" className="btn secondary" onClick={addScaleRange}>Agregar rango</button>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                {editingScaleId ? (
                  <button type="button" className="btn secondary" onClick={handleCancelScaleEdit}>
                    Cancelar edición
                  </button>
                ) : null}
                <button type="submit" className="btn" disabled={savingScale}>
                  {savingScale ? (editingScaleId ? 'Guardando...' : 'Creando...') : (editingScaleId ? 'Guardar escala' : 'Crear escala')}
                </button>
              </div>
            </div>
          </form>

          <div className="academic-admin__scale-list">
            {scales.length === 0 ? (
              <p>No hay escalas registradas todavía.</p>
            ) : (
              scales.map((scale) => (
                <article key={scale.id} className="academic-admin__scale-card">
                  <div className="academic-admin__scale-head">
                    <h3>{scale.name}</h3>
                    {scale.is_active ? <span className="status-badge success">Activa</span> : null}
                  </div>
                  {scale.description ? <p>{scale.description}</p> : null}
                  <ul className="academic-admin__range-list">
                    {(scale.ranges || []).map((range) => (
                      <li key={range.id || `${scale.id}-${range.order}`}>
                        <strong>{range.label}</strong> {range.min_value} - {range.max_value}
                      </li>
                    ))}
                  </ul>
                  <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <button type="button" className="btn secondary" onClick={() => handleEditScale(scale)}>
                      Editar escala
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="card">
        <h2>Periodos configurados</h2>
        {periods.length === 0 ? (
          <p>No hay periodos académicos registrados.</p>
        ) : (
          <div className="table-container">
            <table className="table mobile-card-view">
              <thead>
                <tr>
                  <th scope="col">Periodo</th>
                  <th scope="col">Fechas</th>
                  <th scope="col">Límite notas</th>
                  <th scope="col">Estado</th>
                  <th scope="col">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {periods.map((period) => (
                  <tr key={period.id}>
                    <td data-label="Periodo">
                      <strong>{period.label}</strong>
                    </td>
                    <td data-label="Fechas">
                      {period.start_date || '-'}<br />{period.end_date || '-'}
                    </td>
                    <td data-label="Límite notas">
                      {period.grading_deadline ? toLocalDateTimeInput(period.grading_deadline).replace('T', ' ') : '-'}
                    </td>
                    <td data-label="Estado">
                      {period.is_closed ? 'Cerrado' : period.is_grade_locked ? 'Bloqueado' : 'Abierto'}
                    </td>
                    <td data-label="Acciones">
                      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          className="btn secondary"
                          onClick={() => handleEditPeriod(period)}
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          className="btn secondary"
                          disabled={period.is_closed}
                          onClick={() => handleClosePeriod(period.id)}
                        >
                          Cerrar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}