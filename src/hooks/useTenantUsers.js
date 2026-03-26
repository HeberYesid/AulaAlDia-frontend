import { useCallback, useMemo, useState } from 'react'
import {
  listTenantUsers,
  createTenantUser,
  updateTenantUserStatus,
  deleteTenantUser,
} from '../api/users'

const DEFAULT_FORM = {
  email: '',
  first_name: '',
  last_name: '',
  password: '',
  role: 'TEACHER',
}

function normalizeApiError(error, fallbackMessage) {
  const detail = error?.response?.data?.detail
  if (typeof detail === 'string' && detail.trim()) return detail

  const data = error?.response?.data || {}
  const firstEntry = Object.values(data)[0]
  if (Array.isArray(firstEntry) && firstEntry[0]) return firstEntry[0]
  if (typeof firstEntry === 'string' && firstEntry.trim()) return firstEntry

  return fallbackMessage
}

export function useTenantUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [mutatingUserId, setMutatingUserId] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [form, setForm] = useState(DEFAULT_FORM)

  const activeUsersCount = useMemo(
    () => users.filter((user) => Boolean(user.is_active)).length,
    [users]
  )

  const loadUsers = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const nextUsers = await listTenantUsers()
      setUsers(nextUsers)
    } catch (err) {
      setError(normalizeApiError(err, 'No se pudo cargar el listado de usuarios.'))
      setUsers([])
    } finally {
      setLoading(false)
    }
  }, [])

  const createUser = useCallback(async () => {
    setCreating(true)
    setError('')
    setSuccess('')
    try {
      const payload = {
        ...form,
        email: form.email.trim(),
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
      }
      const createdUser = await createTenantUser(payload)
      setUsers((current) => [createdUser, ...current])
      setForm(DEFAULT_FORM)
      setSuccess('Usuario creado correctamente. Revisa su correo para verificar la cuenta.')
      return true
    } catch (err) {
      setError(normalizeApiError(err, 'No se pudo crear el usuario.'))
      return false
    } finally {
      setCreating(false)
    }
  }, [form])

  const toggleUserStatus = useCallback(async (user) => {
    if (!user?.id) return

    const nextIsActive = !Boolean(user.is_active)
    const successMessage = nextIsActive
      ? 'Usuario habilitado correctamente.'
      : 'Usuario inhabilitado correctamente.'

    setMutatingUserId(user.id)
    setError('')
    setSuccess('')

    try {
      const updated = await updateTenantUserStatus(user.id, nextIsActive)
      setUsers((current) =>
        current.map((item) => (item.id === updated.id ? updated : item))
      )
      setSuccess(successMessage)
    } catch (err) {
      setError(normalizeApiError(err, 'No se pudo actualizar el estado del usuario.'))
    } finally {
      setMutatingUserId(null)
    }
  }, [])

  const removeUser = useCallback(async (user) => {
    if (!user?.id) return false

    setMutatingUserId(user.id)
    setError('')
    setSuccess('')

    try {
      await deleteTenantUser(user.id)
      setUsers((current) => current.filter((item) => item.id !== user.id))
      setSuccess('Usuario eliminado correctamente.')
      return true
    } catch (err) {
      setError(normalizeApiError(err, 'No se pudo eliminar el usuario.'))
      return false
    } finally {
      setMutatingUserId(null)
    }
  }, [])

  return {
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
  }
}
