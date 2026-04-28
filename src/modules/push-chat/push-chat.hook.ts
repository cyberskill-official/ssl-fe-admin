import { useMutation, useQuery } from '@cyberskill/shared/react/apollo-client';
import { toast } from '@cyberskill/shared/react/toast';
import { useCallback } from 'react';

import type {
    deletePushChatMessageMutation,
    deletePushChatMessageMutationVariables,
    getPushChatMessageQuery,
    getPushChatMessageQueryVariables,
    getPushChatMessagesQuery,
    getPushChatMessagesQueryVariables,
    getPushChatStatsQuery,
    sendPushChatMutation,
    sendPushChatMutationVariables,
    T_PushChatMessage,
} from '#shared/graphql';

import {
    deletePushChatMessageDocument,
    getPushChatMessageDocument,
    getPushChatMessagesDocument,
    getPushChatStatsDocument,
    sendPushChatDocument,
} from '#shared/graphql';
import { useTranslate } from '#shared/i18n';

export function useGetPushChatMessage(
    filter: getPushChatMessageQueryVariables['filter'],
    projection?: getPushChatMessageQueryVariables['projection'],
    options?: getPushChatMessageQueryVariables['options'],
    populate?: getPushChatMessageQueryVariables['populate'],
) {
    const { data, loading, refetch } = useQuery<getPushChatMessageQuery, getPushChatMessageQueryVariables>(
        getPushChatMessageDocument,
        {
            variables: { filter, projection, options, populate },
            fetchPolicy: 'network-only',
        },
    );

    const message = data?.getPushChatMessage?.result || null;

    return { message, loading, refetch };
}

export function useGetPushChatMessages(
    filter?: getPushChatMessagesQueryVariables['filter'],
    options?: getPushChatMessagesQueryVariables['options'],
) {
    const { data, loading, refetch } = useQuery<
        getPushChatMessagesQuery,
        getPushChatMessagesQueryVariables
    >(getPushChatMessagesDocument, {
        variables: { filter, options },
        fetchPolicy: 'network-only',
    });

    const messages: T_PushChatMessage[]
        = data?.getPushChatMessages?.result?.docs?.filter(
            (m): m is T_PushChatMessage => m !== null && m !== undefined,
        ) || [];

    const totalDocs = data?.getPushChatMessages?.result?.totalDocs || 0;
    const totalPages = data?.getPushChatMessages?.result?.totalPages || 1;
    const hasNextPage = data?.getPushChatMessages?.result?.hasNextPage || false;
    const hasPrevPage = data?.getPushChatMessages?.result?.hasPrevPage || false;
    const page = data?.getPushChatMessages?.result?.page || 1;
    const limit = data?.getPushChatMessages?.result?.limit || 10;

    return {
        messages,
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

export function useGetPushChatStats() {
    const { data, loading, refetch } = useQuery<getPushChatStatsQuery>(
        getPushChatStatsDocument,
        {
            fetchPolicy: 'network-only',
        },
    );

    const stats = data?.getPushChatStats?.result || null;

    return { stats, loading, refetch };
}

export function useSendPushChat() {
    const { t } = useTranslate('push-chat');
    const [sendPushChat, { loading }] = useMutation<sendPushChatMutation, sendPushChatMutationVariables>(
        sendPushChatDocument,
        {
            onCompleted: (data) => {
                const { success, message } = data.sendPushChat;
                if (success) {
                    toast.success(t('success-send') || 'Message sent successfully');
                }
                else {
                    toast.error(message || t('error-send') || 'Failed to send message');
                }
            },
            onError: (error) => {
                toast.error(error.message);
            },
        },
    );

    const execute = useCallback((messageData: sendPushChatMutationVariables['doc']) => {
        return sendPushChat({
            variables: { doc: messageData },
        });
    }, [sendPushChat]);

    return { sendPushChat: execute, loading };
}

export function useDeletePushChatMessage() {
    const { t } = useTranslate('push-chat');
    const [deletePushChatMessage, { loading }] = useMutation<deletePushChatMessageMutation, deletePushChatMessageMutationVariables>(
        deletePushChatMessageDocument,
        {
            onCompleted: (data) => {
                const { success, message } = data.deletePushChatMessage;
                if (success) {
                    toast.success(t('success-delete') || 'Message deleted successfully');
                }
                else {
                    toast.error(message || t('error-delete') || 'Failed to delete message');
                }
            },
            onError: (error) => {
                toast.error(error.message);
            },
        },
    );

    const execute = useCallback((filter: deletePushChatMessageMutationVariables['filter']) => {
        return deletePushChatMessage({
            variables: {
                filter,
                options: {},
            },
        });
    }, [deletePushChatMessage]);

    return { deletePushChatMessage: execute, loading };
}
