import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import StatusBadge from '../StatusBadge';

describe('StatusBadge component', () => {
    it('renders pending status by default', () => {
        render(<StatusBadge />);
        const badge = screen.getByText('Pendiente');
        expect(badge.className).toContain('badge PENDING');
    });

    it('renders submitted status', () => {
        render(<StatusBadge status="SUBMITTED" />);
        const badge = screen.getByText('Entregado');
        expect(badge.className).toContain('badge SUBMITTED');
    });

    it('renders score correctly', () => {
        render(<StatusBadge grade="8.5" />);
        const badge = screen.getByText('Nota: 8.50');
        expect(badge.className).toContain('badge SCORE');
    });

    it('adds LOCKED class when locked', () => {
        render(<StatusBadge grade="5" locked={true} />);
        const badge = screen.getByText('Nota: 5.00');
        expect(badge.className).toContain('LOCKED');
    });
});
