import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import RegisterTeacher from '../RegisterTeacher';
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
    <MemoryRouter initialEntries={['/register-teacher?code=INV123']}>
        <AuthProvider>{ui}</AuthProvider>
    </MemoryRouter>
);

describe('RegisterTeacher page', () => {
    it('submits registration successfully', async () => {
        api.get.mockResolvedValueOnce({ data: { email: 't@t.com', tenant_name: 'School' } });
        api.post.mockResolvedValueOnce({ data: {} });
        const user = userEvent.setup();
        
        renderWithAuth(<RegisterTeacher />);
        
        await screen.findByText(/School/i);

        await user.type(screen.getByLabelText(/Nombres/i), 'John');
        await user.type(screen.getByLabelText(/Apellidos/i), 'Doe');
        
        await user.type(screen.getByLabelText(/^Contrasena$/i), 'Password123!');
        await user.type(screen.getByLabelText(/Confirmar Contrasena/i), 'Password123!');
        
        await user.click(screen.getByRole('button', { name: /Verify Captcha/i }));
        await user.click(screen.getByRole('button', { name: /Completar acceso de profesor/i }));
        
        expect(api.post).toHaveBeenCalledWith('/api/v1/auth/register-teacher/', expect.objectContaining({
            email: 't@t.com',
            first_name: 'John',
            last_name: 'Doe',
            invitation_code: 'INV123',
            turnstile_token: 'fake-token'
        }));
    });
});
