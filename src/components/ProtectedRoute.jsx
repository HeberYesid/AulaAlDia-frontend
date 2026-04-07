import { Link, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../state/AuthContext'

export default function ProtectedRoute({
  children,
  roles,
  allowedRoles,
  requireTenant = false,
  requireActiveSchoolYear = false,
  activeSchoolYearExemptRoles = [],
}) {
  const {
    user,
    activeTenantId = null,
    tenants = [],
    tenantsLoaded = true,
    hasActiveSchoolYear = null,
    activeSchoolYear = null,
    schoolYearGateLoaded = true,
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

  if (requireActiveSchoolYear) {
    const exemptByRole = Array.isArray(activeSchoolYearExemptRoles)
      ? activeSchoolYearExemptRoles.includes(user.role)
      : false

    if (!exemptByRole) {
      if (!schoolYearGateLoaded) {
        return (
          <div className="loading" role="status" aria-label="Validando año escolar activo...">
            <div className="spinner" aria-hidden="true"></div>
            <span aria-hidden="true">Validando año escolar activo...</span>
          </div>
        )
      }

      if (hasActiveSchoolYear === false) {
        return (
          <section className="card empty-state" aria-live="polite">
            <h3 className="empty-state__title">Año escolar activo requerido</h3>
            <p className="empty-state__text">
              Esta sección solo está disponible cuando la institución tiene un año escolar activo.
            </p>
            {user.role === 'ADMIN' ? (
              <Link to="/admin/academic-settings" className="btn empty-state__action">
                Ir a Configuración Académica
              </Link>
            ) : (
              <p className="empty-state__text">
                Solicita a un administrador que active el año escolar para continuar.
              </p>
            )}
            {activeSchoolYear ? (
              <p className="empty-state__text">
                Año activo detectado: {activeSchoolYear.label}
              </p>
            ) : null}
          </section>
        )
      }
    }
  }

  return children
}
