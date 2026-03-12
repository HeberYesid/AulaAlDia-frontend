import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ThemeToggle from '../ThemeToggle';
import * as ThemeContext from '../../state/ThemeContext';

vi.mock('../../state/ThemeContext', () => ({
    useTheme: vi.fn()
}));

describe('ThemeToggle component', () => {
    it('renders with dark theme', () => {
        ThemeContext.useTheme.mockReturnValue({ isDark: true, toggleTheme: vi.fn() });
        render(<ThemeToggle />);
        
        const btn = screen.getByRole('button', { name: /Cambiar a modo claro/i });
        expect(btn).toBeTruthy();
        expect(btn.textContent).toContain('☀️');
    });

    it('renders with light theme', () => {
        ThemeContext.useTheme.mockReturnValue({ isDark: false, toggleTheme: vi.fn() });
        render(<ThemeToggle />);
        
        const btn = screen.getByRole('button', { name: /Cambiar a modo oscuro/i });
        expect(btn).toBeTruthy();
        expect(btn.textContent).toContain('🌙');
    });

    it('calls toggleTheme on click', async () => {
        const toggleTheme = vi.fn();
        ThemeContext.useTheme.mockReturnValue({ isDark: true, toggleTheme });
        const user = userEvent.setup();
        
        render(<ThemeToggle />);
        await user.click(screen.getByRole('button'));
        
        expect(toggleTheme).toHaveBeenCalled();
    });
});
