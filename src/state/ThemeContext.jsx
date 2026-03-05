/**
 * 🌓 SISTEMA DE TEMAS - AULAALDIA
 * 
 * Contexto de React para gestionar el tema de la aplicación (oscuro/claro)
 * Incluye persistencia en localStorage y aplicación automática al DOM
 * 
 * @author AulaAlDía Team
 * @version 1.0.0
 */

import { createContext, useContext, useState, useEffect } from 'react'

// 🎯 Contexto de tema - almacena el estado global del tema
const ThemeContext = createContext()

/**
 * 🪝 Hook personalizado para usar el contexto de tema
 * 
 * @returns {Object} Objeto con theme, toggleTheme, isDark, isLight
 * @throws {Error} Si se usa fuera del ThemeProvider
 */
export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

/**
 * 🎨 Proveedor del contexto de tema
 * 
 * Funcionalidades:
 * - Gestiona el estado del tema ('dark' | 'light')
 * - Persiste la preferencia en localStorage
 * - Aplica el tema al DOM automáticamente
 * - Proporciona funciones para cambiar tema
 * 
 * @param {Object} props - Props del componente
 * @param {ReactNode} props.children - Componentes hijos
 */
export function ThemeProvider({ children }) {
  // 🎭 Estado del tema - inicializa desde localStorage o 'dark' por defecto
  const [theme, setTheme] = useState(() => {
    // Obtener tema guardado del localStorage o usar 'dark' por defecto
    const savedTheme = localStorage.getItem('aulaaldia-theme')
    return savedTheme || 'dark'
  })

  /**
   * ⚡ Efecto para aplicar cambios de tema
   * - Aplica el atributo data-theme al HTML
   * - Guarda la preferencia en localStorage
   * - Agrega clase al body para compatibilidad
   */
  useEffect(() => {
    // Guardar tema en localStorage
    localStorage.setItem('aulaaldia-theme', theme)
    
    // Aplicar atributo data-theme al documento (usado por CSS)
    document.documentElement.setAttribute('data-theme', theme)
    
    // También agregar clase al body para compatibilidad adicional
    document.body.className = theme === 'dark' ? 'dark-theme' : 'light-theme'
  }, [theme])

  /**
   * 🔄 Función para alternar entre temas
   * Cambia de 'dark' a 'light' y viceversa
   */
  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'dark' ? 'light' : 'dark')
  }

  // 🎁 Valor del contexto que se proporciona a los componentes hijos
  const value = {
    theme,                        // 'dark' | 'light'
    toggleTheme,                  // Función para cambiar tema
    isDark: theme === 'dark',     // Boolean para verificar modo oscuro
    isLight: theme === 'light'    // Boolean para verificar modo claro
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}
