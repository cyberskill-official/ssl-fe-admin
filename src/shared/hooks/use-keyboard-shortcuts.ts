import { useCallback, useEffect } from 'react';

interface I_UseKeyboardShortcutsProps {
    isActive: boolean;
    onEscape?: () => void;
    onEnter?: () => void;
    requireCtrlOrMeta?: boolean;
}

export function useKeyboardShortcuts({
    isActive,
    onEscape,
    onEnter,
    requireCtrlOrMeta = false,
}: I_UseKeyboardShortcutsProps) {
    const handleKeyDown = useCallback((event: KeyboardEvent) => {
        if (!isActive) {
            return;
        }

        if (event.key === 'Escape' && onEscape) {
            onEscape();
        }

        if (event.key === 'Enter' && onEnter) {
            const shouldTrigger = !requireCtrlOrMeta || event.ctrlKey || event.metaKey;

            if (shouldTrigger) {
                event.preventDefault();
                onEnter();
            }
        }
    }, [isActive, onEscape, onEnter, requireCtrlOrMeta]);

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);

        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);
}
