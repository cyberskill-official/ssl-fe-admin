import * as React from 'react';
import { createContext, use, useCallback, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

import type { I_HeaderContent, I_PortalContext } from './portal.type';

const PortalContext = createContext<I_PortalContext | null>(null);

export function PortalProvider({ children }: { children: React.ReactNode }) {
    const [header, setHeader] = useState<I_HeaderContent | null>(null);

    const setHeaderCallback = useCallback(setHeader, [setHeader]);

    const portals = (
        <>
            {typeof window !== 'undefined' && document.getElementById('portal-header') && header
                && createPortal(
                    <div className="flex items-baseline gap-2 animate-fade-in-up">
                        {header.icon && (
                            <header.icon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                        )}
                        <h1 className="text-3xl my-1.5 font-extrabold bg-gradient-to-r from-purple-500 via-pink-500 to-yellow-400 bg-clip-text text-transparent drop-shadow-sm tracking-tight">
                            {header.title}
                        </h1>
                        {header.description && (
                            <span className="text-xs md:text-base text-gray-400 dark:text-gray-500 font-medium ml-2">
                                {header.description}
                            </span>
                        )}
                    </div>,
                    document.getElementById('portal-header')!,
                )}
        </>
    );

    const value = useMemo(() => ({
        setHeader: setHeaderCallback,
    }), [setHeaderCallback]);

    return (
        <PortalContext value={value}>
            {children}
            {portals}
        </PortalContext>
    );
}

export function usePortal() {
    const ctx = use(PortalContext);

    if (!ctx) {
        throw new Error('usePortal must be used within PortalProvider');
    }

    return ctx;
}
