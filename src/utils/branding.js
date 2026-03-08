export function getBrandInitials(brandName) {
  const safeName = (brandName || '').trim()
  if (!safeName) return 'AA'

  const parts = safeName.split(/\s+/).filter(Boolean)
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase()
  }

  return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
}
