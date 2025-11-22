import { useState } from 'react'
import { Link } from 'react-router-dom'
import '../styles.css'

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(null)

  const toggleQuestion = (index) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  const faqs = [
    {
      category: 'General',
      questions: [
        {
          question: '¿Qué es DevTrack?',
          answer:
            'DevTrack es un sistema de seguimiento académico diseñado para facilitar la gestión de asignaturas, estudiantes y resultados. Permite a profesores administrar cursos y evaluar el desempeño de los estudiantes, mientras que los estudiantes pueden consultar sus calificaciones y progreso en tiempo real.',
        },
        {
          question: '¿Quién puede usar DevTrack?',
          answer:
            'DevTrack está diseñado para tres tipos de usuarios: Estudiantes (pueden ver sus asignaturas y resultados), Profesores (pueden crear asignaturas, registrar estudiantes y calificar)',
        },
        {
          question: '¿Es gratis usar DevTrack?',
          answer:
            'Sí, DevTrack es un proyecto de código abierto y gratuito para uso académico. Puedes registrarte como estudiante o solicitar acceso como profesor sin costo alguno.',
        },
      ],
    },
    {
      category: 'Cuenta y Registro',
      questions: [
        {
          question: '¿Cómo me registro en DevTrack?',
          answer:
            'Para registrarte como estudiante, haz clic en "Registrarse" y completa el formulario. Si eres profesor, usa el enlace "Registro de Profesor". Después del registro, recibirás un código de verificación por correo electrónico (revisa spam) que debes ingresar para activar tu cuenta.',
        },
        {
          question: '¿Qué hago si no recibo el código de verificación?',
          answer:
            'Verifica tu carpeta de spam o correo no deseado. Si aún no lo encuentras, puedes solicitar un nuevo código desde la página de verificación. El código es válido por 15 minutos.',
        },
        {
          question: '¿Puedo cambiar mi contraseña?',
          answer:
            'Sí, desde tu perfil de usuario puedes cambiar tu contraseña en cualquier momento. Si olvidaste tu contraseña, usa la opción "¿Olvidaste tu contraseña?" en la página de inicio de sesión.',
        },
      ],
    },
    {
      category: 'Para Estudiantes',
      questions: [
        {
          question: '¿Cómo me inscribo en una asignatura?',
          answer:
            'Los profesores son quienes inscriben a los estudiantes en sus asignaturas. Si crees que deberías estar inscrito en una asignatura pero no aparece en tu lista, contacta al profesor correspondiente.',
        },
        {
          question: '¿Cómo veo mis calificaciones?',
          answer:
            'Puedes ver tus calificaciones en la sección "Mis Resultados" del menú principal. Allí encontrarás todas tus asignaturas y el estado de tus ejercicios (Verde: Aprobado, Amarillo: En proceso, Rojo: Necesita mejora).',
        },
        {
          question: '¿Qué significan los colores en mis resultados?',
          answer:
            'Verde indica que completaste exitosamente el ejercicio, Amarillo significa que tu desempeño es aceptable pero puede mejorar, y Rojo indica que necesitas trabajar más en ese ejercicio. La calificación final se calcula automáticamente basándose en estos estados.',
        },
      ],
    },
    {
      category: 'Para Profesores',
      questions: [
        {
          question: '¿Cómo creo una nueva asignatura?',
          answer:
            'Desde la sección "Asignaturas", haz clic en "Nueva Asignatura" y completa la información requerida (nombre, descripción, duración). Una vez creada, podrás agregar ejercicios e inscribir estudiantes.',
        },
        {
          question: '¿Cómo inscribo estudiantes en mi asignatura?',
          answer:
            'Puedes inscribir estudiantes de dos formas: manualmente desde el detalle de la asignatura, o mediante carga masiva usando un archivo CSV. El sistema proporciona plantillas CSV de ejemplo en la carpeta /samples del proyecto.',
        },
        {
          question: '¿Cómo registro los resultados de los estudiantes?',
          answer:
            'Desde el detalle de cada asignatura, puedes registrar resultados individualmente para cada estudiante y ejercicio, o usar la carga masiva mediante CSV para actualizar múltiples resultados a la vez. El sistema valida automáticamente que los estados sean Verde, Amarillo o Rojo.',
        },
        {
          question: '¿Puedo exportar los datos de mis asignaturas?',
          answer:
            'Actualmente, puedes ver todos los datos en el sistema. Las funcionalidades de exportación están en desarrollo. Por ahora, puedes copiar la información necesaria directamente desde las tablas.',
        },
      ],
    },
    {
      category: 'Técnico',
      questions: [
        {
          question: '¿Qué navegadores son compatibles?',
          answer:
            'DevTrack funciona en todos los navegadores modernos: Chrome, Firefox, Safari, Edge (versiones recientes). Recomendamos mantener tu navegador actualizado para la mejor experiencia.',
        },
        {
          question: '¿Los datos están seguros?',
          answer:
            'Sí, DevTrack implementa autenticación JWT, encriptación de contraseñas con bcrypt, y validación de correos electrónicos. Todas las comunicaciones entre el cliente y el servidor están protegidas.',
        },
        {
          question: '¿Puedo usar DevTrack en mi móvil?',
          answer:
            'Sí, DevTrack tiene un diseño responsive que se adapta a dispositivos móviles y tablets. Puedes acceder desde cualquier dispositivo con un navegador web.',
        },
      ],
    },
  ]

  return (
    <div className="faq-page">
      <div className="faq-header">
        <h1>Preguntas Frecuentes</h1>
        <p>Encuentra respuestas a las preguntas más comunes sobre DevTrack</p>
      </div>

      <div className="faq-content">
        {faqs.map((section, sectionIndex) => (
          <div key={sectionIndex} className="faq-section">
            <h2 className="faq-category">{section.category}</h2>
            <div className="faq-items">
              {section.questions.map((faq, index) => {
                const globalIndex = `${sectionIndex}-${index}`
                const isOpen = openIndex === globalIndex

                return (
                  <div key={index} className="faq-item">
                    <button
                      className={`faq-question ${isOpen ? 'active' : ''}`}
                      onClick={() => toggleQuestion(globalIndex)}
                    >
                      <span>{faq.question}</span>
                      <span className="faq-icon">{isOpen ? '−' : '+'}</span>
                    </button>
                    {isOpen && (
                      <div className="faq-answer">
                        <p>{faq.answer}</p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="faq-footer">
        <h3>¿No encontraste lo que buscabas?</h3>
        <p>Contáctanos y con gusto te ayudaremos</p>
        <Link to="/contact" className="btn btn-primary">
          Ir a Contacto
        </Link>
      </div>
    </div>
  )
}
