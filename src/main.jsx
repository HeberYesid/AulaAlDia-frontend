import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { AuthProvider } from './state/AuthContext'
import { ThemeProvider } from './state/ThemeContext'
import { GoogleOAuthProvider } from '@react-oauth/google'
import './styles.css'

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim()

const app = (
  <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
    <ThemeProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ThemeProvider>
  </BrowserRouter>
)

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {googleClientId ? (
      <GoogleOAuthProvider clientId={googleClientId}>
        {app}
      </GoogleOAuthProvider>
    ) : (
      app
    )}
  </React.StrictMode>
)
