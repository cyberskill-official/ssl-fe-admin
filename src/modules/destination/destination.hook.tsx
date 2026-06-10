import { useMutation, useQuery } from '@cyberskill/shared/react/apollo-client';
import { toast } from '@cyberskill/shared/react/toast';
import { useCallback, useEffect } from 'react';

import type {
    createDestinationMutation,
    createDestinationMutationVariables,
    deleteDestinationMutation,
    deleteDestinationMutationVariables,
    getDestinationQuery,
    getDestinationQueryVariables,
    getDestinationsQuery,
    getDestinationsQueryVariables,
    Input_CreateDestination,
    Input_UpdateDestination,
    T_Destination,
    updateDestinationMutation,
    updateDestinationMutationVariables,
} from '#shared/graphql';

import {
    createDestinationDocument,
    deleteDestinationDocument,
    getDestinationDocument,
    getDestinationsDocument,
    updateDestinationDocument,
} from '#shared/graphql';
import { useTranslate } from '#shared/i18n';

export function useGetDestination(
    filter: getDestinationQueryVariables['filter'],
    projection: getDestinationQueryVariables['projection'],
    options: getDestinationQueryVariables['options'],
) {
    const { data, loading, error, refetch } = useQuery<getDestinationQuery, getDestinationQueryVariables>(
        getDestinationDocument,
        {
            variables: {
                filter,
                projection,
                options,
                populate: [
                    {
                        path: 'location',
                        populate: [
                            { path: 'map' },
                            { path: 'country' },
                        ],
                    },
                ],
            },
            fetchPolicy: 'network-only',
            skip: !filter?.id,
        },
    );

    useEffect(() => {
        if (error) {
            toast.error(error.message || 'Failed to fetch destination');
        }
    }, [error]);

    const destination = data?.getDestination?.result || null;

    return { destination, loading, error, refetch };
}

export function useGetDestinations(
    filter?: getDestinationsQueryVariables['filter'],
    options?: getDestinationsQueryVariables['options'],
) {
    const { data, loading, error, refetch } = useQuery<
        getDestinationsQuery,
        getDestinationsQueryVariables
    >(getDestinationsDocument, {
        variables: {
            filter,
            options,
        },
        fetchPolicy: 'network-only',
    });

    useEffect(() => {
        if (error) {
            toast.error(error.message || 'Failed to fetch destinations');
        }
    }, [error]);

    const destinations: T_Destination[]
        = data?.getDestinations?.result?.docs?.filter(
            (d): d is T_Destination => d !== null && d !== undefined,
        ) || [];

    const totalDocs = data?.getDestinations?.result?.totalDocs || 0;
    const totalPages = data?.getDestinations?.result?.totalPages || 1;
    const hasNextPage = data?.getDestinations?.result?.hasNextPage || false;
    const hasPrevPage = data?.getDestinations?.result?.hasPrevPage || false;
    const page = data?.getDestinations?.result?.page || 1;
    const limit = data?.getDestinations?.result?.limit || 10;

    return {
        destinations,
        totalDocs,
        totalPages,
        hasNextPage,
        hasPrevPage,
        page,
        limit,
        loading,
        error,
        refetch,
    };
}

export function useCreateDestination() {
    const { t } = useTranslate('destination');
    const [createDestination, { loading }] = useMutation<createDestinationMutation, createDestinationMutationVariables>(
        createDestinationDocument,
        {
            onCompleted: (data) => {
                const { success, message } = data.createDestination;
                if (success) {
                    toast.success(t('success-save'));
                }
                else {
                    toast.error(typeof message === 'string' ? message : t('error-save'));
                }
            },
            onError: (error) => {
                toast.error(t('error-creating-destination'));
                console.error('Error creating destination:', error);
            },
        },
    );

    const handleCreate = useCallback((data: Input_CreateDestination) => {
        return createDestination({ variables: { doc: data } });
    }, [createDestination]);

    return { createDestination: handleCreate, loading };
}

export function useUpdateDestination() {
    const { t } = useTranslate('destination');
    const [updateDestination, { loading }] = useMutation<updateDestinationMutation, updateDestinationMutationVariables>(
        updateDestinationDocument,
        {
            onCompleted: (data) => {
                const { success, message } = data.updateDestination;
                if (success) {
                    toast.success(t('success-save'));
                }
                else {
                    toast.error(typeof message === 'string' ? message : t('error-save'));
                }
            },
            onError: (error) => {
                toast.error(error.message);
            },
        },
    );

    const handleUpdate = useCallback((id: string, data: Input_UpdateDestination) => {
        return updateDestination({ variables: { filter: { id }, update: data } });
    }, [updateDestination]);

    return { updateDestination: handleUpdate, loading };
}

export function useDeleteDestination() {
    const { t } = useTranslate('destination');
    const [deleteDestination, { loading }] = useMutation<deleteDestinationMutation, deleteDestinationMutationVariables>(
        deleteDestinationDocument,
        {
            onCompleted: (data) => {
                const { success, message } = data.deleteDestination;
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
        return deleteDestination({
            variables: {
                filter,
                options: {},
            },
        });
    }, [deleteDestination]);

    return { deleteDestination: execute, loading };
}
