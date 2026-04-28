import { useMutation, useQuery } from '@cyberskill/shared/react/apollo-client';
import { toast } from '@cyberskill/shared/react/toast';
import { useCallback } from 'react';

import type {
    createCatalogueMutation,
    createCatalogueMutationVariables,
    deleteCatalogueMutation,
    deleteCatalogueMutationVariables,
    getCatalogueQuery,
    getCatalogueQueryVariables,
    getCataloguesQuery,
    getCataloguesQueryVariables,
    T_Catalogue,
    updateCatalogueMutation,
    updateCatalogueMutationVariables,
} from '#shared/graphql';

import {
    createCatalogueDocument,
    deleteCatalogueDocument,
    getCatalogueDocument,
    getCataloguesDocument,
    updateCatalogueDocument,
} from '#shared/graphql';
import { useTranslate } from '#shared/i18n';

export function useGetCatalogue(filter: getCatalogueQueryVariables['filter'], projection: getCatalogueQueryVariables['projection'], options: getCatalogueQueryVariables['options'], populate: getCatalogueQueryVariables['populate']) {
    const { data, loading, refetch } = useQuery<getCatalogueQuery, getCatalogueQueryVariables>(
        getCatalogueDocument,
        {
            variables: { filter, projection, options, populate },
            fetchPolicy: 'network-only',
        },
    );

    const catalogue = data?.getCatalogue?.result || null;

    return { catalogue, loading, refetch };
}

export function useGetCatalogues(
    filter?: getCataloguesQueryVariables['filter'],
    options?: getCataloguesQueryVariables['options'],
) {
    const { data, loading, refetch } = useQuery<
        getCataloguesQuery,
        getCataloguesQueryVariables
    >(getCataloguesDocument, {
        variables: { filter, options },
        fetchPolicy: 'network-only',
    });

    const catalogues: T_Catalogue[]
        = data?.getCatalogues?.result?.docs?.filter(
            (c): c is T_Catalogue => c !== null && c !== undefined,
        ) || [];

    const totalDocs = data?.getCatalogues?.result?.totalDocs || 0;
    const totalPages = data?.getCatalogues?.result?.totalPages || 1;
    const hasNextPage = data?.getCatalogues?.result?.hasNextPage || false;
    const hasPrevPage = data?.getCatalogues?.result?.hasPrevPage || false;
    const page = data?.getCatalogues?.result?.page || 1;
    const limit = data?.getCatalogues?.result?.limit || 10;

    return {
        catalogues,
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

export function useCreateCatalogue() {
    const { t } = useTranslate('catalogue');
    const [createCatalogue, { loading }] = useMutation<createCatalogueMutation, createCatalogueMutationVariables>(
        createCatalogueDocument,
        {
            onCompleted: (data) => {
                const { success, message } = data.createCatalogue;

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

    const execute = useCallback((catalogueData: createCatalogueMutationVariables['doc']) => {
        return createCatalogue({
            variables: { doc: catalogueData },
        });
    }, [createCatalogue]);

    return { createCatalogue: execute, loading };
}

export function useUpdateCatalogue() {
    const { t } = useTranslate('catalogue');
    const [updateCatalogue, { loading }] = useMutation<updateCatalogueMutation, updateCatalogueMutationVariables>(
        updateCatalogueDocument,
        {
            onCompleted: (data) => {
                const { success, message } = data.updateCatalogue;

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

    const execute = useCallback((filter: { id: string }, updatedCatalogue: updateCatalogueMutationVariables['update']) => {
        return updateCatalogue({
            variables: {
                filter,
                update: updatedCatalogue,
                options: {},
            },
        });
    }, [updateCatalogue]);

    return { updateCatalogue: execute, loading };
}

export function useDeleteCatalogue() {
    const { t } = useTranslate('catalogue');
    const [deleteCatalogue, { loading }] = useMutation<deleteCatalogueMutation, deleteCatalogueMutationVariables>(
        deleteCatalogueDocument,
        {
            onCompleted: (data) => {
                const { success, message } = data.deleteCatalogue;

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
        return deleteCatalogue({
            variables: {
                filter,
                options: {},
            },
        });
    }, [deleteCatalogue]);

    return { deleteCatalogue: execute, loading };
}
