import { render, screen } from '@testing-library/react';
import * as React from 'react';
import { describe, expect, it } from 'vitest';

import { Image } from './image';

describe('Image Component', () => {
    it('should have default loading="lazy" and decoding="async"', () => {
        render(<Image src="test.jpg" alt="test" />);
        const img = screen.getByRole('img');
        expect(img).toHaveAttribute('loading', 'lazy');
        expect(img).toHaveAttribute('decoding', 'async');
    });

    it('should allow overriding loading attribute', () => {
        render(<Image src="test.jpg" alt="test" loading="eager" />);
        const img = screen.getByRole('img');
        expect(img).toHaveAttribute('loading', 'eager');
    });

    it('should allow overriding decoding attribute', () => {
        render(<Image src="test.jpg" alt="test" decoding="sync" />);
        const img = screen.getByRole('img');
        expect(img).toHaveAttribute('decoding', 'sync');
    });
});
