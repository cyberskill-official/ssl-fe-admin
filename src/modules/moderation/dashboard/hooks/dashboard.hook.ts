import { useMutation, useQuery } from '@cyberskill/shared/react/apollo-client';
import { toast } from '@cyberskill/shared/react/toast';
import { useCallback, useMemo } from 'react';

import type {
    DeleteModerationLogMutation,
    DeleteModerationLogMutationVariables,
    getKeywordsQuery,
    getKeywordsQueryVariables,
    GetModerationLogsQuery,
    GetModerationLogsQueryVariables,
    getModerationMediasQuery,
    getModerationMediasQueryVariables,
    getUsersQuery,
    getUsersQueryVariables,
} from '#shared/graphql';

import {
    DeleteModerationLogDocument,
    getKeywordsDocument,
    GetModerationLogsDocument,
    getModerationMediasDocument,
    getUsersDocument,
    getBlocksDocument,
} from '#shared/graphql';
import type { getBlocksQuery, getBlocksQueryVariables } from '#shared/graphql';
import { useTranslate } from '#shared/i18n';

/**
 * Hook to fetch dashboard statistics
 * Returns: pending images, videos, keywords count
 */
export function useModerationDashboardStats() {
    // Fetch pending images
    const { data: imagesData, loading: imagesLoading } = useQuery<
        getModerationMediasQuery,
        getModerationMediasQueryVariables
    >(getModerationMediasDocument, {
        variables: {
            filter: { type: 'IMAGE' as any, status: 'PENDING' as any },
            options: { limit: 0 },
        },
        fetchPolicy: 'cache-and-network',
        pollInterval: 30000,
    });

    // Fetch pending videos
    const { data: videosData, loading: videosLoading } = useQuery<
        getModerationMediasQuery,
        getModerationMediasQueryVariables
    >(getModerationMediasDocument, {
        variables: {
            filter: { type: 'VIDEO' as any, status: 'PENDING' as any },
            options: { limit: 0 },
        },
        fetchPolicy: 'cache-and-network',
        pollInterval: 30000,
    });

    // Fetch flagged keywords
    const { data: keywordsData, loading: keywordsLoading } = useQuery<
        getKeywordsQuery,
        getKeywordsQueryVariables
    >(getKeywordsDocument, {
        variables: {
            filter: { isActive: true },
            options: { limit: 0 },
        },
        fetchPolicy: 'cache-and-network',
        pollInterval: 30000,
    });

    const stats = useMemo(() => {
        const pendingImages = imagesData?.getModerationMedias?.result?.totalDocs || 0;
        const pendingVideos = videosData?.getModerationMedias?.result?.totalDocs || 0;
        const flaggedKeywords = keywordsData?.getKeywords?.result?.totalDocs || 0;

        return {
            pendingImages,
            pendingVideos,
            flaggedKeywords,
            aiAccuracy: 94.5, // TODO: Calculate from AI moderation results when API available
            totalPending: pendingImages + pendingVideos,
        };
    }, [imagesData, videosData, keywordsData]);

    const loading = imagesLoading || videosLoading || keywordsLoading;

    return {
        stats,
        loading,
    };
}

/**
 * Hook to fetch recent moderation activities
 * Uses existing getModerationLogs API
 */
