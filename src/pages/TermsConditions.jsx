import { Link } from 'react-router-dom'
import {
  LEGAL_CONSENT_VERSION,
  LEGAL_EFFECTIVE_DATE,
  LEGAL_LINKS,
} from '../constants/legalLinks'
import { LEGAL_CONTACT_EMAIL, LEGAL_SECURITY_PROVIDER } from '../constants/legalContact'

export default function TermsConditions() {
  return (
    <article className="legal-page">
      <header className="legal-page__header">
        <p className="legal-page__eyebrow">Legal</p>
        <h1>Terminos y Condiciones</h1>
        <p>
          Estos terminos regulan el uso de AulaAlDia por parte de instituciones y
          usuarios autorizados en sus respectivos roles.
        </p>
        <p className="legal-page__meta">
          Version: {LEGAL_CONSENT_VERSION} · Vigente desde: {LEGAL_EFFECTIVE_DATE}
        </p>
      </header>

      <section className="legal-page__section">
        <h2>1. Objeto del servicio</h2>
        <p>
          AulaAlDia provee herramientas para gestion academica, evaluacion, seguimiento
          y comunicacion institucional dentro de un entorno multi-tenant.
        </p>
      </section>

      <section className="legal-page__section">
        <h2>2. Registro y acceso</h2>
        <ul>
          <li>El usuario debe entregar datos veraces y mantener su informacion actualizada.</li>
          <li>El acceso de docentes y acudientes puede requerir invitacion institucional.</li>
          <li>El usuario es responsable del uso de sus credenciales y de su sesion.</li>
        </ul>
      </section>

      <section className="legal-page__section">
        <h2>3. Uso permitido</h2>
        <ul>
          <li>No se permite manipular datos de terceros sin autorizacion.</li>
          <li>No se permite explotar fallos, automatizaciones abusivas o uso fraudulento.</li>
          <li>La institucion administradora define los permisos operativos por rol.</li>
        </ul>
      </section>

      <section className="legal-page__section">
        <h2>4. Disponibilidad y cambios</h2>
        <p>
          Podemos ajustar funcionalidades, limites operativos y componentes de seguridad
          para mejorar el servicio y cumplir obligaciones regulatorias. Cambios legales
          relevantes se publicaran en estas paginas.
        </p>
      </section>

      <section className="legal-page__section">
        <h2>5. Soporte y reclamaciones</h2>
        <p>
          Para soporte tecnico, reclamos o solicitudes legales usa el canal de{' '}
          <Link to="/pqrs">PQRS</Link>, el formulario de <Link to="/contact">contacto</Link>{' '}
          o escribe a <a href={`mailto:${LEGAL_CONTACT_EMAIL}`}>{LEGAL_CONTACT_EMAIL}</a>.
        </p>
      </section>

      <section className="legal-page__section">
        <h2>6. Verificacion de seguridad</h2>
        <p>
          Los formularios publicos pueden apoyarse en <strong>{LEGAL_SECURITY_PROVIDER}</strong>
          para reducir spam y automatizacion abusiva.
        </p>
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
