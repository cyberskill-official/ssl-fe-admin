import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Image } from './image';

describe('Image Component', () => {
    it('should have default loading="lazy" and decoding="async"', () => {
        render(<Image src="test.jpg" alt="test" />);
        const img = screen.getByRole('img');
        expect(img.getAttribute('loading')).toBe('lazy');
        expect(img.getAttribute('decoding')).toBe('async');
    });

    it('should allow overriding loading attribute', () => {
        render(<Image src="test.jpg" alt="test" loading="eager" />);
        const img = screen.getByRole('img');
        expect(img.getAttribute('loading')).toBe('eager');
    });

    it('should allow overriding decoding attribute', () => {
        render(<Image src="test.jpg" alt="test" decoding="sync" />);
        const img = screen.getByRole('img');
        expect(img.getAttribute('decoding')).toBe('sync');
    });
});
