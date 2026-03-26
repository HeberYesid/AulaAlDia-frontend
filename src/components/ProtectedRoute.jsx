import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../state/AuthContext'

export default function ProtectedRoute({ children, roles, allowedRoles, requireTenant = false }) {
  const {
    user,
    activeTenantId = null,
    tenants = [],
    tenantsLoaded = true,
  } = useAuth()
  const location = useLocation()
  const requiredRoles = Array.isArray(roles)
    ? roles
    : Array.isArray(allowedRoles)
      ? allowedRoles
      : null

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }
  if (requiredRoles && !requiredRoles.includes(user.role)) {
    return <Navigate to="/" replace />
  }

  if (requireTenant && user.role !== 'STUDENT') {
    if (!tenantsLoaded) {
      return (
        <div className="loading" role="status" aria-label="Validando institución activa...">
          <div className="spinner" aria-hidden="true"></div>
          <span aria-hidden="true">Validando institución activa...</span>
        </div>
      )
    }

    const hasTenantCatalog = Array.isArray(tenants) && tenants.length > 0
    const hasActiveTenant = Boolean(activeTenantId)
    const hasAuthorizedTenant = hasTenantCatalog
      ? tenants.some((tenant) => tenant.tenant_id === activeTenantId)
      : false

    if (hasTenantCatalog && !hasActiveTenant) {
      return <Navigate to="/" replace state={{ tenantRequired: true }} />
    }

    if (hasTenantCatalog && hasActiveTenant && !hasAuthorizedTenant) {
      return <Navigate to="/" replace state={{ tenantDenied: true }} />
    }
  }

  return children
}
