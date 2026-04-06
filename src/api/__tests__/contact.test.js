import { describe, it, expect, vi } from 'vitest';
import { sendContactMessage } from '../contact';
import { joinWaitlist } from '../contact';
import { api } from '../axios';

vi.mock('../axios', () => ({
    api: {
        post: vi.fn(),
    }
}));

describe('contact api', () => {
    it('sendContactMessage sends data correctly', async () => {
        api.post.mockResolvedValueOnce({ data: { success: true } });
        
        const testData = {
            name: 'John',
            email: 'j@j.com',
            subject: 'Hi',
            message: 'Hello',
            legal_acceptance: true,
        };
        const result = await sendContactMessage(testData);
        
        expect(api.post).toHaveBeenCalledWith('/api/v1/auth/contact/', testData);
        expect(result.success).toBe(true);
    });

    it('joinWaitlist sends data correctly', async () => {
        api.post.mockResolvedValueOnce({ data: { already_joined: false } });

        const waitlistData = {
            name: 'Laura',
            email: 'laura@example.com',
        };

        const result = await joinWaitlist(waitlistData);

        expect(api.post).toHaveBeenCalledWith('/api/v1/auth/waitlist/', waitlistData);
        expect(result.already_joined).toBe(false);
    });
});
