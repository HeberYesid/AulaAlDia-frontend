import { describe, it, expect, vi } from 'vitest';
import { sendContactMessage } from '../contact';
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
});
