import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';

export interface I_ListQueryParam<T> {
    defaultValue: T;
    parse: (value: string | null) => T;
    serialize: (value: T) => string;
}

export type T_ListQueryConfig<T_State extends object> = {
    [T_Key in keyof T_State]: I_ListQueryParam<T_State[T_Key]>;
};

interface I_SetListQueryStateOptions {
    replace?: boolean;
    resetPage?: boolean;
}

export function mergeListQueryState<T_State extends object>(
    state: T_State,
    patch: Partial<T_State>,
    config: T_ListQueryConfig<T_State>,
    resetPage = false,
): T_State {
    const nextState = { ...state, ...patch };
    if (resetPage && !Object.hasOwn(patch, 'page') && 'page' in config) {
        (nextState as Record<string, unknown>)['page'] = (config as Record<string, I_ListQueryParam<unknown>>)['page']?.defaultValue;
    }
    return nextState;
}

export function createIntegerQueryParam(
    defaultValue: number,
    { min = 1, allowedValues }: { min?: number; allowedValues?: readonly number[] } = {},
): I_ListQueryParam<number> {
    return {
        defaultValue,
        parse: (value) => {
            const parsed = value === null ? Number.NaN : Number.parseInt(value, 10);
            if (!Number.isInteger(parsed) || parsed < min)
                return defaultValue;
            if (allowedValues && !allowedValues.includes(parsed))
                return defaultValue;
            return parsed;
        },
        serialize: value => String(value),
    };
}

export function createEnumQueryParam<T_Value extends string>(
    defaultValue: T_Value,
    allowedValues: readonly T_Value[],
): I_ListQueryParam<T_Value> {
    return {
        defaultValue,
        parse: value => value !== null && allowedValues.includes(value as T_Value)
            ? value as T_Value
            : defaultValue,
        serialize: value => value,
    };
}

export function createStringQueryParam(defaultValue = ''): I_ListQueryParam<string> {
    return {
        defaultValue,
        parse: value => value?.trim() || defaultValue,
        serialize: value => value,
    };
}

export function createBooleanQueryParam(defaultValue = false): I_ListQueryParam<boolean> {
    return {
        defaultValue,
        parse: value => value === '1' ? true : value === '0' ? false : defaultValue,
        serialize: value => value ? '1' : '0',
    };
}

export function parseListQueryState<T_State extends object>(
    searchParams: URLSearchParams,
    config: T_ListQueryConfig<T_State>,
): T_State {
    return Object.fromEntries(
        Object.entries(config).map(([key, param]) => [
            key,
            (param as I_ListQueryParam<unknown>).parse(searchParams.get(key)),
        ]),
    ) as T_State;
}

export function serializeListQueryState<T_State extends object>(
    currentSearchParams: URLSearchParams,
    config: T_ListQueryConfig<T_State>,
    state: T_State,
): URLSearchParams {
    const next = new URLSearchParams(currentSearchParams);

    for (const [key, param] of Object.entries(config)) {
        const typedParam = param as I_ListQueryParam<unknown>;
        const value = state[key as keyof T_State];
        if (Object.is(value, typedParam.defaultValue)) {
            next.delete(key);
        }
        else {
            next.set(key, typedParam.serialize(value));
        }
    }

    return next;
}

export function useListQueryState<T_State extends object>(config: T_ListQueryConfig<T_State>) {
    const [searchParams, setSearchParams] = useSearchParams();
    const state = useMemo(
        () => parseListQueryState(searchParams, config),
        [config, searchParams],
    );

    useEffect(() => {
        const canonicalParams = serializeListQueryState(searchParams, config, state);
        if (canonicalParams.toString() !== searchParams.toString()) {
            setSearchParams(canonicalParams, { replace: true });
        }
    }, [config, searchParams, setSearchParams, state]);

    const setState = useCallback((
        patch: Partial<T_State>,
        { replace = false, resetPage = false }: I_SetListQueryStateOptions = {},
    ) => {
        const nextState = mergeListQueryState(state, patch, config, resetPage);
        const nextParams = serializeListQueryState(searchParams, config, nextState);
        setSearchParams(nextParams, { replace });
    }, [config, searchParams, setSearchParams, state]);

    return { state, setState };
}

export function useDebouncedQueryValue(
    value: string,
    onCommit: (value: string) => void,
    delay = 300,
) {
    const [inputValue, setInputValue] = useState(value);

    useEffect(() => {
        // Keep the input aligned with browser back/forward navigation.
        // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect
        setInputValue(value);
    }, [value]);

    useEffect(() => {
        if (inputValue === value)
            return;

        const timeoutId = window.setTimeout(onCommit, delay, inputValue);
        return () => window.clearTimeout(timeoutId);
    }, [delay, inputValue, onCommit, value]);

    return [inputValue, setInputValue] as const;
}
