import { Link } from 'react-router-dom'
import {
  LEGAL_CONSENT_VERSION,
  LEGAL_EFFECTIVE_DATE,
  LEGAL_LINKS,
} from '../constants/legalLinks'
import {
  LEGAL_CONTACT_EMAIL,
  LEGAL_DATA_RIGHTS_SUBJECT,
  LEGAL_SECURITY_PROVIDER,
} from '../constants/legalContact'

export default function LegalNotice() {
  return (
    <article className="legal-page">
      <header className="legal-page__header">
        <p className="legal-page__eyebrow">Legal</p>
        <h1>Politica de Privacidad</h1>
        <p>
          Esta politica describe como AulaAlDia recolecta, usa y protege los datos
          personales de estudiantes, acudientes, docentes y administradores.
        </p>
        <p className="legal-page__meta">
          Version: {LEGAL_CONSENT_VERSION} · Vigente desde: {LEGAL_EFFECTIVE_DATE}
        </p>
      </header>

      <section className="legal-page__section">
        <h2>1. Responsable del tratamiento</h2>
        <p>
          AulaAlDia actua como responsable del tratamiento para la operacion de la
          plataforma y la atencion de solicitudes asociadas al servicio.
        </p>
      </section>

      <section className="legal-page__section">
        <h2>2. Datos que recolectamos</h2>
        <ul>
          <li>Datos de identificacion y contacto: nombre, correo, rol institucional.</li>
          <li>Datos academicos operativos: asignaturas, resultados, observaciones e inasistencias.</li>
          <li>Datos tecnicos de seguridad: IP, user-agent y trazas de autenticacion.</li>
        </ul>
      </section>

      <section className="legal-page__section">
        <h2>3. Finalidades</h2>
        <ul>
          <li>Prestar el servicio de seguimiento academico y gestion institucional.</li>
          <li>Controlar acceso, prevenir fraude y reforzar la seguridad de la cuenta.</li>
          <li>Atender requerimientos de soporte, PQRS y obligaciones legales aplicables.</li>
        </ul>
      </section>

      <section className="legal-page__section">
        <h2>4. Derechos del titular</h2>
        <p>
          Puedes ejercer tus derechos de conocer, actualizar, rectificar, suprimir y
          revocar autorizacion mediante el canal de <Link to="/pqrs">PQRS</Link> o
          el formulario de <Link to="/contact">contacto</Link>.
        </p>
      </section>

      <section className="legal-page__section">
        <h2>5. Conservacion y seguridad</h2>
        <p>
          Conservamos datos durante la vigencia de la relacion de servicio y segun los
          periodos requeridos por ley. Aplicamos controles de acceso, autenticacion y
          segregacion por institucion para proteger la informacion.
        </p>
      </section>

      <section className="legal-page__section">
        <h2>6. Verificacion de seguridad y terceros</h2>
        <p>
          Los formularios publicos usan <strong>{LEGAL_SECURITY_PROVIDER}</strong> para
          reducir spam, abuso y suplantacion. Ese servicio puede recibir datos tecnicos
          del navegador e IP solo con fines de seguridad.
        </p>
      </section>

      <section className="legal-page__section">
        <h2>7. Canales de atencion</h2>
        <p>
          Para ejercer derechos de titular, presentar reclamos o revocar autorizacion
          usa <Link to="/pqrs">PQRS</Link> o escribe a{' '}
          <a href={`mailto:${LEGAL_CONTACT_EMAIL}`}>{LEGAL_CONTACT_EMAIL}</a>. Si tu
          solicitud es de datos personales, selecciona el asunto{' '}
          <strong> {LEGAL_DATA_RIGHTS_SUBJECT.label}</strong> en el formulario de
          contacto.
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