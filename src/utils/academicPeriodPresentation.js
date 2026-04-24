export function sanitizeAcademicPeriodLabel(label) {
  const value = String(label || '').trim()
  if (!value) return '-'

  const withoutLegacyStatusSuffix = value
    .replace(/\s*\(\s*cerrado\s*\)\s*$/iu, '')
    .replace(/\s*\(\s*abierto\s*\)\s*$/iu, '')
    .trim()

  return withoutLegacyStatusSuffix || value
}

export function getAcademicPeriodStatusLabel(period) {
  if (!period) return 'Inactivo'
  return period.is_closed ? 'Inactivo' : 'Activo'
}
