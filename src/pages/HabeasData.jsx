import { Link } from 'react-router-dom'
import {
  LEGAL_CONSENT_VERSION,
  LEGAL_EFFECTIVE_DATE,
  LEGAL_LINKS,
} from '../constants/legalLinks'
import {
  LEGAL_CONTACT_EMAIL,
  LEGAL_DATA_RIGHTS_SUBJECT,
} from '../constants/legalContact'

export default function HabeasData() {
  return (
    <article className="legal-page">
      <header className="legal-page__header">
        <p className="legal-page__eyebrow">Legal</p>
        <h1>Politica de Habeas Data</h1>
        <p>
          Esta politica desarrolla el tratamiento de datos personales conforme al marco
          aplicable en Colombia, incluyendo Ley 1581 de 2012 y Decreto 1074 de 2015.
        </p>
        <p className="legal-page__meta">
          Version: {LEGAL_CONSENT_VERSION} · Vigente desde: {LEGAL_EFFECTIVE_DATE}
        </p>
      </header>

      <section className="legal-page__section">
        <h2>1. Principios aplicables</h2>
        <ul>
          <li>Legalidad, finalidad, libertad, veracidad, transparencia y seguridad.</li>
          <li>Acceso restringido por rol y por institucion.</li>
          <li>Tratamiento limitado a finalidades academicas y de soporte.</li>
        </ul>
      </section>

      <section className="legal-page__section">
        <h2>2. Derechos del titular</h2>
        <ul>
          <li>Conocer, actualizar y rectificar datos personales.</li>
          <li>Solicitar prueba de la autorizacion otorgada.</li>
          <li>Solicitar supresion o revocatoria cuando sea procedente.</li>
          <li>Presentar consultas y reclamos por los canales oficiales.</li>
        </ul>
      </section>

      <section className="legal-page__section">
        <h2>3. Procedimiento de consultas y reclamos</h2>
        <p>
          Las solicitudes de habeas data se gestionan por el canal de{' '}
          <Link to="/pqrs">PQRS</Link>. En cada caso se registra fecha de radicacion,
          estado y respuesta para trazabilidad.
        </p>
      </section>

      <section className="legal-page__section">
        <h2>4. Evidencia de consentimiento</h2>
        <p>
          Cuando se requiere autorizacion, el sistema conserva evidencia minima de
          version legal aceptada, fecha/hora, direccion IP y user-agent del evento.
        </p>
      </section>

      <section className="legal-page__section">
        <h2>5. Canales para ejercer tus derechos</h2>
        <ul>
          <li>
            Formulario de contacto: selecciona el asunto{' '}
            <strong>{LEGAL_DATA_RIGHTS_SUBJECT.label}</strong>
          </li>
          <li>
            Correo institucional:{' '}
            <a href={`mailto:${LEGAL_CONTACT_EMAIL}`}>{LEGAL_CONTACT_EMAIL}</a>
          </li>
          <li>
            Canal PQRS: <Link to="/pqrs">/pqrs</Link>
          </li>
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
