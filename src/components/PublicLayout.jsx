import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import PublicNavBar from './PublicNavBar'
import ThemeToggle from './ThemeToggle'
import { LEGAL_LINKS } from '../constants/legalLinks'

function ChatbaseBootstrap() {
  useEffect(() => {
    if (window.chatbase?.('getState') === 'initialized') return

    const q = []
    const handler = function () {
      q.push(arguments)
    }

    window.chatbase = new Proxy(handler, {
      get(target, prop) {
        if (prop === 'q') return q
        return function () {
          return target.apply(null, [prop].concat(Array.prototype.slice.call(arguments)))
        }
      },
    })

    const script = document.createElement('script')
    script.src = 'https://www.chatbase.co/embed.min.js'
    script.id = '4Mw7MbnOpjKpPVMP-qNMs'
    script.domain = 'www.chatbase.co'
    document.body.appendChild(script)

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script)
      }
      delete window.chatbase
    }
  }, [])

  return null
}

export default function PublicLayout({ children }) {
  return (
    <>
      <ChatbaseBootstrap />
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
      <div className="public-layout__theme-toggle">
        <ThemeToggle />
      </div>
    </>
  )
}