export function useRecentModerationActivities(limit = 10) {
    const { data, loading, refetch } = useQuery<
        GetModerationLogsQuery,
        GetModerationLogsQueryVariables
    >(GetModerationLogsDocument, {
        variables: {
            options: {
                limit,
                sort: { createdAt: -1 },
                populate: ['user', 'moderationMedia'],
            },
        },
        fetchPolicy: 'network-only',
        pollInterval: 15000,
    });

    const { data: blocksData, loading: blocksLoading } = useQuery<
        getBlocksQuery,
        getBlocksQueryVariables
    >(getBlocksDocument, {
        variables: { options: { limit, sort: { createdAt: -1 }, populate: ['user', 'block'] } },
        fetchPolicy: 'network-only',
        pollInterval: 15000,
    });

    const activities = useMemo(() => {
        const logsActivities = (data?.getModerationLogs?.result?.docs || []).map((log: any) => ({
            id: log?.id || '',
            type: log?.moderationMedia?.type?.toLowerCase() || 'unknown',
            action: (() => {
                const act = log?.action?.toLowerCase() || 'unknown';
                if (act === 'block') return 'blocked';
                if (act === 'warn') return 'warned';
                if (act === 'suspend') return 'suspended';
                if (act === 'approve') return 'approved';
                if (act === 'reject') return 'rejected';
                if (act === 'delete') return 'deleted';
                return act;
            })(),
            reason: log?.reason || '',
            timestamp: log?.createdAt || new Date().toISOString(),
            userId: log?.userId || '',
            username: log?.user?.username || 'Unknown User',
        }));

        const blocksActivities = (blocksData?.getBlocks?.result?.docs || []).map((block: any) => ({
            id: block?.id || '',
            type: 'user',
            action: 'blocked',
            reason: '',
            timestamp: block?.createdAt || new Date().toISOString(),
            userId: block?.block?.id || '',
            username: block?.block?.username || 'Unknown User',
        }));

        const allActivities = [...logsActivities, ...blocksActivities].sort(
            (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );

        return allActivities.slice(0, limit);
    }, [data, blocksData, limit]);

    return {
        activities,
        loading: loading || blocksLoading,
        refetch,
    };
}

/**
 * Hook to fetch monthly moderation report
 * Uses existing getModerationLogs API with pagination
 * Note: Date filtering should be done client-side or backend needs date filter support
 */
export function useMonthlyModerationReport(
    month: number,
    year: number,
    page = 1,
    limit = 50,
) {
    const { data, loading, refetch } = useQuery<
        GetModerationLogsQuery,
        GetModerationLogsQueryVariables
    >(GetModerationLogsDocument, {
        variables: {
            options: {
                page,
                limit,
                sort: { createdAt: -1 },
                populate: ['user', 'moderationMedia'],
            },
        },
        fetchPolicy: 'network-only',
    });

    const { data: blocksData, loading: blocksLoading } = useQuery<
        getBlocksQuery,
        getBlocksQueryVariables
    >(getBlocksDocument, {
        variables: { options: { limit: 1000, sort: { createdAt: -1 }, populate: ['user', 'block'] } },
        fetchPolicy: 'network-only',
    });

    const report = useMemo(() => {
        const logs = data?.getModerationLogs?.result?.docs || [];
        const blocks = blocksData?.getBlocks?.result?.docs || [];

        // Filter by month/year client-side
        const filteredLogs = logs.filter((log: any) => {
            if (!log?.createdAt)
                return false;
            const logDate = new Date(log.createdAt);
            return logDate.getMonth() === month && logDate.getFullYear() === year;
        });

        const filteredBlocks = blocks.filter((block: any) => {
            if (!block?.createdAt) return false;
            const blockDate = new Date(block.createdAt);
            return blockDate.getMonth() === month && blockDate.getFullYear() === year;
        });

        const logActions = filteredLogs.map((log: any) => ({
            id: log?.id || '',
            date: log?.createdAt || '',
            time: new Date(log?.createdAt || '').toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
            }),
            profileName: log?.user?.username || 'Unknown',
            action: (() => {
                const act = log?.action?.toLowerCase() || 'unknown';
                if (act === 'block') return 'blocked';
                if (act === 'warn') return 'warned';
                if (act === 'suspend') return 'suspended';
                if (act === 'approve') return 'approved';
                if (act === 'reject') return 'rejected';
                if (act === 'delete') return 'deleted';
                return act;
            })(),
            moderator: 'Admin',
            reason: log?.reason || '',
            contentType: log?.moderationMedia?.type?.toLowerCase() || 'unknown',
        }));

        const blockActions = filteredBlocks.map((block: any) => ({
            id: block?.id || '',
            date: block?.createdAt || '',
            time: new Date(block?.createdAt || '').toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
            }),
            profileName: block?.block?.username || 'Unknown',
            action: 'blocked',
            moderator: block?.user?.username || 'Admin',
            reason: '',
            contentType: 'profile',
        }));

        const allActions = [...logActions, ...blockActions].sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        return {
            actions: allActions,
            totalDocs: allActions.length,
            totalPages: 1,
            currentPage: 1,
            hasNextPage: false,
            hasPrevPage: false,
        };
    }, [data, blocksData, month, year]);

    return {
        report,
        loading: loading || blocksLoading,
        refetch,
    };
}

/**
 * Hook to fetch action statistics
 * Calculates stats from fetched logs client-side
 */
