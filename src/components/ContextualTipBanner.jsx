import { useLocation } from 'react-router-dom'
import Alert from './Alert'
import { useAuth } from '../state/AuthContext'
import { getContextualTipByPath } from '../utils/navigation'

export default function ContextualTipBanner() {
  const { user } = useAuth()
  const location = useLocation()

  if (!user) return null

  const tip = getContextualTipByPath(user, location.pathname)
  if (!tip) return null

  return <Alert type="info" message={`💡 ${tip}`} />
}