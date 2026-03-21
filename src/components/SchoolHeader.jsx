import React from 'react'
import { useAuth } from '../state/AuthContext'

export default function SchoolHeader() {
  const auth = useAuth()

  if (!auth || !auth.activeTenantBranding) return null

  const { displayName, sidebarLogoUrl } = auth.activeTenantBranding

  return (
    <div className="school-header-banner">
      {sidebarLogoUrl && (
        <img
          src={sidebarLogoUrl}
          alt={`Escudo de ${displayName}`}
          className="school-header-logo"
        />
      )}
      <h1 className="school-header-title">{displayName}</h1>
    </div>
  )
}
