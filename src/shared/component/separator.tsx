import type { VariantProps } from 'class-variance-authority';

import { cva } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '#shared/util';

const separatorVariants = cva(
    'shrink-0 bg-border',
    {
        variants: {
            orientation: {
                horizontal: 'h-[1px] w-full',
                vertical: 'h-full w-[1px]',
            },
        },
        defaultVariants: {
            orientation: 'horizontal',
        },
    },
);

export interface I_SeparatorProps
    extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof separatorVariants> {}

function Separator({ ref, className, orientation, ...props }: I_SeparatorProps & { ref?: React.RefObject<HTMLDivElement | null> }) {
    return (
        <div
            ref={ref}
            className={cn(separatorVariants({ orientation }), className)}
            {...props}
        />
    );
}
Separator.displayName = 'Separator';

export { Separator };
