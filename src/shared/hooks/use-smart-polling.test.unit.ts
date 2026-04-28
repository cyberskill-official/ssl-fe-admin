import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useSmartPolling } from './use-smart-polling';

describe('useSmartPolling', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        // Mock document.visibilityState
        Object.defineProperty(document, 'visibilityState', {
            value: 'visible',
            writable: true,
            configurable: true,
        });
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    it('should call callback on interval when visible', () => {
        const callback = vi.fn();
        renderHook(() => useSmartPolling(callback, 1000));

        expect(callback).not.toHaveBeenCalled();

        vi.advanceTimersByTime(1000);
        expect(callback).toHaveBeenCalledTimes(1);

        vi.advanceTimersByTime(1000);
        expect(callback).toHaveBeenCalledTimes(2);
    });

    it('should not call callback when hidden', () => {
        Object.defineProperty(document, 'visibilityState', {
            value: 'hidden',
            writable: true,
            configurable: true,
        });

        const callback = vi.fn();
        renderHook(() => useSmartPolling(callback, 1000));

        vi.advanceTimersByTime(1000);
        expect(callback).not.toHaveBeenCalled();
    });

    it('should call callback immediately when visibility changes to visible', () => {
        Object.defineProperty(document, 'visibilityState', {
            value: 'hidden',
            writable: true,
            configurable: true,
        });

        const callback = vi.fn();
        renderHook(() => useSmartPolling(callback, 1000));

        vi.advanceTimersByTime(1000);
        expect(callback).not.toHaveBeenCalled();

        // Change to visible and trigger event
        Object.defineProperty(document, 'visibilityState', {
            value: 'visible',
            writable: true,
            configurable: true,
        });
        document.dispatchEvent(new Event('visibilitychange'));

        expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should update callback when it changes', () => {
        const callback1 = vi.fn();
        const callback2 = vi.fn();

        const { rerender } = renderHook(({ cb }) => useSmartPolling(cb, 1000), {
            initialProps: { cb: callback1 },
        });

        vi.advanceTimersByTime(1000);
        expect(callback1).toHaveBeenCalledTimes(1);

        rerender({ cb: callback2 });

        vi.advanceTimersByTime(1000);
        expect(callback1).toHaveBeenCalledTimes(1);
        expect(callback2).toHaveBeenCalledTimes(1);
    });
});
