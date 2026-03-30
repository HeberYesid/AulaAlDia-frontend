import { Link } from 'react-router-dom'
import PublicNavBar from './PublicNavBar'
import { LEGAL_LINKS } from '../constants/legalLinks'

export default function PublicLayout({ children }) {
  return (
    <>
      <PublicNavBar />
      <div className="public-layout">
        <div className="public-layout__content">{children}</div>
        <footer className="public-legal-footer" aria-label="Enlaces legales">
          <p className="public-legal-footer__copy">
            AulaAlDia · Transparencia legal y proteccion de datos
          </p>
          <nav className="public-legal-footer__links" aria-label="Documentos legales">
            {LEGAL_LINKS.map((link) => (
              <Link key={link.to} to={link.to} className="public-legal-footer__link">
                {link.label}
              </Link>
            ))}
          </nav>
        </footer>
      </div>
    </>
  )
}
