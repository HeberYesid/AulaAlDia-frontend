import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Alert from '../Alert';

describe('Alert component', () => {
    it('renders nothing if no message', () => {
        const { container } = render(<Alert />);
        expect(container.firstChild).toBeNull();
    });

    it('renders success alert by default', () => {
        render(<Alert message="Success message" />);
        const alert = screen.getByText('Success message');
        expect(alert.className).toContain('alert success');
        expect(alert.getAttribute('role')).toBe('status');
    });

    it('renders error alert correctly', () => {
        render(<Alert type="error" message="Error message" />);
        const alert = screen.getByText('Error message');
        expect(alert.className).toContain('alert error');
        expect(alert.getAttribute('role')).toBe('alert');
        expect(alert.getAttribute('aria-live')).toBe('assertive');
    });
});
