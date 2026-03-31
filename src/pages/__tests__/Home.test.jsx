import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Home from '../Home';
import { AuthProvider } from '../../state/AuthContext';
import { useAuth } from '../../state/AuthContext';

vi.mock('../../state/AuthContext', () => ({
  useAuth: vi.fn(),
  AuthProvider: ({ children }) => <div>{children}</div>
}));

describe('Home page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders landing page correctly for unauthenticated user', () => {
    useAuth.mockReturnValue({ isAuthenticated: false });

    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );

    expect(screen.getByText(/que sí funciona/i)).toBeInTheDocument();
    
    // Links to login / contact
    const contactLinks = screen.getAllByRole('link', { name: /Solicitar demo/i });
    expect(contactLinks.length).toBeGreaterThan(0);
    
    expect(screen.getByText('Características principales')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Únete a la waitlist de AulaAlDía/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Quiero entrar a la waitlist/i })).toBeInTheDocument();
  });

  it('renders redirect to Dashboard for authenticated user', () => {
    useAuth.mockReturnValue({ isAuthenticated: true });

    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );

    expect(screen.getByText('El seguimiento académico')).toBeInTheDocument();
    
    // Instead of login / contact, it should show Dashboard links
    const dashboardLinks = screen.getAllByRole('link', { name: /Ir al Dashboard/i });
    expect(dashboardLinks.length).toBeGreaterThan(0);
  });
});
