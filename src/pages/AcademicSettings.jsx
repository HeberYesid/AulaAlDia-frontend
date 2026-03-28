import { useEffect, useState } from 'react'
import Alert from '../components/Alert'
import ConfirmDialog from '../components/ConfirmDialog'
import { useAcademicSettings, toLocalDateTimeInput } from '../hooks/useAcademicSettings'

export default function AcademicSettings() {
  const [schoolYearConfirmDialog, setSchoolYearConfirmDialog] = useState(null)
  const [periodCloseConfirmDialog, setPeriodCloseConfirmDialog] = useState(null)
  const [loadingSchoolYearImpactId, setLoadingSchoolYearImpactId] = useState(null)

  const {
    loading,
    error,
    success,
    schoolYears,
    periods,
    settingsForm,
    schoolYearForm,
    periodForm,
    editingPeriodId,
    savingSettings,
    savingSchoolYear,
    savingPeriod,
    mutatingSchoolYearId,
    activeSchoolYear,
    setSettingsForm,
    setSchoolYearForm,
    setPeriodForm,
    loadAcademicAdmin,
    handleSaveSettings,
    handleCreateSchoolYear,
    handleToggleSchoolYearStatus,
    getSchoolYearDeactivationImpact,
    handleCreatePeriod,
    handleEditPeriod,
    handleCancelPeriodEdit,
    handleClosePeriod,
  } = useAcademicSettings()

  const activeSchoolYearStart = Number(String(activeSchoolYear?.start_date || '').slice(0, 4))
  const activeSchoolYearEnd = Number(String(activeSchoolYear?.end_date || '').slice(0, 4))
  const hasActiveSchoolYearRange = Number.isFinite(activeSchoolYearStart) && Number.isFinite(activeSchoolYearEnd)

  useEffect(() => {
    loadAcademicAdmin()
  }, [loadAcademicAdmin])

  function buildDeactivateSchoolYearMessage(schoolYear, impactPayload) {
    const impact = impactPayload?.impact || {}
    const warnings = Array.isArray(impactPayload?.warnings) ? impactPayload.warnings : []

    const activeBefore = Number(impact.active_school_years_before ?? 0)
    const activeAfter = Number(impact.active_school_years_after ?? 0)
    const periods = Number(impact.academic_periods_in_range ?? 0)
    const openPeriods = Number(impact.open_academic_periods_in_range ?? 0)
    const closedPeriods = Number(impact.closed_academic_periods_in_range ?? Math.max(periods - openPeriods, 0))
    const exercises = Number(impact.exercises_linked_to_periods ?? 0)
    const results = Number(impact.student_results_linked_to_periods ?? 0)
    const bulletins = Number(impact.bulletins_linked_to_periods ?? 0)
    const enrollments = Number(impact.enrollments_created_in_window ?? 0)

    const detailLines = [
      `Año a desactivar: ${schoolYear.label}.`,
      `Años escolares activos: ${activeBefore} -> ${activeAfter}.`,
      `Periodos en ese rango: ${periods} (${openPeriods} abiertos, ${closedPeriods} cerrados).`,
      `Ejercicios asociados a esos periodos: ${exercises}.`,
      `Resultados de estudiantes asociados: ${results}.`,
      `Boletines asociados: ${bulletins}.`,
      `Inscripciones creadas en la vigencia: ${enrollments}.`,
    ]

    if (warnings.length > 0) {
      detailLines.push('')
      detailLines.push('Advertencias importantes:')
      warnings.forEach((warning) => detailLines.push(`- ${warning}`))
    }

    return detailLines.join('\n')
  }

  function buildActivateSchoolYearMessage(nextSchoolYear, currentActiveSchoolYear) {
    return [
      `Vas a activar: ${nextSchoolYear.label}.`,
      `Esto desactivará automáticamente el año escolar activo actual: ${currentActiveSchoolYear.label}.`,
      'Asegúrate de que este cambio corresponde al periodo académico vigente.',
    ].join('\n')
  }

  function buildClosePeriodMessage(period) {
    const detailLines = [
      `Periodo a cerrar: ${period.label}.`,
      '',
      'Si continúas, ocurrirá lo siguiente:',
      '- El periodo quedará cerrado y con fecha de cierre registrada.',
      '- Las notas del periodo quedarán bloqueadas para edición.',
      '- No podrás asociar nuevos ejercicios a este periodo.',
      '- Se generarán boletines para los estudiantes con resultados en este periodo.',
      '- Si un boletín del mismo estudiante ya existe, no se sobrescribirá.',
      '- Se enviarán notificaciones de boletín disponible a estudiantes con boletín.',
      '',
      'Esta acción no se puede deshacer desde esta pantalla.',
    ]

    return detailLines.join('\n')
  }

  function handlePeriodCloseAction(period) {
    setPeriodCloseConfirmDialog({
      title: '¿Seguro que deseas cerrar este periodo académico?',
      message: buildClosePeriodMessage(period),
      onConfirm: async () => {
        setPeriodCloseConfirmDialog(null)
        await handleClosePeriod(period.id)
      },
    })
  }

  async function handleSchoolYearStatusAction(schoolYear) {
    if (!schoolYear.is_active) {
      const currentActiveSchoolYear = schoolYears.find((candidate) => (
        candidate.is_active && candidate.id !== schoolYear.id
      ))

      if (!currentActiveSchoolYear) {
        await handleToggleSchoolYearStatus(schoolYear)
        return
      }

      setSchoolYearConfirmDialog({
        title: '¿Seguro que deseas desactivar este año escolar?',
        message: buildActivateSchoolYearMessage(schoolYear, currentActiveSchoolYear),
        onConfirm: async () => {
          setSchoolYearConfirmDialog(null)
          await handleToggleSchoolYearStatus(schoolYear)
        },
      })

      return
    }

    setLoadingSchoolYearImpactId(schoolYear.id)
    try {
      const impactPayload = await getSchoolYearDeactivationImpact(schoolYear.id)
      setSchoolYearConfirmDialog({
        title: '¿Seguro que deseas desactivar este año escolar?',
        message: buildDeactivateSchoolYearMessage(schoolYear, impactPayload),
        onConfirm: async () => {
          setSchoolYearConfirmDialog(null)
          await handleToggleSchoolYearStatus(schoolYear)
        },
      })
    } catch {
      setSchoolYearConfirmDialog({
        title: '¿Seguro que deseas desactivar este año escolar?',
        message: [
          `Año a desactivar: ${schoolYear.label}.`,
          'No se pudo cargar el impacto detallado en este momento.',
          'Si continúas, tu institución podría quedar sin año escolar activo hasta activar o crear uno nuevo.',
        ].join('\n'),
        onConfirm: async () => {
          setSchoolYearConfirmDialog(null)
          await handleToggleSchoolYearStatus(schoolYear)
        },
      })
    } finally {
      setLoadingSchoolYearImpactId(null)
    }
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
        <h1>Configuración del año y periodos</h1>
        <p>
          Define el esquema del calendario académico y la escala numérica operativa de tu institución.
        </p>
      </div>

      <section className="card">
        <div className="academic-admin__section-header">
          <div>
            <h2>Años escolares</h2>
            <p>Configura vigencias institucionales, ventana de matrícula y esquema de evaluación.</p>
          </div>
        </div>

        <form onSubmit={handleCreateSchoolYear} className="academic-admin__form academic-admin__form--school-year">
          <div className="academic-admin__grid-2">
            <div>
              <label htmlFor="school-year-start">Fecha inicio</label>
              <input
                id="school-year-start"
                type="date"
                value={schoolYearForm.start_date}
                onChange={(event) => setSchoolYearForm((current) => ({ ...current, start_date: event.target.value }))}
                required
              />
            </div>
            <div>
              <label htmlFor="school-year-end">Fecha fin</label>
              <input
                id="school-year-end"
                type="date"
                value={schoolYearForm.end_date}
                onChange={(event) => setSchoolYearForm((current) => ({ ...current, end_date: event.target.value }))}
                required
              />
            </div>
          </div>

          <div className="academic-admin__grid-2">
            <div>
              <label htmlFor="school-year-enrollment-open">Apertura matrícula</label>
              <input
                id="school-year-enrollment-open"
                type="date"
                value={schoolYearForm.enrollment_open_date}
                onChange={(event) => setSchoolYearForm((current) => ({ ...current, enrollment_open_date: event.target.value }))}
                required
              />
            </div>
            <div>
              <label htmlFor="school-year-enrollment-close">Cierre matrícula</label>
              <input
                id="school-year-enrollment-close"
                type="date"
                value={schoolYearForm.enrollment_close_date}
                onChange={(event) => setSchoolYearForm((current) => ({ ...current, enrollment_close_date: event.target.value }))}
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="school-year-evaluation-type">Tipo de evaluación</label>
            <select
              id="school-year-evaluation-type"
              value={schoolYearForm.evaluation_type}
              onChange={(event) => setSchoolYearForm((current) => ({ ...current, evaluation_type: event.target.value }))}
            >
              <option value="TRIMESTER">Trimestral</option>
              <option value="SEMESTER">Semestral</option>
              <option value="CYCLES">Por ciclos</option>
            </select>
          </div>

          <label className="academic-admin__checkbox">
            <input
              type="checkbox"
              checked={schoolYearForm.is_active}
              onChange={(event) => setSchoolYearForm((current) => ({ ...current, is_active: event.target.checked }))}
            />
            <span>Crear como año escolar activo</span>
          </label>

          <button type="submit" className="btn academic-admin__submit" disabled={savingSchoolYear}>
            {savingSchoolYear ? 'Creando...' : 'Crear año escolar'}
          </button>
        </form>
      </section>

      <div className="grid cols-2 grid-stack-mobile">
        <section className="card">
          <h2>Configuración general</h2>
          <form onSubmit={handleSaveSettings} className="academic-admin__form">
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

            <button type="submit" className="btn" disabled={savingSettings}>
              {savingSettings ? 'Guardando...' : 'Guardar configuración'}
            </button>
          </form>
        </section>

        <section className="card">
          <h2>{editingPeriodId ? 'Editar periodo' : 'Crear periodo'}</h2>
          <form onSubmit={handleCreatePeriod} className="academic-admin__form">
            {editingPeriodId ? null : activeSchoolYear ? (
              <p className="alert info">
                Este periodo se creará dentro del año escolar activo <strong>{activeSchoolYear.label}</strong>
                {' '}({activeSchoolYear.start_date} - {activeSchoolYear.end_date}).
              </p>
            ) : (
              <p className="alert warning">
                Debes activar un año escolar para poder crear periodos académicos.
              </p>
            )}

            <div className="academic-admin__grid-2">
              <div>
                <label htmlFor="period-year">Año</label>
                <input
                  id="period-year"
                  type="number"
                  value={periodForm.year}
                  min={!editingPeriodId && hasActiveSchoolYearRange ? activeSchoolYearStart : undefined}
                  max={!editingPeriodId && hasActiveSchoolYearRange ? activeSchoolYearEnd : undefined}
                  onChange={(event) => setPeriodForm((current) => ({ ...current, year: event.target.value }))}
                  required
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
                  required
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

            <button
              type="submit"
              className="btn"
              disabled={savingPeriod || (!editingPeriodId && !activeSchoolYear)}
            >
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
                          disabled={period.is_closed || savingPeriod}
                          onClick={() => handlePeriodCloseAction(period)}
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

      <section className="card">
        <h2>Años escolares configurados</h2>
        {schoolYears.length === 0 ? (
          <p>No hay años escolares registrados.</p>
        ) : (
          <div className="table-container">
            <table className="table mobile-card-view">
              <thead>
                <tr>
                  <th scope="col">Año escolar</th>
                  <th scope="col">Matrícula</th>
                  <th scope="col">Tipo evaluación</th>
                  <th scope="col">Estado</th>
                  <th scope="col">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {schoolYears.map((schoolYear) => (
                  <tr key={schoolYear.id}>
                    <td data-label="Año escolar">
                      <strong>{schoolYear.label}</strong><br />
                      {schoolYear.start_date} - {schoolYear.end_date}
                    </td>
                    <td data-label="Matrícula">
                      {schoolYear.enrollment_open_date}<br />{schoolYear.enrollment_close_date}
                    </td>
                    <td data-label="Tipo evaluación">{schoolYear.evaluation_type}</td>
                    <td data-label="Estado">
                      {schoolYear.is_active ? <span className="status-badge success">Activo</span> : 'Inactivo'}
                    </td>
                    <td data-label="Acciones">
                      <button
                        type="button"
                        className="btn secondary"
                        disabled={mutatingSchoolYearId === schoolYear.id || loadingSchoolYearImpactId === schoolYear.id}
                        onClick={() => handleSchoolYearStatusAction(schoolYear)}
                      >
                        {mutatingSchoolYearId === schoolYear.id
                          ? 'Actualizando...'
                          : loadingSchoolYearImpactId === schoolYear.id
                            ? 'Analizando impacto...'
                          : schoolYear.is_active
                            ? 'Desactivar'
                            : 'Activar'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {schoolYearConfirmDialog ? (
        <ConfirmDialog
          title={schoolYearConfirmDialog.title}
          message={schoolYearConfirmDialog.message}
          onConfirm={schoolYearConfirmDialog.onConfirm}
          onCancel={() => setSchoolYearConfirmDialog(null)}
        />
      ) : null}

      {periodCloseConfirmDialog ? (
        <ConfirmDialog
          title={periodCloseConfirmDialog.title}
          message={periodCloseConfirmDialog.message}
          onConfirm={periodCloseConfirmDialog.onConfirm}
          onCancel={() => setPeriodCloseConfirmDialog(null)}
        />
      ) : null}
    </div>
  )
}