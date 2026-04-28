import type { VariantProps } from 'class-variance-authority';

import { cva } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '#shared/util';

const imageVariants = cva(
    'block overflow-hidden',
    {
        variants: {
            size: {
                sm: 'w-12 h-12',
                md: 'w-32 h-32',
                lg: 'w-64 h-64',
            },
            fit: {
                cover: 'object-cover',
                contain: 'object-contain',
                fill: 'object-fill',
            },
            radius: {
                none: 'rounded-none',
                sm: 'rounded-sm',
                md: 'rounded-md',
                full: 'rounded-full',
            },
        },
        defaultVariants: {
            size: 'md',
            fit: 'cover',
            radius: 'none',
        },
    },
);

export interface I_ImageProps
    extends React.ImgHTMLAttributes<HTMLImageElement>,
    VariantProps<typeof imageVariants> {}

export function Image({ ref, className, size, fit, radius, ...props }: I_ImageProps & { ref?: React.RefObject<HTMLImageElement | null> }) {
    // Performance optimization: Default to lazy loading and async decoding
    // to improve page load speed and reduce main thread blocking.
    // These can be overridden by passing props (e.g., loading="eager" for LCP images).
    const { loading = 'lazy', decoding = 'async', ...rest } = props;

    return (
        <img
            loading={loading}
            decoding={decoding}
            ref={ref}
            className={cn(imageVariants({ size, fit, radius }), className)}
            {...rest}
        />
    );
}

Image.displayName = 'Image';
