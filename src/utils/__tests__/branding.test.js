import { describe, it, expect } from 'vitest';
import { getBrandInitials } from '../branding';

describe('branding utility', () => {
    describe('getBrandInitials', () => {
        it('returns "AA" for empty or undefined input', () => {
            expect(getBrandInitials()).toBe('AA');
            expect(getBrandInitials('')).toBe('AA');
            expect(getBrandInitials('   ')).toBe('AA');
        });

        it('returns first two letters uppercase for single word', () => {
            expect(getBrandInitials('Aula')).toBe('AU');
            expect(getBrandInitials('test')).toBe('TE');
        });

        it('returns first letter of first two words uppercase for multiple words', () => {
            expect(getBrandInitials('Aula Al Dia')).toBe('AA');
            expect(getBrandInitials('john doe')).toBe('JD');
        });

        it('handles extra spaces correctly', () => {
            expect(getBrandInitials('  Hello   World  ')).toBe('HW');
        });
    });
});
