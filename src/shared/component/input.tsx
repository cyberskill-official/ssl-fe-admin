import * as React from 'react';

import { cn } from '#shared/util';

function Input({
    className,
    type,
    suppressHydrationWarning,
    ...props
}: React.ComponentProps<'input'>) {
    return (
        <input
            type={type}
            data-slot="input"
            className={cn('w-full border rounded-md px-3 py-2', className)}
            suppressHydrationWarning={suppressHydrationWarning ?? true}
            {...props}
        />
    );
}

export { Input };
