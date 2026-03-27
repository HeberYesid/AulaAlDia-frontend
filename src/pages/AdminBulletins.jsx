import { Link } from 'react-router-dom'

export default function AdminBulletins() {
  return (
    <div className="page-container fade-in">
      <header className="page-header" style={{ marginBottom: 'var(--space-lg)' }}>
        <h1 style={{ margin: 0 }}>Boletines</h1>
        <p style={{ margin: 'var(--space-xs) 0 0 0', color: 'var(--text-secondary)' }}>
          Gestiona y consulta boletines academicos institucionales.
        </p>
      </header>

      <section className="card" style={{ display: 'grid', gap: 'var(--space-md)' }}>
        <h2 style={{ margin: 0, fontSize: 'var(--font-size-xl)' }}>Modulo en preparacion</h2>
        <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
          Esta vista administrativa sera el punto central para revisar boletines generados,
          validar su estado y coordinar la publicacion por periodo.
        </p>
        <div>
          <Link to="/admin/academic-settings" className="btn primary" aria-label="Ir a configuracion academica">
            Ir a configuracion academica
          </Link>
        </div>
      </section>
    </div>
  )
}
