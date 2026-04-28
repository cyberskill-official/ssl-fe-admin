import { useMutation, useQuery } from '@cyberskill/shared/react/apollo-client';
import { toast } from '@cyberskill/shared/react/toast';
import { useCallback } from 'react';

import type {
    createAdvertisementMutation,
    createAdvertisementMutationVariables,
    deleteAdvertisementMutation,
    deleteAdvertisementMutationVariables,
    getAdvertisementByPlacementQuery,
    getAdvertisementByPlacementQueryVariables,
    getAdvertisementQuery,
    getAdvertisementQueryVariables,
    getAdvertisementsQuery,
    getAdvertisementsQueryVariables,
    T_Advertisement,
    updateAdvertisementMutation,
    updateAdvertisementMutationVariables,
} from '#shared/graphql';

import {
    createAdvertisementDocument,
    deleteAdvertisementDocument,
    getAdvertisementByPlacementDocument,
    getAdvertisementDocument,
    getAdvertisementsDocument,
    updateAdvertisementDocument,
} from '#shared/graphql';
import { useTranslate } from '#shared/i18n';

export function useGetAdvertisement(filter: getAdvertisementQueryVariables['filter'], projection: getAdvertisementQueryVariables['projection'], options: getAdvertisementQueryVariables['options'], populate: getAdvertisementQueryVariables['populate']) {
    const { data, loading, refetch } = useQuery<getAdvertisementQuery, getAdvertisementQueryVariables>(
        getAdvertisementDocument,
        {
            variables: { filter, projection, options, populate },
            fetchPolicy: 'network-only',
        },
    );

    const advertisement = data?.getAdvertisement?.result || null;

    return { advertisement, loading, refetch };
}

export function useGetAdvertisements(
    filter?: getAdvertisementsQueryVariables['filter'],
    options?: getAdvertisementsQueryVariables['options'],
) {
    const { data, loading, refetch } = useQuery<
        getAdvertisementsQuery,
        getAdvertisementsQueryVariables
    >(getAdvertisementsDocument, {
        variables: { filter, options },
        fetchPolicy: 'network-only',
    });

    const advertisements: T_Advertisement[]
        = data?.getAdvertisements?.result?.docs?.filter(
            (a): a is T_Advertisement => a !== null && a !== undefined,
        ) || [];

    const totalDocs = data?.getAdvertisements?.result?.totalDocs || 0;
    const totalPages = data?.getAdvertisements?.result?.totalPages || 1;
    const hasNextPage = data?.getAdvertisements?.result?.hasNextPage || false;
    const hasPrevPage = data?.getAdvertisements?.result?.hasPrevPage || false;
    const page = data?.getAdvertisements?.result?.page || 1;
    const limit = data?.getAdvertisements?.result?.limit || 10;

    return {
        advertisements,
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

export function useGetAdvertisementByPlacement(
    placementType: getAdvertisementByPlacementQueryVariables['placementType'],
    placementId: getAdvertisementByPlacementQueryVariables['placementId'],
    slot?: getAdvertisementByPlacementQueryVariables['slot'],
) {
    const { data, loading, refetch } = useQuery<
        getAdvertisementByPlacementQuery,
        getAdvertisementByPlacementQueryVariables
    >(getAdvertisementByPlacementDocument, {
        variables: { placementType, placementId, slot },
        fetchPolicy: 'network-only',
    });

    const advertisement = data?.getAdvertisementByPlacement?.result || null;

    return { advertisement, loading, refetch };
}

export function useCreateAdvertisement() {
    const { t } = useTranslate('advertisement');
    const [createAdvertisement, { loading }] = useMutation<createAdvertisementMutation, createAdvertisementMutationVariables>(
        createAdvertisementDocument,
        {
            onCompleted: (data) => {
                const { success, message } = data.createAdvertisement;
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

    const execute = useCallback((advertisementData: createAdvertisementMutationVariables['doc']) => {
        return createAdvertisement({
            variables: { doc: advertisementData },
        });
    }, [createAdvertisement]);

    return { createAdvertisement: execute, loading };
}

export function useUpdateAdvertisement() {
    const { t } = useTranslate('advertisement');
    const [updateAdvertisement, { loading }] = useMutation<updateAdvertisementMutation, updateAdvertisementMutationVariables>(
        updateAdvertisementDocument,
        {
            onCompleted: (data) => {
                const { success, message } = data.updateAdvertisement;
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

    const execute = useCallback((filter: updateAdvertisementMutationVariables['filter'], updatedAdvertisement: updateAdvertisementMutationVariables['update']) => {
        return updateAdvertisement({
            variables: {
                filter,
                update: updatedAdvertisement,
                options: {},
            },
        });
    }, [updateAdvertisement]);

    return { updateAdvertisement: execute, loading };
}

export function useDeleteAdvertisement() {
    const { t } = useTranslate('advertisement');
    const [deleteAdvertisement, { loading }] = useMutation<deleteAdvertisementMutation, deleteAdvertisementMutationVariables>(
        deleteAdvertisementDocument,
        {
            onCompleted: (data) => {
                const { success, message } = data.deleteAdvertisement;
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

    const execute = useCallback((filter: deleteAdvertisementMutationVariables['filter']) => {
        return deleteAdvertisement({
            variables: {
                filter,
                options: {},
            },
        });
    }, [deleteAdvertisement]);

    return { deleteAdvertisement: execute, loading };
}
