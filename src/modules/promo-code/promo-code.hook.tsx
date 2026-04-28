import { useMutation, useQuery } from '@cyberskill/shared/react/apollo-client';
import { toast } from '@cyberskill/shared/react/toast';
import { useCallback } from 'react';

import type {
    createPromoCodeMutation,
    createPromoCodeMutationVariables,
    deletePromoCodeMutation,
    deletePromoCodeMutationVariables,
    getPromoCodeQuery,
    getPromoCodeQueryVariables,
    getPromoCodesQuery,
    getPromoCodesQueryVariables,
    getRolesQueryVariables,
    T_PromoCode,
    updatePromoCodeMutation,
    updatePromoCodeMutationVariables,
} from '#shared/graphql';

import {
    createPromoCodeDocument,
    deletePromoCodeDocument,
    getPromoCodeDocument,
    getPromoCodesDocument,
    updatePromoCodeDocument,
} from '#shared/graphql';
import { useTranslate } from '#shared/i18n';

export function useGetPromoCode(filter: getPromoCodeQueryVariables['filter'], projection: getPromoCodeQueryVariables['projection'], options: getPromoCodeQueryVariables['options'], populate: getPromoCodeQueryVariables['populate']) {
    const { data, loading, refetch } = useQuery<getPromoCodeQuery, getPromoCodeQueryVariables>(
        getPromoCodeDocument,
        {
            variables: { filter, projection, options, populate },
            fetchPolicy: 'network-only',
        },
    );

    const promoCode = data?.getPromoCode?.result || null;

    return { promoCode, loading, refetch };
}

export function useGetPromoCodes(
    filter?: getPromoCodesQueryVariables['filter'],
    options?: getRolesQueryVariables['options'],
) {
    const { data, loading, refetch } = useQuery<
        getPromoCodesQuery,
        getPromoCodesQueryVariables
    >(getPromoCodesDocument, {
        variables: { filter, options },
        fetchPolicy: 'network-only',
    });

    const promoCodes: T_PromoCode[]
        = data?.getPromoCodes?.result?.docs?.filter(
            (pc): pc is T_PromoCode => pc !== null && pc !== undefined,
        ) || [];

    const totalDocs = data?.getPromoCodes?.result?.totalDocs || 0;
    const totalPages = data?.getPromoCodes?.result?.totalPages || 1;
    const hasNextPage = data?.getPromoCodes?.result?.hasNextPage || false;
    const hasPrevPage = data?.getPromoCodes?.result?.hasPrevPage || false;
    const page = data?.getPromoCodes?.result?.page || 1;
    const limit = data?.getPromoCodes?.result?.limit || 10;

    return {
        promoCodes,
        totalDocs,
        totalPages,
        hasNextPage,
        hasPrevPage,
        page,
        limit,
        loading,
        refetch,
    };
}

export function useCreatePromoCode() {
    const { t } = useTranslate('promoCodes');
    const [createPromoCode, { loading }] = useMutation<createPromoCodeMutation, createPromoCodeMutationVariables>(
        createPromoCodeDocument,
        {
            onCompleted: (data) => {
                const { success, message } = data.createPromoCode;
                if (success) {
                    toast.success(t('success-save'));
                }
                else {
                    toast.error(message || t('error-save'));
                }
            },
            onError: (error) => {
                toast.error(error.message);
            },
        },
    );

    const execute = useCallback((promoCodeData: createPromoCodeMutationVariables['doc']) => {
        return createPromoCode({
            variables: { doc: promoCodeData },
        });
    }, [createPromoCode]);

    return { createPromoCode: execute, loading };
}

export function useUpdatePromoCode() {
    const { t } = useTranslate('promoCodes');
    const [updatePromoCode, { loading }] = useMutation<updatePromoCodeMutation, updatePromoCodeMutationVariables>(
        updatePromoCodeDocument,
        {
            onCompleted: (data) => {
                const { success, message } = data.updatePromoCode;
                if (success) {
                    toast.success(t('success-save'));
                }
                else {
                    toast.error(message || t('error-save'));
                }
            },
            onError: (error) => {
                toast.error(error.message);
            },
        },
    );

    const execute = useCallback((filter: { id: string }, updatedPromoCode: updatePromoCodeMutationVariables['update']) => {
        return updatePromoCode({
            variables: {
                filter,
                update: updatedPromoCode,
                options: {},
            },
        });
    }, [updatePromoCode]);

    return { updatePromoCode: execute, loading };
}

export function useDeletePromoCode() {
    const { t } = useTranslate('promoCodes');
    const [deletePromoCode, { loading }] = useMutation<deletePromoCodeMutation, deletePromoCodeMutationVariables>(
        deletePromoCodeDocument,
        {
            onCompleted: (data) => {
                const { success, message } = data.deletePromoCode;
                if (success) {
                    toast.success(t('success-delete'));
                }
                else {
                    toast.error(message || t('error-delete'));
                }
            },
            onError: (error) => {
                toast.error(error.message);
            },
        },
    );

    const execute = useCallback((filter: { id: string }) => {
        return deletePromoCode({
            variables: {
                filter,
                options: {},
            },
        });
    }, [deletePromoCode]);

    return { deletePromoCode: execute, loading };
}
