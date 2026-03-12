import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import ResetPassword from '../ResetPassword';
import { api } from '../../api/axios';

vi.mock('../../api/axios', () => ({
    api: { post: vi.fn() }
}));

describe('ResetPassword page', () => {
    it('submits the form successfully', async () => {
        api.post.mockResolvedValueOnce({ data: {} });
        const user = userEvent.setup();
        
        render(<MemoryRouter><ResetPassword /></MemoryRouter>);
        
        await user.type(screen.getByLabelText(/Email/i), 'test@test.com');
        await user.type(screen.getByLabelText(/Código de Verificación/i), '123456');
        await user.type(screen.getByLabelText(/Nueva Contraseña/i), 'Password123!');
        await user.type(screen.getByLabelText(/Confirmar Contraseña/i), 'Password123!');
        
        await user.click(screen.getByRole('button', { name: /Restablecer Contraseña/i, exact: false }));
        
        expect(api.post).toHaveBeenCalledWith('/api/v1/auth/reset-password/', {
            email: 'test@test.com',
            code: '123456',
            new_password: 'Password123!'
        });
    });
});
