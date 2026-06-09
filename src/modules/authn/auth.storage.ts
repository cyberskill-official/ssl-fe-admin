import { useCallback, useEffect, useRef, useState } from 'react';

type StorageType = 'local' | 'session';

interface StoredValue<T> {
    value: T | undefined;
    storageType: StorageType | undefined;
}

function getStorage(type: StorageType) {
    if (typeof window === 'undefined')
        return undefined;
    return type === 'local' ? window.localStorage : window.sessionStorage;
}

function readFromStorage<T>(storage: Storage | undefined, key: string): T | undefined {
    if (!storage)
        return undefined;
    const item = storage.getItem(key);
    if (!item)
        return undefined;
    try {
        return JSON.parse(item) as T;
    }
    catch {
        console.warn(`Corrupt storage value for key "${key}", removing`);
        storage.removeItem(key);
        return undefined;
    }
}

function readFromAnyStorage<T>(key: string): StoredValue<T> {
    const localStorage = getStorage('local');
    const sessionStorage = getStorage('session');

    const sessionValue = readFromStorage<T>(sessionStorage, key);
    if (sessionValue !== undefined) {
        return { value: sessionValue, storageType: 'session' };
    }

    const localValue = readFromStorage<T>(localStorage, key);
    if (localValue !== undefined) {
        return { value: localValue, storageType: 'local' };
    }

    return { value: undefined, storageType: undefined };
}

/**
 * Custom hook for auth token storage.
 * Reads from sessionStorage first so a tab-level login cannot be overridden by
 * stale persisted credentials from a different admin account.
 * Use persist=true to store in localStorage.
 */
export function useAuthStorage<T>(key: string) {
    const initialRead = (() => {
        try {
            return readFromAnyStorage<T>(key);
        }
        catch (error) {
            console.error(`Error reading storage key "${key}":`, error);
            return { value: undefined, storageType: undefined } as StoredValue<T>;
        }
    })();
    const [storedValue, setStoredValue] = useState<T | undefined>(initialRead.value);
    const storageTypeRef = useRef<StorageType | undefined>(initialRead.storageType);

    useEffect(() => {
        const syncFromStorage = () => {
            try {
                const { value, storageType } = readFromAnyStorage<T>(key);
                if (value !== storedValue) {
                    // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect
                    setStoredValue(value);
                }
                storageTypeRef.current = storageType;
            }
            catch (error) {
                console.error(`Error reading storage key "${key}" on mount:`, error);
            }
        };
        syncFromStorage();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [key]);

    const setValue = useCallback((value: T, persist?: boolean) => {
        try {
            setStoredValue(value);
            const nextStorageType: StorageType = persist !== undefined
                ? (persist ? 'local' : 'session')
                : (storageTypeRef.current ?? 'session');
            const nextStorage = getStorage(nextStorageType);
            const otherStorage = getStorage(nextStorageType === 'local' ? 'session' : 'local');

            if (nextStorage) {
                nextStorage.setItem(key, JSON.stringify(value));
            }
            if (otherStorage) {
                otherStorage.removeItem(key);
            }
            storageTypeRef.current = nextStorageType;
        }
        catch (error) {
            console.error(`Error setting storage key "${key}":`, error);
        }
    }, [key]);

    const removeValue = useCallback(() => {
        try {
            setStoredValue(undefined);
            const localStorage = getStorage('local');
            const sessionStorage = getStorage('session');
            if (localStorage)
                localStorage.removeItem(key);
            if (sessionStorage)
                sessionStorage.removeItem(key);
            storageTypeRef.current = undefined;
        }
        catch (error) {
            console.error(`Error removing storage key "${key}":`, error);
        }
    }, [key]);

    useEffect(() => {
        if (typeof window === 'undefined')
            return;
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key !== key)
                return;
            try {
                const { value, storageType } = readFromAnyStorage<T>(key);
                setStoredValue(value);
                storageTypeRef.current = storageType;
            }
            catch (error) {
                console.error('Error parsing storage event:', error);
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [key]);

    return {
        value: storedValue,
        set: setValue,
        remove: removeValue,
    };
}

export const useSessionStorage = useAuthStorage;
