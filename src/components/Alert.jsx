import React from 'react'

export default function Alert({ type = 'success', message }) {
  if (!message) return null

  return (
    <div 
      className={`alert ${type}`} 
      role={type === 'error' ? 'alert' : 'status'}
      aria-live={type === 'error' ? 'assertive' : 'polite'}
    >
      {message}
    </div>
  )
}
