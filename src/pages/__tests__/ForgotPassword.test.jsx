import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import ForgotPassword from '../ForgotPassword';
import { api } from '../../api/axios';

vi.mock('../../api/axios', () => ({
    api: { post: vi.fn() }
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

describe('ForgotPassword page', () => {
    it('submits the form successfully', async () => {
        api.post.mockResolvedValueOnce({ data: {} });
        const user = userEvent.setup();
        
        render(<MemoryRouter><ForgotPassword /></MemoryRouter>);
        
        await user.type(screen.getByLabelText(/Email/i), 'test@test.com');
        await user.click(screen.getByRole('button', { name: /Verify Captcha/i }));
        await user.click(screen.getByRole('button', { name: /Enviar Código/i, exact: false }));
        
        expect(api.post).toHaveBeenCalledWith('/api/v1/auth/forgot-password/', {
            email: 'test@test.com',
            turnstile_token: 'fake-token'
        });
        expect(await screen.findByText(/Código Enviado/i)).toBeTruthy();
    });
});
