import { describe, expect, it, vi } from 'vitest';

import { validatePassword } from './user-form';

// Mock dependencies
vi.mock('#shared/i18n', () => ({
    useTranslate: () => ({ t: (key: string) => key }),
}));

vi.mock('@cyberskill/shared/react/toast', () => ({
    toast: {
        error: vi.fn(),
    },
}));

describe('validatePassword', () => {
    it('should return error if password is too short', () => {
        expect(validatePassword('Ab1!')).toBe('Password must be at least 8 characters long');
    });

    it('should return error if password has no uppercase', () => {
        expect(validatePassword('abcdefg1')).toBe('Password must contain at least one uppercase letter');
    });

    it('should return error if password has no lowercase', () => {
        expect(validatePassword('ABCDEFG1')).toBe('Password must contain at least one lowercase letter');
    });

    it('should return error if password has no number', () => {
        expect(validatePassword('Abcdefgh')).toBe('Password must contain at least one number');
    });

    it('should return null if password is valid', () => {
        expect(validatePassword('Abcdefg1')).toBe(null);
    });
});
