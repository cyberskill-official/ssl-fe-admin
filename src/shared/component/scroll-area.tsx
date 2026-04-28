import type { VariantProps } from 'class-variance-authority';

import { cva } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '#shared/util';

const scrollAreaVariants = cva(
    'relative overflow-hidden',
    {
        variants: {
            variant: {
                default: '',
            },
        },
        defaultVariants: {
            variant: 'default',
        },
    },
);

export interface I_ScrollAreaProps
    extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof scrollAreaVariants> {}

function ScrollArea({ ref, className, children, ...props }: I_ScrollAreaProps & { ref?: React.RefObject<HTMLDivElement | null> }) {
    return (
        <div
            ref={ref}
            className={cn(scrollAreaVariants(), className)}
            {...props}
        >
            <div className="h-full w-full overflow-auto">
                {children}
            </div>
        </div>
    );
}
ScrollArea.displayName = 'ScrollArea';

export { ScrollArea };
