import { Link } from 'react-router-dom'
import { LEGAL_CONSENT_VERSION } from '../constants/legalLinks'

export default function LegalConsentField({
  id,
  checked,
  onChange,
  disabled = false,
  contextLabel,
}) {
  return (
    <div className="legal-consent">
      <label htmlFor={id} className="legal-consent__label">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          disabled={disabled}
        />
        <span>{contextLabel}</span>
      </label>
      <p className="legal-consent__help">
        Consulta la <Link to="/privacy">Politica de Privacidad</Link>, los{' '}
        <Link to="/terms">Terminos y Condiciones</Link>, la{' '}
        <Link to="/habeas-data">Politica de Habeas Data</Link> y el{' '}
        <Link to="/pqrs">canal PQRS</Link>. Version legal vigente: {LEGAL_CONSENT_VERSION}.
      </p>
    </div>
  )
}
