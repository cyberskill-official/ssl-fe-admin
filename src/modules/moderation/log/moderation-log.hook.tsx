import { useMutation, useQuery } from '@cyberskill/shared/react/apollo-client';
import { toast } from '@cyberskill/shared/react/toast';
import { useCallback } from 'react';

import type {
    createModerationLogMutation,
    createModerationLogMutationVariables,
    deleteModerationLogMutation,
    deleteModerationLogMutationVariables,
    getModerationLogQuery,
    getModerationLogQueryVariables,
    getModerationLogsQuery,
    getModerationLogsQueryVariables,
    updateModerationLogMutation,
    updateModerationLogMutationVariables,
} from '#shared/graphql';

import {
    createModerationLogDocument,
    deleteModerationLogDocument,
    getModerationLogDocument,
    getModerationLogsDocument,
    updateModerationLogDocument,
} from '#shared/graphql';
import { useTranslate } from '#shared/i18n';

import type {
    E_ModerationLogAction,
} from './moderation-log.type';

export function useGetModerationLog(
    filter: getModerationLogQueryVariables['filter'],
    projection?: getModerationLogQueryVariables['projection'],
    options?: getModerationLogQueryVariables['options'],
    populate?: getModerationLogQueryVariables['populate'],
) {
    const { data, loading, refetch } = useQuery<getModerationLogQuery, getModerationLogQueryVariables>(
        getModerationLogDocument,
        {
            variables: { filter, projection, options, populate },
            fetchPolicy: 'network-only',
        },
    );

    const moderationLog = data?.getModerationLog?.result || null;

    return { moderationLog, loading, refetch };
}

export function useGetModerationLogs(
    filter?: getModerationLogsQueryVariables['filter'],
    options?: getModerationLogsQueryVariables['options'],
    onlyAdminActions = false,
) {
    const effectiveOptions = onlyAdminActions
        ? { ...(options ?? {}), onlyAdminActions: true }
        : options;
    const { data, loading, refetch } = useQuery<
        getModerationLogsQuery,
        getModerationLogsQueryVariables
    >(getModerationLogsDocument, {
        variables: { filter, options: effectiveOptions },
        fetchPolicy: 'network-only',
    });

    const logs = data?.getModerationLogs?.result?.docs?.filter((log): log is NonNullable<typeof log> => log !== null && log !== undefined) || [];
    const totalDocs = data?.getModerationLogs?.result?.totalDocs || 0;
    const totalPages = data?.getModerationLogs?.result?.totalPages || 1;
    const hasNextPage = data?.getModerationLogs?.result?.hasNextPage || false;
    const hasPrevPage = data?.getModerationLogs?.result?.hasPrevPage || false;
    const page = data?.getModerationLogs?.result?.page || 1;
    const limit = data?.getModerationLogs?.result?.limit || 10;

    return {
        logs,
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

export function useCreateModerationLog() {
    const { t } = useTranslate('moderation');
    const [createModerationLog, { loading }] = useMutation<
        createModerationLogMutation,
        createModerationLogMutationVariables
    >(createModerationLogDocument, {
        onCompleted: (data) => {
            const { success, message } = data.createModerationLog;
            if (success) {
                toast.success(t('moderation-log-created'));
            }
            else {
                toast.error(message || t('error-create-moderation-log'));
            }
        },
        onError: (error) => {
            toast.error(error.message);
        },
    });

    const execute = useCallback(
        (doc: createModerationLogMutationVariables['doc']) => {
            return createModerationLog({
                variables: { doc },
            });
        },
        [createModerationLog],
    );

    return {
        createModerationLog: execute,
        loading,
    };
}

export function useUpdateModerationLog() {
    const { t } = useTranslate('moderation');
    const [updateModerationLog, { loading }] = useMutation<
        updateModerationLogMutation,
        updateModerationLogMutationVariables
    >(updateModerationLogDocument, {
        onCompleted: (data) => {
            const { success, message } = data.updateModerationLog;
            if (success) {
                toast.success(t('moderation-log-updated'));
            }
            else {
                toast.error(message || t('error-update-moderation-log'));
            }
        },
        onError: (error) => {
            toast.error(error.message);
        },
    });

    const execute = useCallback(
        (
            filter: updateModerationLogMutationVariables['filter'],
            update: updateModerationLogMutationVariables['update'],
        ) => {
            return updateModerationLog({
                variables: { filter, update },
            });
        },
        [updateModerationLog],
    );

    return {
        updateModerationLog: execute,
        loading,
    };
}

export function useDeleteModerationLog() {
    const { t } = useTranslate('moderation');
    const [deleteModerationLog, { loading }] = useMutation<
        deleteModerationLogMutation,
        deleteModerationLogMutationVariables
    >(deleteModerationLogDocument, {
        onCompleted: (data) => {
            const { success, message } = data.deleteModerationLog;
            if (success) {
                toast.success(t('moderation-log-deleted'));
            }
            else {
                toast.error(message || t('error-delete-moderation-log'));
            }
        },
        onError: (error) => {
            toast.error(error.message);
        },
    });

    const execute = useCallback(
        (filter: deleteModerationLogMutationVariables['filter']) => {
            return deleteModerationLog({
                variables: { filter },
            });
        },
        [deleteModerationLog],
    );

    return {
        deleteModerationLog: execute,
        loading,
    };
}

// Combined hook for AI moderation actions with automatic logging
export function useAIModerationWithLogging() {
    const { createModerationLog } = useCreateModerationLog();

    const logModerationAction = useCallback(
        async (
            action: E_ModerationLogAction,
            userId?: string,
            moderationMediaId?: string,
        ) => {
            const result = await createModerationLog({
                action,
                userId,
                moderationMediaId,
            });
            return result?.data?.createModerationLog?.result || null;
        },
        [createModerationLog],
    );

    return {
        logModerationAction,
    };
}

// Hook for getting logs filtered by action type
export function useGetModerationLogsByAction(
    action: E_ModerationLogAction,
    page: number = 1,
    limit: number = 10,
) {
    return useGetModerationLogs({ action }, { page, limit });
}

// Hook for getting logs filtered by user
export function useGetModerationLogsByUser(
    userId: string,
    page: number = 1,
    limit: number = 10,
) {
    return useGetModerationLogs({ userId }, { page, limit });
}

// Hook for getting logs filtered by media
export function useGetModerationLogsByMedia(
    moderationMediaId: string,
    page: number = 1,
    limit: number = 10,
) {
    return useGetModerationLogs({ moderationMediaId }, { page, limit });
}

// Combined moderation logs management hook
export function useModerationLogs() {
    const getModerationLogs = useGetModerationLogs();
    const createModerationLog = useCreateModerationLog();
    const updateModerationLog = useUpdateModerationLog();
    const deleteModerationLog = useDeleteModerationLog();
    const aiModerationWithLogging = useAIModerationWithLogging();

    return {
        ...getModerationLogs,
        createModerationLog: createModerationLog.createModerationLog,
        updateModerationLog: updateModerationLog.updateModerationLog,
        deleteModerationLog: deleteModerationLog.deleteModerationLog,
        logModerationAction: aiModerationWithLogging.logModerationAction,
        loading: getModerationLogs.loading
            || createModerationLog.loading
            || updateModerationLog.loading
            || deleteModerationLog.loading,
    };
}