export function useModerationActionStats(month: number, year: number) {
    const { data, loading } = useQuery<
        GetModerationLogsQuery,
        GetModerationLogsQueryVariables
    >(GetModerationLogsDocument, {
        variables: {
            options: {
                limit: 1000,
                sort: { createdAt: -1 },
            },
        },
        fetchPolicy: 'network-only',
    });

    const { data: blocksData, loading: blocksLoading } = useQuery<
        getBlocksQuery,
        getBlocksQueryVariables
    >(getBlocksDocument, {
        variables: { options: { limit: 1000, sort: { createdAt: -1 } } },
        fetchPolicy: 'network-only',
    });

    const actionStats = useMemo(() => {
        const logs = data?.getModerationLogs?.result?.docs || [];
        const blocks = blocksData?.getBlocks?.result?.docs || [];

        // Filter by month/year
        const filteredLogs = logs.filter((log: any) => {
            if (!log?.createdAt)
                return false;
            const logDate = new Date(log.createdAt);
            return logDate.getMonth() === month && logDate.getFullYear() === year;
        });

        const filteredBlocks = blocks.filter((block: any) => {
            if (!block?.createdAt) return false;
            const blockDate = new Date(block.createdAt);
            return blockDate.getMonth() === month && blockDate.getFullYear() === year;
        });

        const approved = filteredLogs.filter((l: any) => {
            const action = l?.action?.toUpperCase();
            return action === 'APPROVED' || action === 'APPROVE';
        }).length;
        const rejected = filteredLogs.filter((l: any) => {
            const action = l?.action?.toUpperCase();
            return action === 'REJECTED' || action === 'REJECT';
        }).length;
        const suspended = filteredLogs.filter((l: any) => {
            const action = l?.action?.toUpperCase();
            return action === 'SUSPENDED' || action === 'SUSPEND';
        }).length;
        const deleted = filteredLogs.filter((l: any) => {
            const action = l?.action?.toUpperCase();
            return action === 'DELETED' || action === 'DELETE';
        }).length;
        const warned = filteredLogs.filter((l: any) => {
            const action = l?.action?.toUpperCase();
            return action === 'WARNED' || action === 'WARN';
        }).length;
        const blocked = filteredLogs.filter((l: any) => {
            const action = l?.action?.toUpperCase();
            return action === 'BLOCKED' || action === 'BLOCK';
        }).length + filteredBlocks.length;

        return {
            approved,
            rejected,
            suspended,
            deleted,
            warned,
            blocked,
            total: approved + rejected + suspended + deleted + warned + blocked,
        };
    }, [data, blocksData, month, year]);

    return {
        actionStats,
        loading: loading || blocksLoading,
    };
}

/**
 * Hook to delete a moderation log entry
 */
export function useDeleteModerationLog() {
    const { t } = useTranslate('moderation-dashboard');

    const [deleteModerationLog, { loading }] = useMutation<
        DeleteModerationLogMutation,
        DeleteModerationLogMutationVariables
    >(DeleteModerationLogDocument);

    const execute = useCallback(
        async (id: string) => {
            try {
                const result = await deleteModerationLog({
                    variables: { filter: { id } },
                });

                if (result.data?.deleteModerationLog?.success) {
                    toast.success(t('entry-deleted-successfully'));
                    return { success: true };
                }
                else {
                    const message = result.data?.deleteModerationLog?.message || t('failed-to-delete-entry');
                    toast.error(message);
                    throw new Error(message);
                }
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : t('failed-to-delete-entry');
                toast.error(errorMessage);
                throw error;
            }
        },
        [deleteModerationLog, t],
    );

    return {
        deleteModerationLog: execute,
        loading,
    };
}

/**
 * Hook to fetch pending age verification count
 * Optimized: only fetches user count with ageVerify populated, filters client-side
 */
export function usePendingAgeVerificationCount() {
    const { data, loading } = useQuery<getUsersQuery, getUsersQueryVariables>(
        getUsersDocument,
        {
            variables: {
                filter: undefined,
                options: {
                    limit: 1000, // Reasonable limit for counting
                    sort: { createdAt: -1 },
                    populate: ['ageVerify'],
                },
            },
            fetchPolicy: 'cache-and-network',
            pollInterval: 30000, // Poll every 30 seconds for real-time updates
        },
    );

    const pendingCount = useMemo(() => {
        const users = data?.getUsers?.result?.docs || [];
        return users.filter(user => user?.ageVerify?.status === 'PENDING').length;
    }, [data]);

    return {
        pendingCount,
        loading,
    };
}

/**
 * Hook to fetch total moderated count (age verification)
 * Returns total number of age verifications that have been approved or rejected
 */
export function useTotalModeratedCount() {
    const { data, loading } = useQuery<getUsersQuery, getUsersQueryVariables>(
        getUsersDocument,
        {
            variables: {
                filter: undefined,
                options: {
                    limit: 1000,
                    sort: { createdAt: -1 },
                    populate: ['ageVerify'],
                },
            },
            fetchPolicy: 'cache-and-network',
            pollInterval: 60000, // Poll every minute
        },
    );

    const totalCount = useMemo(() => {
        const users = data?.getUsers?.result?.docs || [];
        // Count users with age verification that has been moderated (approved or rejected)
        return users.filter(user =>
            user?.ageVerify?.status === 'APPROVED' || user?.ageVerify?.status === 'REJECTED',
        ).length;
    }, [data]);

    return {
        totalCount,
        loading,
    };
}
