import { useEffect } from 'react'
import Alert from '../components/Alert'
import { useTenantUsers } from '../hooks/useTenantUsers'

const ROLE_LABELS = {
  ADMIN: 'Administrador',
  TEACHER: 'Docente',
  TUTOR: 'Acudiente',
  STUDENT: 'Estudiante',
}

export default function AdminUsers() {
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

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  async function handleCreate(event) {
    event.preventDefault()
    await createUser()
  }

  async function handleDelete(user) {
    const accepted = window.confirm(`¿Eliminar definitivamente a ${user.email}?`)
    if (!accepted) return

    await removeUser(user)
  }

  if (loading) {
    return <div className="card"><p>Cargando usuarios del colegio...</p></div>
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
        <p className="admin-users__count">Activos: {activeUsersCount} de {users.length}</p>
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
        <h2>Listado de usuarios</h2>
        <div className="table-container">
          <table className="table">
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
              {users.length === 0 ? (
                <tr>
                  <td colSpan="5">No hay usuarios registrados en esta institución.</td>
                </tr>
              ) : users.map((user) => {
                const isMutating = mutatingUserId === user.id
                return (
                  <tr key={user.id}>
                    <td>{user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || '-'}</td>
                    <td>{user.email}</td>
                    <td>{ROLE_LABELS[user.role] || user.role}</td>
                    <td>{user.is_active ? 'Habilitado' : 'Inhabilitado'}</td>
                    <td>
                      <div className="admin-users__actions">
                        <button
                          className={`btn ${user.is_active ? 'warning' : 'success'}`}
                          type="button"
                          onClick={() => toggleUserStatus(user)}
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
