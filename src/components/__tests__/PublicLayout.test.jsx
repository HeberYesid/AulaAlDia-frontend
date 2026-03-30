import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import PublicLayout from '../PublicLayout';

vi.mock('../PublicNavBar', () => ({
    default: () => <div data-testid="public-nav-bar" />
}));

describe('PublicLayout component', () => {
    it('renders PublicNavBar and children', () => {
        render(
            <MemoryRouter>
                <PublicLayout>
                    <div data-testid="child-element">Test Content</div>
                </PublicLayout>
            </MemoryRouter>
        );
        
        expect(screen.getByTestId('public-nav-bar')).toBeTruthy();
        expect(screen.getByTestId('child-element')).toBeTruthy();
        expect(screen.getByText('Test Content')).toBeTruthy();
    });
});
