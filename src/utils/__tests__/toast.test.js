import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import toast, { showToast, showPasswordChangeToast } from '../toast';

describe('toast utility', () => {
    beforeEach(() => {
        document.body.innerHTML = '';
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('creates a toast container if it does not exist', () => {
        showToast({ message: 'Hello' });
        const container = document.getElementById('toast-container');
        expect(container).toBeTruthy();
    });

    it('renders a toast with correct message and default type', () => {
        showToast({ message: 'Test message' });
        const toastEl = document.querySelector('.toast');
        expect(toastEl).toBeTruthy();
        expect(toastEl.textContent).toContain('Test message');
        expect(toastEl.textContent).toContain('ℹ️');
    });

    it('renders different types correctly', () => {
        toast.success('Success msg');
        expect(document.querySelector('.toast').textContent).toContain('✅');

        document.body.innerHTML = '';
        toast.error('Error msg');
        expect(document.querySelector('.toast').textContent).toContain('❌');
    });

    it('auto-closes after duration', () => {
        showToast({ message: 'Auto close', duration: 1000 });
        expect(document.querySelector('.toast')).toBeTruthy();
        
        vi.advanceTimersByTime(1000);
        
        const toastEl = document.querySelector('.toast');
        expect(toastEl.classList.contains('removing')).toBe(true);

        vi.advanceTimersByTime(500);
        expect(document.querySelector('.toast')).toBeNull();
    });

    it('renders custom password change toast', () => {
        showPasswordChangeToast();
        const toastEl = document.querySelector('.toast');
        expect(toastEl.textContent).toContain('Contraseña Actualizada');
        expect(toastEl.textContent).toContain('Tu contraseña se actualizó exitosamente');
    });
});
