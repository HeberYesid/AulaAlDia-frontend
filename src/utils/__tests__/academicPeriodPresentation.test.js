import { describe, expect, it } from 'vitest'
import { getAcademicPeriodStatusLabel, sanitizeAcademicPeriodLabel } from '../academicPeriodPresentation'

describe('academicPeriodPresentation utils', () => {
  it('maps closed periods to inactivo', () => {
    expect(getAcademicPeriodStatusLabel({ is_closed: true })).toBe('Inactivo')
  })

  it('maps non-closed periods to activo', () => {
    expect(getAcademicPeriodStatusLabel({ is_closed: false, is_grade_locked: true })).toBe('Activo')
  })

  it('removes legacy "(Cerrado)" suffix from labels', () => {
    expect(sanitizeAcademicPeriodLabel('2026 - Trimestre 2 (Cerrado)')).toBe('2026 - Trimestre 2')
  })

  it('removes legacy "(Abierto)" suffix from labels', () => {
    expect(sanitizeAcademicPeriodLabel('2026 - Trimestre 2 (Abierto)')).toBe('2026 - Trimestre 2')
  })

  it('preserves labels without legacy suffix', () => {
    expect(sanitizeAcademicPeriodLabel('2026 - Trimestre 2')).toBe('2026 - Trimestre 2')
  })
})
