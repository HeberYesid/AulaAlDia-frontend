import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import RegisterTutor from '../RegisterTutor';
import { api } from '../../api/axios';
import { AuthProvider } from '../../state/AuthContext';

vi.mock('../../api/axios', () => ({
    api: { post: vi.fn(), get: vi.fn() },
    setApiActiveTenantId: vi.fn(),
    AUTH_INVALIDATED_EVENT: 'aulaaldia:auth-invalidated'
}));

vi.mock('../../components/TurnstileCaptcha', () => ({
    default: ({ onVerify, onReady }) => {
        return (
            <div>
                <button type="button" onClick={() => { onReady(); onVerify('fake-token'); }}>
                    Verify Captcha
                </button>
            </div>
        );
    }
}));

const renderWithAuth = (ui) => render(
    <MemoryRouter initialEntries={['/register-tutor?code=INV456']}>
        <AuthProvider>{ui}</AuthProvider>
    </MemoryRouter>
);

describe('RegisterTutor page', () => {
    it('submits registration successfully', async () => {
        api.get.mockResolvedValueOnce({ data: { email: 't@t.com', tenant_name: 'School' } });
        api.post.mockResolvedValueOnce({ data: {} });
        const user = userEvent.setup();
        
        renderWithAuth(<RegisterTutor />);
        
        await screen.findByText(/School/i);

        await user.type(screen.getByLabelText(/Nombres/i), 'Jane');
        await user.type(screen.getByLabelText(/Apellidos/i), 'Doe');
        
        await user.type(screen.getByLabelText(/^Contraseña$/i), 'Password123!');
        await user.type(screen.getByLabelText(/Confirmar Contraseña/i), 'Password123!');
        await user.click(screen.getByLabelText(/Autorizo el tratamiento de mis datos personales/i));
        
        await user.click(screen.getByRole('button', { name: /Verify Captcha/i }));
        await user.click(screen.getByRole('button', { name: /Completar acceso/i }));
        
        expect(api.post).toHaveBeenCalledWith('/api/v1/auth/register-tutor/', expect.objectContaining({
            email: 't@t.com',
            first_name: 'Jane',
            last_name: 'Doe',
            invitation_code: 'INV456',
            turnstile_token: 'fake-token',
            legal_acceptance: true,
        }));
    });
});
