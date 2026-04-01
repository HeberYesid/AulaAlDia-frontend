import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import PublicNavBar from '../PublicNavBar';
import * as AuthContext from '../../state/AuthContext';

vi.mock('../../state/AuthContext', () => ({
    useAuth: vi.fn()
}));

const renderWithRouter = (ui) => render(<MemoryRouter>{ui}</MemoryRouter>);

describe('PublicNavBar component', () => {
    beforeEach(() => {
        AuthContext.useAuth.mockReturnValue({
            isAuthenticated: false,
            activeTenantBranding: { displayName: 'Test Brand', sidebarLogoUrl: 'logo.png' },
            activeTenantId: null
        });
    });

    it('renders brand name and nav links', () => {
        renderWithRouter(<PublicNavBar />);
        expect(screen.getByText('Test Brand')).toBeTruthy();
        expect(screen.getByText('Características')).toBeTruthy();
        expect(screen.getByText('Iniciar Sesión')).toBeTruthy();
        expect(screen.queryByText('Registrarse')).toBeNull();
    });

    it('renders "Ir al Dashboard" when authenticated', () => {
        AuthContext.useAuth.mockReturnValue({
            isAuthenticated: true,
            activeTenantBranding: { displayName: 'Test Brand' },
            activeTenantId: null
        });
        renderWithRouter(<PublicNavBar />);
        expect(screen.getByText('Ir al Dashboard')).toBeTruthy();
        expect(screen.queryByText('Iniciar Sesión')).toBeNull();
    });

    it('toggles mobile menu', async () => {
        const user = userEvent.setup();
        renderWithRouter(<PublicNavBar />);
        
        const hamburgerBtn = screen.getByRole('button', { name: /Abrir menú/i });
        await user.click(hamburgerBtn);
        
        const mobileNav = screen.getByRole('navigation', { name: /Menú móvil/i });
        expect(mobileNav).toBeTruthy();
        
        await user.click(screen.getByRole('button', { name: /Cerrar menú/i })); // close
        expect(screen.queryByRole('navigation', { name: /Menú móvil/i })).toBeNull();
    });
});
