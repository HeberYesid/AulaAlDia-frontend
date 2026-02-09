import React from 'react'

export default function Alert({ type = 'success', message, style }) {
  if (!message) return null

  return (
    <div 
      className={`alert ${type}`} 
      style={{ marginBottom: 'var(--space-lg)', ...style }}
    >
      {message}
    </div>
  )
}
