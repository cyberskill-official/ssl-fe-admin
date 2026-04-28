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
    moderateImageMutation,
    moderateImageMutationVariables,
    moderateTextMutation,
    moderateTextMutationVariables,
    moderateVideoMutation,
    moderateVideoMutationVariables,
    T_ModerationLog,
    updateModerationLogMutation,
    updateModerationLogMutationVariables,
} from '#shared/graphql';

import {
    createModerationLogDocument,
    deleteModerationLogDocument,
    getModerationLogDocument,
    getModerationLogsDocument,
    moderateImageDocument,
    moderateTextDocument,
    moderateVideoDocument,
    updateModerationLogDocument,
} from '#shared/graphql';

import type { I_MediaModerationResult, I_TextModerationResult } from './ai.type';

export function useModerateText() {
    const [moderateTextMutation, { loading }] = useMutation<moderateTextMutation, moderateTextMutationVariables>(
        moderateTextDocument,
        {
            onCompleted: (data) => {
                const { success, message } = data.moderateText;
                if (success) {
                    toast.success('Text moderation completed successfully');
                }
                else {
                    toast.error(message || 'Text moderation failed');
                }
            },
            onError: (error) => {
                toast.error(error.message);
            },
        },
    );

    const moderateText = useCallback(async (text: string): Promise<I_TextModerationResult | null> => {
        try {
            const result = await moderateTextMutation({
                variables: { text },
            });

            if (result.data?.moderateText?.success && result.data.moderateText.result) {
                return result.data.moderateText.result as I_TextModerationResult;
            }
            return null;
        }
        catch (error) {
            console.error('Text moderation error:', error);
            return null;
        }
    }, [moderateTextMutation]);

    return {
        moderateText,
        loading,
    };
}

export function useModerateImage() {
    const [moderateImageMutation, { loading }] = useMutation<moderateImageMutation, moderateImageMutationVariables>(
        moderateImageDocument,
        {
            onCompleted: (data) => {
                const { success, message } = data.moderateImage;
                if (success) {
                    toast.success('Image moderation completed successfully');
                }
                else {
                    toast.error(message || 'Image moderation failed');
                }
            },
            onError: (error) => {
                toast.error(error.message);
            },
        },
    );

    const moderateImage = useCallback(async (imageUrl: string): Promise<I_MediaModerationResult | null> => {
        try {
            const result = await moderateImageMutation({
                variables: { imageUrl },
            });

            if (result.data?.moderateImage?.success && result.data.moderateImage.result) {
                return result.data.moderateImage.result as I_MediaModerationResult;
            }
            return null;
        }
        catch (error) {
            console.error('Image moderation error:', error);
            return null;
        }
    }, [moderateImageMutation]);

    return {
        moderateImage,
        loading,
    };
}

export function useModerateVideo() {
    const [moderateVideoMutation, { loading }] = useMutation<moderateVideoMutation, moderateVideoMutationVariables>(
        moderateVideoDocument,
        {
            onCompleted: (data) => {
                const { success, message } = data.moderateVideo;
                if (success) {
                    toast.success('Video moderation completed successfully');
                }
                else {
                    toast.error(message || 'Video moderation failed');
                }
            },
            onError: (error) => {
                toast.error(error.message);
            },
        },
    );

    const moderateVideo = useCallback(async (videoUrl: string): Promise<I_MediaModerationResult | null> => {
        try {
            const result = await moderateVideoMutation({
                variables: { videoUrl },
            });

            if (result.data?.moderateVideo?.success && result.data.moderateVideo.result) {
                return result.data.moderateVideo.result as I_MediaModerationResult;
            }
            return null;
        }
        catch (error) {
            console.error('Video moderation error:', error);
            return null;
        }
    }, [moderateVideoMutation]);

    return {
        moderateVideo,
        loading,
    };
}// Combined hook for convenience
export function useAIModeration() {
    const textModeration = useModerateText();
    const imageModeration = useModerateImage();
    const videoModeration = useModerateVideo();

    return {
        text: textModeration,
        image: imageModeration,
        video: videoModeration,
        loading: textModeration.loading || imageModeration.loading || videoModeration.loading,
    };
}

