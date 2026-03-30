import { Link } from 'react-router-dom'
import {
  LEGAL_CONSENT_VERSION,
  LEGAL_EFFECTIVE_DATE,
  LEGAL_LINKS,
} from '../constants/legalLinks'

export default function Pqrs() {
  return (
    <article className="legal-page">
      <header className="legal-page__header">
        <p className="legal-page__eyebrow">Atencion al Usuario</p>
        <h1>Canal PQRS</h1>
        <p>
          Recibimos peticiones, quejas, reclamos y sugerencias relacionadas con el uso
          de AulaAlDia, tratamiento de datos personales y operacion del servicio.
        </p>
        <p className="legal-page__meta">
          Version legal de referencia: {LEGAL_CONSENT_VERSION} · Vigente desde:{' '}
          {LEGAL_EFFECTIVE_DATE}
        </p>
      </header>

      <section className="legal-page__section">
        <h2>1. Como radicar una PQRS</h2>
        <ol>
          <li>
            Usa el formulario de <Link to="/contact">contacto</Link> y selecciona el
            asunto correspondiente.
           </li>
          <li>
            Describe de forma clara los hechos, fechas y datos de contacto para
            respuesta.
          </li>
          <li>
            Si aplica a datos personales, indica expresamente que se trata de una
            solicitud de habeas data.
          </li>
        </ol>
      </section>

      <section className="legal-page__section">
        <h2>2. Tiempos de atencion</h2>
        <p>
          Confirmamos recepcion y gestionamos cada caso segun su naturaleza. Para
          requerimientos complejos, se podra solicitar informacion adicional y ampliar
          tiempos dentro de los margenes legales aplicables.
        </p>
      </section>

      <section className="legal-page__section">
        <h2>3. Canales habilitados</h2>
        <ul>
          <li>Formulario web: <Link to="/contact">/contact</Link></li>
          <li>Correo de soporte: support@aulaaldia.com</li>
          <li>Politica de privacidad: <Link to="/privacy">/privacy</Link></li>
        </ul>
      </section>

      <footer className="legal-page__footer">
        {LEGAL_LINKS.map((link) => (
          <Link key={link.to} to={link.to} className="legal-page__footer-link">
            {link.label}
          </Link>
        ))}
      </footer>
    </article>
  )
}
