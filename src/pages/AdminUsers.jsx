import { useEffect, useMemo, useState } from 'react'
import Alert from '../components/Alert'
import { useTenantUsers } from '../hooks/useTenantUsers'

const ROLE_LABELS = {
  ADMIN: 'Administrador',
  TEACHER: 'Docente',
  TUTOR: 'Acudiente',
  STUDENT: 'Estudiante',
}

const DEFAULT_USER_FILTERS = {
  search: '',
  role: 'ALL',
  status: 'all',
}

export default function AdminUsers() {
  const [filters, setFilters] = useState(DEFAULT_USER_FILTERS)
  const {
    users,
    loading,
    creating,
    mutatingUserId,
    error,
    success,
    form,
    activeUsersCount,
    setForm,
    loadUsers,
    createUser,
    toggleUserStatus,
    removeUser,
  } = useTenantUsers()

  const hasActiveFilters = useMemo(
    () => (
      Boolean(filters.search.trim())
      || filters.role !== 'ALL'
      || filters.status !== 'all'
    ),
    [filters]
  )

  useEffect(() => {
    loadUsers(filters)
  }, [filters, loadUsers])

  function handleFilterChange(key) {
    return (event) => {
      const { value } = event.target
      setFilters((current) => ({ ...current, [key]: value }))
    }
  }

  function handleResetFilters() {
    setFilters({ ...DEFAULT_USER_FILTERS })
  }

  async function handleCreate(event) {
    event.preventDefault()
    const wasCreated = await createUser()
    if (wasCreated && hasActiveFilters) {
      await loadUsers(filters)
    }
  }

  async function handleToggleStatus(user) {
    const wasUpdated = await toggleUserStatus(user)
    if (wasUpdated && hasActiveFilters) {
      await loadUsers(filters)
    }
  }

  async function handleDelete(user) {
    const accepted = window.confirm(`¿Eliminar definitivamente a ${user.email}?`)
    if (!accepted) return

    const wasDeleted = await removeUser(user)
    if (wasDeleted && hasActiveFilters) {
      await loadUsers(filters)
    }
  }

  return (
    <div className="admin-users">
      <Alert type="error" message={error} />
      <Alert type="success" message={success} />

      <section className="card admin-users__hero">
        <p className="eyebrow">Administración de usuarios</p>
        <h1>Usuarios del colegio</h1>
        <p>
          Crea y administra cuentas de docentes, acudientes y estudiantes dentro de tu institución.
        </p>
        <p className="admin-users__count">Activos visibles: {activeUsersCount} de {users.length}</p>
      </section>

      <section className="card">
        <h2>Crear usuario</h2>
        <form className="admin-users__form" onSubmit={handleCreate}>
          <div className="admin-users__grid">
            <div>
              <label htmlFor="user-role">Rol</label>
              <select
                id="user-role"
                value={form.role}
                onChange={(event) => setForm((current) => ({ ...current, role: event.target.value }))}
              >
                <option value="TEACHER">Docente</option>
                <option value="TUTOR">Acudiente</option>
                <option value="STUDENT">Estudiante</option>
              </select>
            </div>
            <div>
              <label htmlFor="user-email">Correo</label>
              <input
                id="user-email"
                type="email"
                value={form.email}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                placeholder="usuario@colegio.edu"
                required
              />
            </div>
            <div>
              <label htmlFor="user-first-name">Nombre</label>
              <input
                id="user-first-name"
                value={form.first_name}
                onChange={(event) => setForm((current) => ({ ...current, first_name: event.target.value }))}
                placeholder="Nombre"
              />
            </div>
            <div>
              <label htmlFor="user-last-name">Apellido</label>
              <input
                id="user-last-name"
                value={form.last_name}
                onChange={(event) => setForm((current) => ({ ...current, last_name: event.target.value }))}
                placeholder="Apellido"
              />
            </div>
            <div>
              <label htmlFor="user-password">Contraseña temporal</label>
              <input
                id="user-password"
                type="password"
                value={form.password}
                onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                placeholder="Mínimo 8 caracteres"
                required
              />
            </div>
          </div>

          <button className="btn" type="submit" disabled={creating}>
            {creating ? 'Creando...' : 'Crear usuario'}
          </button>
        </form>
      </section>

      <section className="card">
        <div className="admin-users__list-header">
          <div>
            <h2>Listado de usuarios</h2>
            <p className="admin-users__list-subtitle">
              Usa filtros por nombre, correo, rol o estado para encontrar cuentas rápidamente.
            </p>
          </div>

          <div className="admin-users__filters" aria-label="Filtros de usuarios">
            <div className="admin-users__filter-field">
              <label htmlFor="users-search-filter">Buscar usuario</label>
              <input
                id="users-search-filter"
                type="search"
                value={filters.search}
                onChange={handleFilterChange('search')}
                placeholder="Nombre, apellido o correo"
              />
            </div>

            <div className="admin-users__filter-field">
              <label htmlFor="users-role-filter">Filtrar por rol</label>
              <select
                id="users-role-filter"
                value={filters.role}
                onChange={handleFilterChange('role')}
              >
                <option value="ALL">Todos</option>
                <option value="TEACHER">Docentes</option>
                <option value="TUTOR">Acudientes</option>
                <option value="STUDENT">Estudiantes</option>
              </select>
            </div>

            <div className="admin-users__filter-field">
              <label htmlFor="users-status-filter">Filtrar por estado</label>
              <select
                id="users-status-filter"
                value={filters.status}
                onChange={handleFilterChange('status')}
              >
                <option value="all">Todos</option>
                <option value="active">Habilitados</option>
                <option value="inactive">Inhabilitados</option>
              </select>
            </div>

            <div className="admin-users__filter-field admin-users__filter-actions">
              <button
                className="btn secondary"
                type="button"
                onClick={handleResetFilters}
                disabled={!hasActiveFilters || loading}
              >
                Limpiar filtros
              </button>
            </div>
          </div>
        </div>

        <div className="table-container">
          <table className="table mobile-card-view">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Correo</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td data-label="Estado" colSpan="5">Cargando usuarios del colegio...</td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td data-label="Estado" colSpan="5">
                    {hasActiveFilters
                      ? 'No hay usuarios que coincidan con los filtros actuales.'
                      : 'No hay usuarios registrados en esta institución.'}
                  </td>
                </tr>
              ) : users.map((user) => {
                const isMutating = mutatingUserId === user.id
                return (
                  <tr key={user.id}>
                    <td data-label="Nombre">{user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || '-'}</td>
                    <td data-label="Correo">{user.email}</td>
                    <td data-label="Rol">{ROLE_LABELS[user.role] || user.role}</td>
                    <td data-label="Estado">{user.is_active ? 'Habilitado' : 'Inhabilitado'}</td>
                    <td data-label="Acciones">
                      <div className="admin-users__actions">
                        <button
                          className={`btn ${user.is_active ? 'warning' : 'success'}`}
                          type="button"
                          onClick={() => handleToggleStatus(user)}
                          disabled={isMutating}
                        >
                          {isMutating ? 'Procesando...' : user.is_active ? 'Inhabilitar' : 'Habilitar'}
                        </button>
                        <button
                          className="btn danger"
                          type="button"
                          onClick={() => handleDelete(user)}
                          disabled={isMutating}
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