// Enhanced AI moderation with logging integration
export function useAIModerationWithLogging() {
    const { text, image, video } = useAIModeration();

    const moderateWithLogging = useCallback(async (
        type: 'text' | 'image' | 'video',
        content: string,
        userId?: string,
        mediaId?: string,
    ) => {
        let result = null;

        try {
            switch (type) {
                case 'text':
                    result = await text.moderateText(content);
                    break;
                case 'image':
                    result = await image.moderateImage(content);
                    break;
                case 'video':
                    result = await video.moderateVideo(content);
                    break;
            }

            // Log the AI moderation action
            if (result) {
                const logData = {
                    action: 'AI_MODERATION' as any, // This should be added to E_ModerationLogAction
                    userId,
                    moderationMediaId: mediaId,
                    aiResult: result,
                    type,
                    content: type === 'text' ? content : `${type.toUpperCase()} content`,
                };

                console.warn('AI Moderation completed:', logData);
                // Here you would call the moderation log API
                // await createModerationLog(logData);
            }

            return result;
        }
        catch (error) {
            console.error(`${type} moderation with logging failed:`, error);
            return null;
        }
    }, [text, image, video]);

    return {
        moderateWithLogging,
        loading: text.loading || image.loading || video.loading,
    };
}

// Hook for batch AI moderation
export function useBatchAIModeration() {
    const aiModeration = useAIModerationWithLogging();

    const moderateBatch = useCallback(async (
        items: Array<{
            type: 'text' | 'image' | 'video';
            content: string;
            userId?: string;
            mediaId?: string;
        }>,
    ) => {
        const results = [];

        for (const item of items) {
            const result = await aiModeration.moderateWithLogging(
                item.type,
                item.content,
                item.userId,
                item.mediaId,
            );
            results.push({ ...item, result });
        }

        return results;
    }, [aiModeration]);

    return {
        moderateBatch,
        loading: aiModeration.loading,
    };
}

// Hook to get moderation logs
export function useGetModerationLogs(
    filter?: getModerationLogsQueryVariables['filter'],
    options?: getModerationLogsQueryVariables['options'],
    skip?: boolean,
) {
    const { data, loading, refetch, error } = useQuery<getModerationLogsQuery, getModerationLogsQueryVariables>(
        getModerationLogsDocument,
        {
            variables: { filter, options },
            fetchPolicy: 'network-only',
            notifyOnNetworkStatusChange: true,
            skip: skip || false,
        },
    );

    const logs: T_ModerationLog[] = data?.getModerationLogs?.result?.docs?.filter(
        (d): d is T_ModerationLog => d !== null && d !== undefined,
    ) || [];

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
        error,
        refetch,
    };
}

// Hook to get single moderation log
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

    const log = data?.getModerationLog?.result || null;

    return { log, loading, refetch };
}

// Hook to create moderation log
export function useCreateModerationLog() {
    const [createLog, { loading }] = useMutation<createModerationLogMutation, createModerationLogMutationVariables>(
        createModerationLogDocument,
        {
            onCompleted: (data) => {
                const { success, message } = data.createModerationLog;
                if (success) {
                    toast.success('Moderation log created successfully');
                }
                else {
                    toast.error(message || 'Failed to create moderation log');
                }
            },
            onError: (error) => {
                toast.error(error.message);
            },
        },
    );

    const execute = useCallback((doc: createModerationLogMutationVariables['doc']) => {
        return createLog({
            variables: { doc },
        });
    }, [createLog]);

    return { createModerationLog: execute, loading };
}

// Hook to update moderation log
export function useUpdateModerationLog() {
    const [updateLog, { loading }] = useMutation<updateModerationLogMutation, updateModerationLogMutationVariables>(
        updateModerationLogDocument,
        {
            onCompleted: (data) => {
                const { success, message } = data.updateModerationLog;
                if (success) {
                    toast.success('Moderation log updated successfully');
                }
                else {
                    toast.error(message || 'Failed to update moderation log');
                }
            },
            onError: (error) => {
                toast.error(error.message);
            },
        },
    );

    const execute = useCallback((
        filter: updateModerationLogMutationVariables['filter'],
        update: updateModerationLogMutationVariables['update'],
        options?: updateModerationLogMutationVariables['options'],
    ) => {
        return updateLog({
            variables: { filter, update, options },
        });
    }, [updateLog]);

    return { updateModerationLog: execute, loading };
}

// Hook to delete moderation log
export function useDeleteModerationLog() {
    const [deleteLog, { loading }] = useMutation<deleteModerationLogMutation, deleteModerationLogMutationVariables>(
        deleteModerationLogDocument,
        {
            onCompleted: (data) => {
                const { success, message } = data.deleteModerationLog;
                if (success) {
                    toast.success('Moderation log deleted successfully');
                }
                else {
                    toast.error(message || 'Failed to delete moderation log');
                }
            },
            onError: (error) => {
                toast.error(error.message);
            },
        },
    );

    const execute = useCallback((
        filter: deleteModerationLogMutationVariables['filter'],
        options?: deleteModerationLogMutationVariables['options'],
    ) => {
        return deleteLog({
            variables: { filter, options },
        });
    }, [deleteLog]);

    return { deleteModerationLog: execute, loading };
}
