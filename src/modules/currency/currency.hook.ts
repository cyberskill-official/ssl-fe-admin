import { useMutation, useQuery } from '@cyberskill/shared/react/apollo-client';
import { toast } from '@cyberskill/shared/react/toast';
import { useCallback, useMemo } from 'react';

import type {
    createCurrencyMutation,
    createCurrencyMutationVariables,
    deleteCurrencyMutation,
    deleteCurrencyMutationVariables,
    getCurrenciesQuery,
    getCurrenciesQueryVariables,
    getCurrencyQuery,
    getCurrencyQueryVariables,
    updateCurrencyMutation,
    updateCurrencyMutationVariables,
} from '#shared/graphql';

import {
    createCurrencyDocument,
    deleteCurrencyDocument,
    getCurrenciesDocument,
    getCurrencyDocument,
    updateCurrencyDocument,
} from '#shared/graphql';
import { useTranslate } from '#shared/i18n';

export function useGetCurrencies(filter?: getCurrenciesQueryVariables['filter'], options?: getCurrenciesQueryVariables['options']) {
    const serializedFilter = JSON.stringify(filter);
    const serializedOptions = JSON.stringify(options);

    const memoizedFilter = useMemo(() => {
        return serializedFilter ? JSON.parse(serializedFilter) : undefined;
    }, [serializedFilter]);

    const memoizedOptions = useMemo(() => {
        return serializedOptions ? JSON.parse(serializedOptions) : undefined;
    }, [serializedOptions]);

    const { data, loading, refetch } = useQuery<getCurrenciesQuery, getCurrenciesQueryVariables>(
        getCurrenciesDocument,
        {
            variables: { filter: memoizedFilter, options: memoizedOptions },
            fetchPolicy: 'cache-first',
        },
    );
    const currencies = data?.getCurrencies?.result?.docs || [];
    const totalDocs = data?.getCurrencies?.result?.totalDocs || 0;
    return { currencies, totalDocs, loading, refetch };
}

export function useGetCurrency(filter: getCurrencyQueryVariables['filter'], options?: getCurrencyQueryVariables) {
    const { data, loading, refetch } = useQuery<getCurrencyQuery, getCurrencyQueryVariables>(
        getCurrencyDocument,
        {
            variables: { filter, ...options },
            fetchPolicy: 'network-only',
        },
    );
    const currency = data?.getCurrency?.result;
    return { currency, loading, refetch };
}

export function useCreateCurrency() {
    const { t } = useTranslate('currency');
    const [createCurrency, { loading }] = useMutation<createCurrencyMutation, createCurrencyMutationVariables>(
        createCurrencyDocument,
        {
            onCompleted: (data) => {
                if (data.createCurrency.success) {
                    toast.success(t('success-save'));
                }
                else {
                    toast.error(data.createCurrency.message || t('error-save'));
                }
            },
            onError: (error) => {
                toast.error(error.message);
            },
        },
    );
    const execute = useCallback((doc: createCurrencyMutationVariables['doc']) => {
        return createCurrency({ variables: { doc } });
    }, [createCurrency]);

    return { createCurrency: execute, loading };
}

export function useUpdateCurrency() {
    const { t } = useTranslate('currency');
    const [updateCurrency, { loading }] = useMutation<updateCurrencyMutation, updateCurrencyMutationVariables>(
        updateCurrencyDocument,
        {
            onCompleted: (data) => {
                if (data.updateCurrency.success) {
                    toast.success(t('success-save'));
                }
                else {
                    toast.error(data.updateCurrency.message || t('error-save'));
                }
            },
            onError: (error) => {
                toast.error(error.message);
            },
        },
    );
    const execute = useCallback((id: string, update: updateCurrencyMutationVariables['update']) => {
        return updateCurrency({ variables: { filter: { id }, update } });
    }, [updateCurrency]);

    return { updateCurrency: execute, loading };
}

export function useDeleteCurrency() {
    const { t } = useTranslate('currency');
    const [deleteCurrency, { loading }] = useMutation<deleteCurrencyMutation, deleteCurrencyMutationVariables>(
        deleteCurrencyDocument,
        {
            onCompleted: (data) => {
                if (data.deleteCurrency.success) {
                    toast.success(t('success-delete'));
                }
                else {
                    toast.error(data.deleteCurrency.message || t('error-delete'));
                }
            },
            onError: (error) => {
                toast.error(error.message);
            },
        },
    );
    const execute = useCallback((id: string) => {
        return deleteCurrency({ variables: { filter: { id } } });
    }, [deleteCurrency]);

    return { deleteCurrency: execute, loading };
}
