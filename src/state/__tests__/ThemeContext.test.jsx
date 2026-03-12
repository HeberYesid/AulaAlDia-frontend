import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, useTheme } from '../ThemeContext';

const TestComponent = () => {
    const { theme, toggleTheme, isDark, isLight } = useTheme();
    return (
        <div>
            <span data-testid="theme">{theme}</span>
            <span data-testid="isDark">{String(isDark)}</span>
            <span data-testid="isLight">{String(isLight)}</span>
            <button onClick={toggleTheme}>Toggle</button>
        </div>
    );
};

describe('ThemeContext', () => {
    beforeEach(() => {
        localStorage.clear();
        document.documentElement.removeAttribute('data-theme');
        document.body.className = '';
    });

    it('provides default dark theme', () => {
        render(<ThemeProvider><TestComponent /></ThemeProvider>);
        expect(screen.getByTestId('theme').textContent).toBe('dark');
        expect(screen.getByTestId('isDark').textContent).toBe('true');
        expect(screen.getByTestId('isLight').textContent).toBe('false');
    });

    it('toggles theme correctly', async () => {
        const user = userEvent.setup();
        render(<ThemeProvider><TestComponent /></ThemeProvider>);
        
        await user.click(screen.getByText('Toggle'));
        
        expect(screen.getByTestId('theme').textContent).toBe('light');
        expect(document.documentElement.getAttribute('data-theme')).toBe('light');
        expect(localStorage.getItem('aulaaldia-theme')).toBe('light');
        expect(document.body.className).toBe('light-theme');
    });

    it('initializes from localStorage', () => {
        localStorage.setItem('aulaaldia-theme', 'light');
        render(<ThemeProvider><TestComponent /></ThemeProvider>);
        expect(screen.getByTestId('theme').textContent).toBe('light');
    });
});
