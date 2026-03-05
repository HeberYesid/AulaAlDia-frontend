import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../state/AuthContext'

const PREVIEW_FAQS = [
  {
    q: '¿Qué es DevTrack?',
    a: 'DevTrack es un sistema integral de seguimiento académico que permite a profesores registrar evaluaciones y a estudiantes consultar su progreso en tiempo real. Las notas se registran en una escala numérica de 1.0 a 5.0 con cálculo automático del promedio.',
  },
  {
    q: '¿Cuánto cuesta DevTrack?',
    a: 'Ofrecemos planes desde $29/mes para instituciones pequeñas hasta planes empresariales a medida. Todos los planes incluyen soporte técnico y actualizaciones continuas. Solicita una demo gratuita y te asesoramos sin compromiso.',
  },
  {
    q: '¿Cuántos estudiantes puede gestionar?',
    a: 'DevTrack está diseñado para crecer con tu institución: desde 50 hasta más de 5 000 estudiantes. Sin límites artificiales ni sorpresas en la factura.',
  },
]

export default function Home() {
  const { isAuthenticated } = useAuth()
  const [openFaq, setOpenFaq] = useState(null)

  return (
    <div className="home-page landing-page">
      {/* ============================================================
          1. HERO
      ============================================================ */}
      <section className="landing-hero" id="hero" aria-label="Presentación">
        <div className="landing-hero__badge">
          <span>☁️ En la nube</span>
          <span className="landing-hero__sep" aria-hidden="true">·</span>
          <span>Fácil de usar</span>
          <span className="landing-hero__sep" aria-hidden="true">·</span>
          <span>Soporte incluido</span>
        </div>
        <h1 className="landing-hero__title">
          El seguimiento académico<br />
          <span className="landing-hero__title-accent">que sí funciona</span>
        </h1>
        <p className="landing-hero__subtitle">
          Gestiona asignaturas, evalúa estudiantes y visualiza el progreso en tiempo real
          con calificaciones numéricas del 1 al 5. Diseñado para instituciones educativas
          de cualquier tamaño.
        </p>
        <div className="landing-hero__scale" aria-label="Escala de evaluación numérica del 1 al 5">
          {[1, 2, 3, 4, 5].map((n) => (
            <span key={n} className={`score-pip score-pip--${n}`}>{n}</span>
          ))}
          <span className="landing-hero__traffic-label">Escala de calificación 1.0 – 5.0</span>
        </div>
        <div className="landing-hero__cta">
          {isAuthenticated ? (
            <Link to="/" className="btn btn-primary btn-lg">Ir al Dashboard →</Link>
          ) : (
            <>
              <Link to="/contact" className="btn btn-primary btn-lg">Solicitar demo gratuita</Link>
              <a href="#pricing" className="btn btn-outline btn-lg">Ver planes</a>
            </>
          )}
        </div>
      </section>

      {/* ============================================================
          2. STATS STRIP
      ============================================================ */}
      <section className="landing-stats" aria-label="Estadísticas del sistema">
        <div className="landing-stats__grid">
          <div className="landing-stats__item">
            <span className="landing-stats__number">4</span>
            <span className="landing-stats__label">Roles de usuario</span>
          </div>
          <div className="landing-stats__item">
            <span className="landing-stats__number">5 000+</span>
            <span className="landing-stats__label">Estudiantes por institución</span>
          </div>
          <div className="landing-stats__item">
            <span className="landing-stats__number">&lt; 2 min</span>
            <span className="landing-stats__label">Para registrar una evaluación</span>
          </div>
          <div className="landing-stats__item">
            <span className="landing-stats__number">99.5%</span>
            <span className="landing-stats__label">Disponibilidad garantizada</span>
          </div>
        </div>
      </section>

      {/* ============================================================
          3. FEATURES GRID
      ============================================================ */}
      <section className="features landing-features" id="features" aria-label="Características principales">
        <h2>Características principales</h2>
        <p className="landing-features__intro">
          Todo lo que necesitas para gestionar el rendimiento académico en un solo lugar.
        </p>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon" aria-hidden="true">📚</div>
            <h3>Gestión de Asignaturas</h3>
            <p>Crea y administra materias, agrega descripción, duración y ejercicios. Profesores gestionan solo sus propias materias.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon" aria-hidden="true">�</div>
            <h3>Calificación Numérica 1–5</h3>
            <p>Notas en escala del 1.0 al 5.0 por ejercicio. Promedio de la materia calculado automáticamente en tiempo real.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon" aria-hidden="true">📊</div>
            <h3>Seguimiento en Tiempo Real</h3>
            <p>Los estudiantes consultan sus resultados al instante. Los profesores ven el progreso agregado de toda la clase.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon" aria-hidden="true">📤</div>
            <h3>Carga masiva de datos</h3>
            <p>Importa cientos de estudiantes y calificaciones desde un archivo. El sistema lo procesa todo automáticamente, ahorrándote horas de trabajo.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon" aria-hidden="true">🔔</div>
            <h3>Notificaciones automáticas</h3>
            <p>Alertas de inscripciones, cambios de resultados y boletines. Centralizadas y configurables por usuario.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon" aria-hidden="true">🏢</div>
            <h3>Para múltiples instituciones</h3>
            <p>Cada colegio o universidad tiene su propio espacio seguro e independiente. Perfectamente aislado del resto.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon" aria-hidden="true">💬</div>
            <h3>Mensajería interna</h3>
            <p>Conversaciones directas entre estudiantes, profesores y administradores. Tutores con acceso de solo lectura.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon" aria-hidden="true">📅</div>
            <h3>Calendario y Asistencia</h3>
            <p>Gestiona eventos académicos, controla inasistencias y lleva el registro del observador estudiantil.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon" aria-hidden="true">🌙</div>
            <h3>Tema Oscuro / Claro</h3>
            <p>Interfaz adaptable con modo oscuro elegante y modo claro de alta legibilidad, optimizada para uso prolongado.</p>
          </div>
        </div>
      </section>

      {/* ============================================================
          4. CÓMO FUNCIONA
      ============================================================ */}
      <section className="landing-how" id="how-it-works" aria-label="Cómo funciona DevTrack">
        <h2>Cómo funciona</h2>
        <p className="landing-how__intro">Tres pasos para tener tu institución funcionando en DevTrack.</p>
        <div className="landing-how__steps">
          <div className="landing-how__step">
            <div className="landing-how__step-num" aria-hidden="true">1</div>
            <h3>Regístrate y crea tu institución</h3>
            <p>Crea tu cuenta, confirma tu correo electrónico y configura tu institución en minutos. Sin conocimientos técnicos necesarios.</p>
          </div>
          <div className="landing-how__connector" aria-hidden="true">→</div>
          <div className="landing-how__step">
            <div className="landing-how__step-num" aria-hidden="true">2</div>
            <h3>Crea materias e inscribe estudiantes</h3>
            <p>Define asignaturas, añade ejercicios e inscribe estudiantes de forma individual o masiva. Invita a tus profesores fácilmente.</p>
          </div>
          <div className="landing-how__connector" aria-hidden="true">→</div>
          <div className="landing-how__step">
            <div className="landing-how__step-num" aria-hidden="true">3</div>
            <h3>Evalúa y monitorea en tiempo real</h3>
            <p>Registra notas del 1.0 al 5.0 e importa calificaciones en segundos. El sistema calcula el promedio de cada estudiante en tiempo real.</p>
          </div>
        </div>
      </section>

      {/* ============================================================
          5. PARA QUIÉN ES
      ============================================================ */}
      <section className="landing-audience" id="audience" aria-label="Para quién es DevTrack">
        <h2>Diseñado para todos los actores educativos</h2>
        <div className="landing-audience__grid">
          <div className="landing-audience__card">
            <div className="landing-audience__role-icon" aria-hidden="true">🎓</div>
            <h3>Estudiantes</h3>
            <ul className="landing-audience__list">
              <li>Consulta tus calificaciones en tiempo real</li>
              <li>Consulta la nota de cada ejercicio (escala 1.0–5.0)</li>
              <li>Descarga boletines académicos</li>
              <li>Recibe notificaciones de cambios</li>
            </ul>
          </div>
          <div className="landing-audience__card landing-audience__card--highlight">
            <div className="landing-audience__role-icon" aria-hidden="true">👩‍🏫</div>
            <h3>Profesores</h3>
            <ul className="landing-audience__list">
              <li>Crea y gestiona tus asignaturas</li>
              <li>Registra evaluaciones individualmente o de forma masiva</li>
              <li>Ve estadísticas agregadas de tu clase</li>
              <li>Envía notificaciones a tus estudiantes</li>
            </ul>
          </div>
          <div className="landing-audience__card">
            <div className="landing-audience__role-icon" aria-hidden="true">🛡️</div>
            <h3>Administradores</h3>
            <ul className="landing-audience__list">
              <li>Gestión total de usuarios y roles</li>
              <li>Acceso a estadísticas globales</li>
              <li>Configuración de usuarios e instituciones</li>
              <li>Generación de códigos de invitación</li>
            </ul>
          </div>
          <div className="landing-audience__card">
            <div className="landing-audience__role-icon" aria-hidden="true">👁️</div>
            <h3>Tutores / Acudientes</h3>
            <ul className="landing-audience__list">
              <li>Acceso de solo lectura al progreso</li>
              <li>Visualiza resultados sin poder modificarlos</li>
              <li>Ideal para acompañamiento parental</li>
              <li>Sin acceso a mensajería (privacidad garantizada)</li>
            </ul>
          </div>
        </div>
      </section>

      {/* ============================================================
          6. VENTAJAS Y DESVENTAJAS
      ============================================================ */}
      <section className="landing-pros-cons" id="pros-cons" aria-label="Ventajas y limitaciones">
        <h2>Honestidad ante todo</h2>
        <p className="landing-pros-cons__intro">
          Somos transparentes sobre lo que DevTrack hace bien y en qué aspectos aún está evolucionando.
        </p>
        <div className="landing-pros-cons__grid">
          <div className="landing-pros-cons__col landing-pros-cons__col--pro">
            <h3 className="landing-pros-cons__heading">✅ Ventajas</h3>
            <ul className="landing-pros-cons__list">
              <li>Calificaciones del 1.0 al 5.0 con promedio calculado automáticamente</li>
              <li>Elimina errores humanos en el registro de notas</li>
              <li>Importación masiva de estudiantes y calificaciones</li>
              <li>Datos de cada institución seguros y completamente separados</li>
              <li>Roles diferenciados: Administrador, Profesor, Tutor y Estudiante</li>
              <li>Notificaciones automáticas ante cada cambio importante</li>
              <li>Funciona en computador, tableta y celular</li>
              <li>Actualizaciones automáticas incluidas en el plan</li>
              <li>Conecta con otros sistemas que ya usas</li>
              <li>Acceso seguro con verificación de identidad</li>
            </ul>
          </div>
          <div className="landing-pros-cons__col landing-pros-cons__col--con">
            <h3 className="landing-pros-cons__heading">⚠️ Limitaciones actuales</h3>
            <ul className="landing-pros-cons__list">
              <li>Exportación a PDF/Excel aún en desarrollo</li>
              <li>Sin app móvil nativa (solo web responsive)</li>
              <li>Integración con Google Classroom / Moodle no disponible</li>
              <li>Sin videoconferencia integrada</li>
              <li>Reportes visuales avanzados (gráficas) en desarrollo</li>
              <li>Sin contrato a largo plazo (pago mensual flexible)</li>
            </ul>
          </div>
        </div>
      </section>

      {/* ============================================================
          7. PLANES
      ============================================================ */}
      <section className="landing-pricing" id="pricing" aria-label="Planes y precios">
        <h2>Planes</h2>
        <p className="landing-pricing__intro">Elige el plan que mejor se adapte a tu institución.</p>
        <div className="landing-pricing__grid">
          <div className="landing-pricing__card">
            <div className="landing-pricing__badge">Para empezar</div>
            <h3 className="landing-pricing__plan">Básico</h3>
            <div className="landing-pricing__price">
              <span className="landing-pricing__amount">$29</span>
              <span className="landing-pricing__period">/ mes</span>
            </div>
            <ul className="landing-pricing__features">
              <li>✓ Hasta 200 estudiantes</li>
              <li>✓ Asignaturas ilimitadas</li>
              <li>✓ Notificaciones automáticas</li>
              <li>✓ Soporte por correo electrónico</li>
              <li>✓ Actualizaciones incluidas</li>
            </ul>
            <Link to="/contact" className="btn btn-outline landing-pricing__cta">
              Comenzar ahora
            </Link>
          </div>
          <div className="landing-pricing__card landing-pricing__card--featured">
            <div className="landing-pricing__badge landing-pricing__badge--featured">Más popular</div>
            <h3 className="landing-pricing__plan">Profesional</h3>
            <div className="landing-pricing__price">
              <span className="landing-pricing__amount">$79</span>
              <span className="landing-pricing__period">/ mes</span>
            </div>
            <ul className="landing-pricing__features">
              <li>✓ Hasta 1 000 estudiantes</li>
              <li>✓ Todo del plan Básico</li>
              <li>✓ Mensajería interna</li>
              <li>✓ Importación masiva de datos</li>
              <li>✓ Soporte prioritario</li>
            </ul>
            <Link to="/contact" className="btn btn-primary landing-pricing__cta">
              Solicitar demo
            </Link>
          </div>
          <div className="landing-pricing__card">
            <div className="landing-pricing__badge">Para grandes redes</div>
            <h3 className="landing-pricing__plan">Empresarial</h3>
            <div className="landing-pricing__price">
              <span className="landing-pricing__amount">A medida</span>
            </div>
            <ul className="landing-pricing__features">
              <li>✓ Estudiantes ilimitados</li>
              <li>✓ Todo del plan Profesional</li>
              <li>✓ Varias sedes e instituciones</li>
              <li>✓ Soporte dedicado 24/7</li>
              <li>✓ Incorporación personalizada</li>
            </ul>
            <Link to="/contact" className="btn btn-outline landing-pricing__cta">
              Contactar ventas
            </Link>
          </div>
        </div>
      </section>

      {/* ============================================================
          8. SCREENSHOTS / DEMO
      ============================================================ */}
      <section className="landing-screenshots" id="demo" aria-label="Vista previa del sistema">
        <h2>Vista previa del sistema</h2>
        <p className="landing-screenshots__intro">
          Una interfaz limpia diseñada para que profesores y estudiantes se concentren en lo que importa.
        </p>
        <div className="landing-screenshots__grid">
          <div className="landing-screenshots__item">
            <div className="landing-screenshots__mock" aria-label="Mockup del Dashboard">
              <div className="mock-topbar">
                <span className="mock-dot mock-dot--red" aria-hidden="true" />
                <span className="mock-dot mock-dot--yellow" aria-hidden="true" />
                <span className="mock-dot mock-dot--green" aria-hidden="true" />
                <span className="mock-title">Dashboard — DevTrack</span>
              </div>
              <div className="mock-body">
                <div className="mock-stats-row">
                  <div className="mock-stat mock-stat--blue">5 Materias</div>
                  <div className="mock-stat mock-stat--green">87% ✓</div>
                  <div className="mock-stat mock-stat--yellow">9% ~</div>
                </div>
                <div className="mock-list">
                  {[{m:'Matemáticas',s:'4.5'},{m:'Física',s:'3.8'},{m:'Programación',s:'4.9'}].map(({m,s}) => (
                    <div key={m} className="mock-row">
                      <span>{m}</span>
                      <span className="mock-score-pill">{s}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <p className="landing-screenshots__caption">Dashboard del estudiante</p>
          </div>

          <div className="landing-screenshots__item">
            <div className="landing-screenshots__mock" aria-label="Mockup de Resultados">
              <div className="mock-topbar">
                <span className="mock-dot mock-dot--red" aria-hidden="true" />
                <span className="mock-dot mock-dot--yellow" aria-hidden="true" />
                <span className="mock-dot mock-dot--green" aria-hidden="true" />
                <span className="mock-title">Resultados — Física</span>
              </div>
              <div className="mock-body">
                <div className="mock-table">
                  <div className="mock-th-row mock-td-row--2col">
                    <span>Ejercicio</span><span>Nota</span>
                  </div>
                  {[
                    { e: 'Taller #1', p: '4.8' },
                    { e: 'Parcial #1', p: '3.5' },
                    { e: 'Lab #2', p: '2.0' },
                  ].map((r) => (
                    <div key={r.e} className="mock-td-row mock-td-row--2col">
                      <span>{r.e}</span><span className="mock-score-pill">{r.p}</span>
                    </div>
                  ))}
                  <div className="mock-td-row mock-td-row--2col mock-td-row--avg">
                    <span><strong>Promedio</strong></span>
                    <span className="mock-score-pill mock-score-pill--avg">3.43</span>
                  </div>
                </div>
              </div>
            </div>
            <p className="landing-screenshots__caption">Notas 1.0–5.0 con promedio automático</p>
          </div>

          <div className="landing-screenshots__item">
            <div className="landing-screenshots__mock" aria-label="Mockup del panel del profesor">
              <div className="mock-topbar">
                <span className="mock-dot mock-dot--red" aria-hidden="true" />
                <span className="mock-dot mock-dot--yellow" aria-hidden="true" />
                <span className="mock-dot mock-dot--green" aria-hidden="true" />
                <span className="mock-title">Materias — Profesor</span>
              </div>
              <div className="mock-body">
                <div className="mock-list">
                  {[
                    { m: 'Cálculo I', n: '32 estudiantes' },
                    { m: 'Álgebra Lineal', n: '28 estudiantes' },
                    { m: 'Estadística', n: '45 estudiantes' },
                  ].map((item) => (
                    <div key={item.m} className="mock-row">
                      <div>
                        <div className="mock-bold">{item.m}</div>
                        <div className="mock-sub">{item.n}</div>
                      </div>
                      <span className="mock-chip">Ver →</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <p className="landing-screenshots__caption">Panel del profesor</p>
          </div>
        </div>
      </section>

      {/* ============================================================
          9. TESTIMONIOS
      ============================================================ */}
      <section className="landing-testimonials" id="testimonials" aria-label="Testimonios de usuarios">
        <h2>Lo que dicen nuestros usuarios</h2>
        <p className="landing-testimonials__disclaimer">
          * Los siguientes son testimonios de ejemplo. Próximamente publicaremos casos reales.
        </p>
        <div className="landing-testimonials__grid">
          <div className="landing-testimonials__card">
            <p className="landing-testimonials__quote">
              "DevTrack redujo a la mitad el tiempo que dedicaba a registrar calificaciones.
              La escala numérica del 1 al 5 hace que los estudiantes entiendan su situación de un vistazo."
            </p>
            <div className="landing-testimonials__author">
              <div className="landing-testimonials__avatar" aria-hidden="true">👩‍🏫</div>
              <div>
                <strong>Ana García</strong>
                <span>Profesora de Matemáticas — Universidad Ejemplo</span>
              </div>
            </div>
          </div>
          <div className="landing-testimonials__card">
            <p className="landing-testimonials__quote">
              "Por fin puedo ver mis notas en tiempo real sin esperar a que el profesor actualice
              una hoja de cálculo. La app es rápida y fácil de entender."
            </p>
            <div className="landing-testimonials__author">
              <div className="landing-testimonials__avatar" aria-hidden="true">🎓</div>
              <div>
                <strong>Carlos Méndez</strong>
                <span>Estudiante de Ingeniería — Instituto Ejemplo</span>
              </div>
            </div>
          </div>
          <div className="landing-testimonials__card">
            <p className="landing-testimonials__quote">
              "Migramos 3 000 estudiantes desde hojas de cálculo en una sola tarde.
              La plataforma nos permitió incorporar tres colegios al mismo tiempo sin ningún problema."
            </p>
            <div className="landing-testimonials__author">
              <div className="landing-testimonials__avatar" aria-hidden="true">🛡️</div>
              <div>
                <strong>Lucía Torres</strong>
                <span>Directora Académica — Red Colegios Ejemplo</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          10. SOBRE EL PROYECTO
      ============================================================ */}
      <section className="landing-about" id="about" aria-label="Sobre el proyecto DevTrack">
        <div className="landing-about__inner">
          <div className="landing-about__text">
            <h2>Sobre DevTrack</h2>
            <p>
              DevTrack nació de la necesidad de eliminar hojas de cálculo dispersas y registros
              físicos ineficientes en instituciones educativas. Nuestra misión es ofrecer una
              herramienta de gestión académica profesional que cualquier colegio o universidad
              pueda adoptar sin complicaciones.
            </p>
            <p>
              La plataforma está diseñada para crecer con tu institución: desde una pequeña escuela
              hasta una red de colegios o universidades. Cada institución tiene su propio espacio
              seguro y privado, garantizando la confidencialidad de sus datos en todo momento.
            </p>
            <div className="landing-about__stack">
              <span className="landing-about__tech">🎓 Para colegios y universidades</span>
              <span className="landing-about__tech">🔐 Datos seguros y privados</span>
              <span className="landing-about__tech">📱 Funciona en móvil y escritorio</span>
              <span className="landing-about__tech">🚀 Lista para usar hoy mismo</span>
              <span className="landing-about__tech">🧩 Fácil de configurar</span>
              <span className="landing-about__tech">💬 Soporte técnico incluido</span>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          11. FAQ PREVIEW
      ============================================================ */}
      <section className="landing-faq-preview" id="faq-preview" aria-label="Preguntas frecuentes">
        <h2>Preguntas frecuentes</h2>
        <div className="landing-faq-preview__list">
          {PREVIEW_FAQS.map((item, i) => (
            <div key={i} className="landing-faq-preview__item">
              <button
                className={`landing-faq-preview__question${openFaq === i ? ' active' : ''}`}
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                aria-expanded={openFaq === i}
              >
                <span>{item.q}</span>
                <span className="faq-icon" aria-hidden="true">{openFaq === i ? '−' : '+'}</span>
              </button>
              {openFaq === i && (
                <div className="landing-faq-preview__answer">
                  <p>{item.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="landing-faq-preview__footer">
          <Link to="/faq" className="btn btn-outline">Ver todas las preguntas →</Link>
        </div>
      </section>

      {/* ============================================================
          12. CTA FINAL
      ============================================================ */}
      <section className="landing-cta-final" id="cta-final" aria-label="Comenzar con DevTrack">
        <div className="landing-cta-final__inner">
          <h2>¿Listo para transformar el seguimiento académico de tu institución?</h2>
          <p>Comienza hoy. Planes flexibles para instituciones de cualquier tamaño. Demo gratuita sin compromiso.</p>
          <div className="landing-cta-final__buttons">
            {isAuthenticated ? (
              <Link to="/" className="btn btn-primary btn-lg">Ir al Dashboard →</Link>
            ) : (
              <>
                <Link to="/contact" className="btn btn-primary btn-lg">Solicitar demo gratuita</Link>
                <a href="#pricing" className="btn btn-outline btn-lg">Ver planes</a>
              </>
            )}
          </div>
          <div className="landing-cta-final__links">
            <Link to="/faq" className="landing-cta-final__link">Preguntas frecuentes</Link>
            <span aria-hidden="true"> · </span>
            <Link to="/contact" className="landing-cta-final__link">Contacto</Link>
          </div>
        </div>
      </section>
    </div>
  )
}
