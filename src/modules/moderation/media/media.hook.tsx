import { useMutation, useQuery } from '@cyberskill/shared/react/apollo-client';
import { toast } from '@cyberskill/shared/react/toast';
import { useCallback } from 'react';

import type {
    approveModerationMediaMutation,
    approveModerationMediaMutationVariables,
    createModerationMediaMutation,
    createModerationMediaMutationVariables,
    deleteModerationMediaMutation,
    deleteModerationMediaMutationVariables,
    getModerationMediaQuery,
    getModerationMediaQueryVariables,
    getModerationMediasQuery,
    getModerationMediasQueryVariables,
    rejectModerationMediaMutation,
    rejectModerationMediaMutationVariables,
    T_ModerationMedia,
    updateModerationMediaMutation,
    updateModerationMediaMutationVariables,
} from '#shared/graphql';

import {
    approveModerationMediaDocument,
    createModerationMediaDocument,
    deleteModerationMediaDocument,
    getModerationMediaDocument,
    getModerationMediasDocument,
    rejectModerationMediaDocument,
    updateModerationMediaDocument,
} from '#shared/graphql';
import { useTranslate } from '#shared/i18n';

export function useGetModerationMedia(
    filter: getModerationMediaQueryVariables['filter'],
    projection: getModerationMediaQueryVariables['projection'],
    options: getModerationMediaQueryVariables['options'],
    populate: getModerationMediaQueryVariables['populate'],
) {
    const { data, loading, refetch } = useQuery<getModerationMediaQuery, getModerationMediaQueryVariables>(
        getModerationMediaDocument,
        {
            variables: { filter, projection, options, populate },
            fetchPolicy: 'network-only',
        },
    );

    const moderationMedia = data?.getModerationMedia?.result || null;

    return { moderationMedia, loading, refetch };
}

export function useGetModerationMedias(
    filter?: getModerationMediasQueryVariables['filter'],
    options?: getModerationMediasQueryVariables['options'],
) {
    const { data, loading, refetch } = useQuery<
        getModerationMediasQuery,
        getModerationMediasQueryVariables
    >(getModerationMediasDocument, {
        variables: { filter, options },
        fetchPolicy: 'network-only',
    });

    const moderationMedias: T_ModerationMedia[]
        = data?.getModerationMedias?.result?.docs?.filter(
            (media): media is T_ModerationMedia => media !== null && media !== undefined,
        ) || [];
    const totalDocs = data?.getModerationMedias?.result?.totalDocs || 0;
    const totalPages = data?.getModerationMedias?.result?.totalPages || 1;
    const hasNextPage = data?.getModerationMedias?.result?.hasNextPage || false;
    const hasPrevPage = data?.getModerationMedias?.result?.hasPrevPage || false;
    const page = data?.getModerationMedias?.result?.page || 1;
    const limit = data?.getModerationMedias?.result?.limit || 10;

    return {
        moderationMedias,
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

export function useCreateModerationMedia() {
    const { t } = useTranslate('media');
    const [createModerationMedia, { loading }] = useMutation<createModerationMediaMutation, createModerationMediaMutationVariables>(
        createModerationMediaDocument,
        {
            onCompleted: (data) => {
                const { success, message } = data.createModerationMedia;
                if (success) {
                    toast.success(t('create-media-success'));
                }
                else {
                    toast.error(message || t('create-media-error'));
                }
            },
            onError: (error) => {
                toast.error(error.message);
            },
        },
    );

    const execute = useCallback((mediaData: createModerationMediaMutationVariables['doc']) => {
        return createModerationMedia({
            variables: { doc: mediaData },
        });
    }, [createModerationMedia]);

    return { createModerationMedia: execute, loading };
}

export function useUpdateModerationMedia() {
    const { t } = useTranslate('media');
    const [updateModerationMedia, { loading }] = useMutation<updateModerationMediaMutation, updateModerationMediaMutationVariables>(
        updateModerationMediaDocument,
        {
            onCompleted: (data) => {
                const { success, message } = data.updateModerationMedia;
                if (success) {
                    toast.success(t('update-media-success'));
                }
                else {
                    toast.error(message || t('update-media-error'));
                }
            },
            onError: (error) => {
                toast.error(error.message);
            },
        },
    );

    const execute = useCallback((
        filter: updateModerationMediaMutationVariables['filter'],
        update: updateModerationMediaMutationVariables['update'],
        options?: updateModerationMediaMutationVariables['options'],
    ) => {
        return updateModerationMedia({
            variables: { filter, update, options },
        });
    }, [updateModerationMedia]);

    return { updateModerationMedia: execute, loading };
}

export function useDeleteModerationMedia() {
    const { t } = useTranslate('media');
    const [deleteModerationMedia, { loading }] = useMutation<deleteModerationMediaMutation, deleteModerationMediaMutationVariables>(
        deleteModerationMediaDocument,
        {
            onCompleted: (data) => {
                const { success, message } = data.deleteModerationMedia;
                if (success) {
                    toast.success(t('delete-media-success'));
                }
                else {
                    toast.error(message || t('delete-media-error'));
                }
            },
            onError: (error) => {
                toast.error(error.message);
            },
        },
    );

    const execute = useCallback((
        filter: deleteModerationMediaMutationVariables['filter'],
        options?: deleteModerationMediaMutationVariables['options'],
    ) => {
        return deleteModerationMedia({
            variables: { filter, options },
        });
    }, [deleteModerationMedia]);

    return { deleteModerationMedia: execute, loading };
}

export function useModerationMedia() {
    const { createModerationMedia, loading: creating } = useCreateModerationMedia();
    const { updateModerationMedia, loading: updating } = useUpdateModerationMedia();
    const { deleteModerationMedia, loading: deleting } = useDeleteModerationMedia();

    return {
        createModerationMedia,
        updateModerationMedia,
        deleteModerationMedia,
        creating,
        updating,
        deleting,
        loading: creating || updating || deleting,
    };
}

export function useApproveModerationMedia() {
    const { t } = useTranslate('moderation');
    const [approveModerationMediaMutation, { loading }] = useMutation<
        approveModerationMediaMutation,
        approveModerationMediaMutationVariables
    >(
        approveModerationMediaDocument,
        {
            onCompleted: (data) => {
                const { success, message } = data.approveModerationMedia;
                if (success) {
                    toast.success(t('media.approve-success') || 'Media approved successfully');
                }
                else {
                    toast.error(message || t('media.approve-error') || 'Failed to approve media');
                }
            },
            onError: (error) => {
                toast.error(error.message);
            },
        },
    );

    const execute = useCallback((id: string) => {
        return approveModerationMediaMutation({
            variables: { id },
        });
    }, [approveModerationMediaMutation]);

    return { approveModerationMedia: execute, loading };
}

export function useRejectModerationMedia() {
    const { t } = useTranslate('moderation');
    const [rejectModerationMediaMutation, { loading }] = useMutation<
        rejectModerationMediaMutation,
        rejectModerationMediaMutationVariables
    >(
        rejectModerationMediaDocument,
        {
            onCompleted: (data) => {
                const { success, message } = data.rejectModerationMedia;
                if (success) {
                    toast.success(t('media.reject-success') || 'Media rejected successfully');
                }
                else {
                    toast.error(message || t('media.reject-error') || 'Failed to reject media');
                }
            },
            onError: (error) => {
                toast.error(error.message);
            },
        },
    );

    const execute = useCallback((id: string, reason: string) => {
        return rejectModerationMediaMutation({
            variables: { id, reason },
        });
    }, [rejectModerationMediaMutation]);

    return { rejectModerationMedia: execute, loading };
}
