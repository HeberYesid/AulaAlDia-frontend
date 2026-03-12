import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ConfirmDialog from '../ConfirmDialog';

describe('ConfirmDialog component', () => {
    it('renders title and message', () => {
        render(<ConfirmDialog title="Test Title" message="Test Message" onConfirm={() => {}} onCancel={() => {}} />);
        expect(screen.getByText('Test Title')).toBeTruthy();
        expect(screen.getByText('Test Message')).toBeTruthy();
    });

    it('calls onConfirm when confirming', async () => {
        const onConfirm = vi.fn();
        const user = userEvent.setup();
        render(<ConfirmDialog message="msg" onConfirm={onConfirm} onCancel={() => {}} />);
        
        await user.click(screen.getByText('Confirmar'));
        expect(onConfirm).toHaveBeenCalled();
    });

    it('calls onCancel when cancelling', async () => {
        const onCancel = vi.fn();
        const user = userEvent.setup();
        render(<ConfirmDialog message="msg" onConfirm={() => {}} onCancel={onCancel} />);
        
        await user.click(screen.getByText('Cancelar'));
        expect(onCancel).toHaveBeenCalled();
    });

    it('calls onCancel on Escape key', async () => {
        const onCancel = vi.fn();
        const user = userEvent.setup();
        render(<ConfirmDialog message="msg" onConfirm={() => {}} onCancel={onCancel} />);
        
        await user.keyboard('{Escape}');
        expect(onCancel).toHaveBeenCalled();
    });
});
