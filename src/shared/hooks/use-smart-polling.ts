import { useEffect, useRef } from 'react';

export function useSmartPolling(callback: () => void, interval: number) {
    const savedCallbackRef = useRef(callback);

    // Remember the latest callback.
    useEffect(() => {
        savedCallbackRef.current = callback;
    }, [callback]);

    useEffect(() => {
        if (typeof window === 'undefined' || typeof document === 'undefined')
            return;

        const tick = () => {
            if (document.visibilityState === 'hidden') {
                return;
            }
            savedCallbackRef.current();
        };

        const id = setInterval(tick, interval);

        const onVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                // Determine if we should trigger immediately.
                // If the user switches tabs and comes back, we want fresh data.
                tick();
            }
        };

        document.addEventListener('visibilitychange', onVisibilityChange);

        return () => {
            clearInterval(id);
            document.removeEventListener('visibilitychange', onVisibilityChange);
        };
    }, [interval]);
}
