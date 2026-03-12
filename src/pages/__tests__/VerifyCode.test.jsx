import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import VerifyCode from '../VerifyCode';
import { api } from '../../api/axios';
import { AuthProvider } from '../../state/AuthContext';

vi.mock('../../api/axios', () => ({
    api: { post: vi.fn() },
    AUTH_INVALIDATED_EVENT: 'aulaaldia:auth-invalidated',
    setApiActiveTenantId: vi.fn()
}));

const renderWithAuth = (ui) => render(
    <MemoryRouter>
        <AuthProvider>{ui}</AuthProvider>
    </MemoryRouter>
);

describe('VerifyCode page', () => {
    it('submits the code successfully', async () => {
        api.post.mockResolvedValueOnce({ data: { message: 'Success' } });
        const user = userEvent.setup();
        
        renderWithAuth(<VerifyCode />);
        
        await user.type(screen.getByLabelText(/Correo Electrónico/i), 'test@test.com');
        await user.type(screen.getByLabelText(/Código de Verificación/i), '123456');
        
        await user.click(screen.getByRole('button', { name: /Verificar Código/i }));
        
        expect(api.post).toHaveBeenCalledWith('/api/v1/auth/verify-code/', {
            email: 'test@test.com',
            code: '123456'
        });
    });
});
