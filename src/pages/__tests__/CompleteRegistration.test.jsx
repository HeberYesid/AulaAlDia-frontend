import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import CompleteRegistration from '../CompleteRegistration';
import { api } from '../../api/axios';
import { AuthProvider } from '../../state/AuthContext';

vi.mock('../../api/axios', () => ({
    api: { post: vi.fn() },
    setApiActiveTenantId: vi.fn(),
    AUTH_INVALIDATED_EVENT: 'aulaaldia:auth-invalidated'
}));

const renderWithAuth = (ui) => render(
    <MemoryRouter>
        <AuthProvider>{ui}</AuthProvider>
    </MemoryRouter>
);

describe('CompleteRegistration page', () => {
    it('submits the invitation code successfully', async () => {
        api.post.mockResolvedValueOnce({ data: { message: 'Success', user: {} } });
        const user = userEvent.setup();
        
        renderWithAuth(<CompleteRegistration />);
        
        await user.type(screen.getByLabelText(/Codigo de Invitacion/i), 'INV123');
        await user.click(screen.getByRole('button', { name: /Completar acceso restringido/i }));
        
        expect(api.post).toHaveBeenCalledWith('/api/v1/auth/complete-google-registration/', {
            invitation_code: 'INV123'
        });
    });
});
