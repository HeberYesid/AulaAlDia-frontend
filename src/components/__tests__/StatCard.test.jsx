import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import StatCard from '../StatCard'

describe('StatCard component', () => {
  it('renders label and value', () => {
    const { container } = render(<StatCard label="Materias" value={12} />)

    expect(screen.getByText('12')).toBeInTheDocument()
    expect(screen.getByText('Materias')).toBeInTheDocument()
    expect(container.querySelector('.stat-icon')).not.toBeInTheDocument()
  })

  it('renders optional icon', () => {
    render(<StatCard label="Estudiantes" value={30} icon={<span data-testid="stat-icon">★</span>} />)

    expect(screen.getByTestId('stat-icon')).toBeInTheDocument()
    expect(screen.getByText('30')).toBeInTheDocument()
  })

  it('merges custom className with stat-card', () => {
    const { container } = render(<StatCard label="Profesores" value={5} className="custom-class" />)

    expect(container.firstChild).toHaveClass('stat-card')
    expect(container.firstChild).toHaveClass('custom-class')
  })
})
