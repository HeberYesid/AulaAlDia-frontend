import React from 'react'
import { useAuth } from '../state/AuthContext'

export default function SchoolHeader() {
  const auth = useAuth()

  if (!auth || !auth.activeTenantBranding) return null

  const { displayName, sidebarLogoUrl } = auth.activeTenantBranding
  const hasLogo = Boolean(sidebarLogoUrl)

  return (
    <div className={`school-header-banner ${hasLogo ? '' : 'school-header-banner--no-logo'}`}>
      {hasLogo && (
        <img
          src={sidebarLogoUrl}
          alt={`Escudo de ${displayName}`}
          className="school-header-logo"
        />
      )}
      <div className="school-header-copy">
        <h1 className="school-header-title">{displayName}</h1>
      </div>
    </div>
  )
}
