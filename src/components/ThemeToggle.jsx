/**
 * 🌓 BOTÓN DE CAMBIO DE TEMA
 * 
 * Componente interactivo que permite alternar entre modo oscuro y claro.
 * Incluye iconos animados y feedback visual para mejorar la UX.
 * 
 * Características:
 * - Iconos dinámicos: 🌙 (modo oscuro) ↔ ☀️ (modo claro)
 * - Animación de rotación en hover
 * - Accesibilidad completa con aria-labels
 * - Estilos adaptativos según el tema actual
 * 
 * @author AulaAlDía Team
 * @version 1.0.0
 */

import { useTheme } from '../state/ThemeContext'

/**
 * 🎛️ Componente ThemeToggle
 * 
 * Renderiza un botón que permite cambiar entre tema oscuro y claro.
 * El botón muestra el icono del tema contrario al actual.
 * 
 * @returns {JSX.Element} Botón de cambio de tema
 */
export default function ThemeToggle() {
  // 🪝 Obtener estado y funciones del contexto de tema
  const { theme, toggleTheme, isDark } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      className="theme-toggle"
      title={`Cambiar a modo ${isDark ? 'claro' : 'oscuro'}`}
      aria-label={`Cambiar a modo ${isDark ? 'claro' : 'oscuro'}`}
    >
      {/* 🎭 Icono del tema - muestra el tema contrario al actual */}
      <span className="theme-icon">
        {isDark ? '☀️' : '🌙'}
      </span>
      
      {/* 📝 Texto descriptivo del botón */}
      <span className="theme-text">
        {isDark ? '' : ''}
      </span>
    </button>
  )
}
