export function getTourStartPath(role) {
  return role === 'ADMIN' ? '/admin/dashboard' : '/'
}
