import type { ReactElement } from 'react';

import { useEffect, useRef, useState } from 'react';

import { cn } from '#shared/util';

import { Label } from './label';

export interface I_FloatLabelProps {
    label: string;
    children: ReactElement;
    error?: string;
    className?: string;
    required?: boolean;
}

export function FloatLabel({
    label,
    children,
    error,
    className = '',
    required = false,
}: I_FloatLabelProps) {
    const [isFocused, setIsFocused] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const container = containerRef.current;

        if (!container) {
            return;
        }

        const handleFocusIn = () => setIsFocused(true);
        const handleFocusOut = () => setIsFocused(false);

        container.addEventListener('focusin', handleFocusIn);
        container.addEventListener('focusout', handleFocusOut);

        return () => {
            container.removeEventListener('focusin', handleFocusIn);
            container.removeEventListener('focusout', handleFocusOut);
        };
    }, []);

    return (
        <div ref={containerRef} className={cn('relative', className)}>
            {children}
            <Label className="absolute left-3 -top-2 text-xs font-medium text-purple-600 dark:text-purple-400 transition-all duration-200 pointer-events-none bg-white dark:bg-gray-900 px-1 z-10">
                {label}
                {required && <span className="text-red-500 ml-0.5">*</span>}
            </Label>
            {error && isFocused && (
                <div className="absolute -top-10 left-0 bg-red-500 text-white text-xs px-2 py-1 rounded shadow-lg z-10">
                    {error}
                    <div className="absolute top-full left-3 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-red-500"></div>
                </div>
            )}
        </div>
    );
}
