import { useMutation, useQuery } from '@cyberskill/shared/react/apollo-client';
import { toast } from '@cyberskill/shared/react/toast';
import { useCallback } from 'react';

import type {
    adminReplyGuestMutation,
    adminReplyGuestMutationVariables,
    ArchiveConversationMutation,
    ArchiveConversationMutationVariables,
    createMessageMutation,
    createMessageMutationVariables,
    getConversationQuery,
    getConversationQueryVariables,
    getConversationsQuery,
    getConversationsQueryVariables,
    getMessagesQuery,
    getMessagesQueryVariables,
    MarkConversationAsReadMutation,
    MarkConversationAsReadMutationVariables,
    ResolveConversationMutation,
    ResolveConversationMutationVariables,
    T_Conversation,
    T_Message,
    UpdateConversationStatusMutation,
    UpdateConversationStatusMutationVariables,
} from '#shared/graphql';

import {
    adminReplyGuestDocument,
    ArchiveConversationDocument,
    createMessageDocument,
    E_ConversationType,
    getConversationDocument,
    getConversationsDocument,
    getMessagesDocument,
    MarkConversationAsReadDocument,
    ResolveConversationDocument,
    UpdateConversationStatusDocument,
} from '#shared/graphql';
import { useTranslate } from '#shared/i18n';

export function useGetConversations(
    filter?: getConversationsQueryVariables['filter'],
    options?: getConversationsQueryVariables['options'],
) {
    const { data, loading, refetch } = useQuery<
        getConversationsQuery,
        getConversationsQueryVariables
    >(getConversationsDocument, {
        variables: { filter, options },
        fetchPolicy: 'network-only',
    });

    const conversations: T_Conversation[]
        = data?.getConversations?.result?.docs?.filter(
            (d): d is T_Conversation => d !== null && d !== undefined,
        ) || [];

    const totalDocs = data?.getConversations?.result?.totalDocs || 0;
    const totalPages = data?.getConversations?.result?.totalPages || 1;
    const hasNextPage = data?.getConversations?.result?.hasNextPage || false;
    const hasPrevPage = data?.getConversations?.result?.hasPrevPage || false;
    const page = data?.getConversations?.result?.page || 1;
    const limit = data?.getConversations?.result?.limit || 10;

    return {
        conversations,
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

export function useGetSupportConversations(options?: getConversationsQueryVariables['options']) {
    const { data, loading, refetch } = useQuery<getConversationsQuery, getConversationsQueryVariables>(
        getConversationsDocument,
        {
            variables: { options, filter: { type: E_ConversationType.ADMIN_BROADCAST } },
            fetchPolicy: 'network-only',
        },
    );

    const conversations: T_Conversation[]
        = data?.getConversations?.result?.docs?.filter(
            (d: T_Conversation | null | undefined): d is T_Conversation => d !== null && d !== undefined,
        ) || [];

    const totalDocs = data?.getConversations?.result?.totalDocs ?? 0;
    const totalPages = data?.getConversations?.result?.totalPages ?? 1;
    const hasNextPage = data?.getConversations?.result?.hasNextPage ?? false;
    const hasPrevPage = data?.getConversations?.result?.hasPrevPage ?? false;
    const page = data?.getConversations?.result?.page ?? 1;
    const limit = data?.getConversations?.result?.limit ?? 10;

    return {
        conversations,
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

export function useGetConversation(
    filter: getConversationQueryVariables['filter'],
    projection?: getConversationQueryVariables['projection'],
    options?: getConversationQueryVariables['options'],
    populate?: getConversationQueryVariables['populate'],
) {
    const { data, loading, refetch } = useQuery<getConversationQuery, getConversationQueryVariables>(
        getConversationDocument,
        {
            variables: { filter, projection, options, populate },
            fetchPolicy: 'network-only',
        },
    );

    const conversation = data?.getConversation?.result || null;

    return { conversation, loading, refetch };
}

export function useGetMessages(
    filter?: getMessagesQueryVariables['filter'],
    options?: getMessagesQueryVariables['options'],
) {
    const mergedOptions = {
        ...options,
        populate: ['sender', 'parent'],
    };

    const { data, loading, refetch } = useQuery<
        getMessagesQuery,
        getMessagesQueryVariables
    >(getMessagesDocument, {
        variables: { filter, options: mergedOptions },
        fetchPolicy: 'network-only',
    });

    const messages: T_Message[]
        = data?.getMessages?.result?.docs?.filter(
            (d): d is T_Message => d !== null && d !== undefined,
        ) || [];

    const totalDocs = data?.getMessages?.result?.totalDocs || 0;
    const totalPages = data?.getMessages?.result?.totalPages || 1;
    const hasNextPage = data?.getMessages?.result?.hasNextPage || false;
    const hasPrevPage = data?.getMessages?.result?.hasPrevPage || false;
    const page = data?.getMessages?.result?.page || 1;
    const limit = data?.getMessages?.result?.limit || 10;

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

export function useAdminReplyGuest() {
    const { t } = useTranslate('message');
    const [adminReplyGuest, { loading }] = useMutation<adminReplyGuestMutation, adminReplyGuestMutationVariables>(
        adminReplyGuestDocument,
        {
            onCompleted: (data) => {
                const { success, message } = data.adminReplyGuest;
                if (success) {
                    toast.success(t('reply-sent') || 'Reply sent successfully');
                }
                else {
                    toast.error(message || t('error-send') || 'Error sending reply');
                }
            },
            onError: (error) => {
                toast.error(error.message);
            },
        },
    );

    const execute = useCallback((input: adminReplyGuestMutationVariables['input']) => {
        return adminReplyGuest({
            variables: { input },
        });
    }, [adminReplyGuest]);

    return { adminReplyGuest: execute, loading };
}

export function useCreateMessage() {
    const { t } = useTranslate('message');
    const [createMessage, { loading }] = useMutation<createMessageMutation, createMessageMutationVariables>(
        createMessageDocument,
        {
            onCompleted: (data) => {
                const { success, message } = data.createMessage;
                if (success) {
                    toast.success(t('message-sent') || 'Message sent successfully');
                }
                else {
                    toast.error(message || t('error-send') || 'Error sending message');
                }
            },
            onError: (error) => {
                toast.error(error.message);
            },
        },
    );

    const execute = useCallback((messageData: createMessageMutationVariables['doc']) => {
        return createMessage({
            variables: { doc: messageData },
        });
    }, [createMessage]);

    return { createMessage: execute, loading };
}

export function useUpdateConversationStatus() {
    const { t } = useTranslate('message');
    const [updateStatus, { loading }] = useMutation<UpdateConversationStatusMutation, UpdateConversationStatusMutationVariables>(
        UpdateConversationStatusDocument,
        {
            refetchQueries: ['getConversations', 'getConversation'],
            awaitRefetchQueries: true,
            onCompleted: (data) => {
                const { success, message } = data.updateConversationStatus;
                if (success) {
                    toast.success(t('status-updated') || 'Status updated successfully');
                }
                else {
                    toast.error(message || t('error-update') || 'Error updating status');
                }
            },
            onError: (error) => {
                toast.error(error.message);
            },
        },
    );

    const execute = useCallback((conversationId: string, status?: any, category?: any, notes?: string) => {
        return updateStatus({
            variables: { conversationId, status, category, notes },
        });
    }, [updateStatus]);

    return { updateStatus: execute, loading };
}

export function useMarkConversationAsRead() {
    const [markAsRead, { loading }] = useMutation<MarkConversationAsReadMutation, MarkConversationAsReadMutationVariables>(
        MarkConversationAsReadDocument,
        {
            onError: (error) => {
                toast.error(error.message);
            },
        },
    );

    const execute = useCallback((conversationId: string) => {
        return markAsRead({
            variables: { conversationId },
        });
    }, [markAsRead]);

    return { markAsRead: execute, loading };
}

export function useResolveConversation() {
    const { t } = useTranslate('message');
    const [resolve, { loading }] = useMutation<ResolveConversationMutation, ResolveConversationMutationVariables>(
        ResolveConversationDocument,
        {
            refetchQueries: ['getConversations', 'getConversation'],
            awaitRefetchQueries: true,
            onCompleted: (data) => {
                const { success, message } = data.resolveConversation;
                if (success) {
                    toast.success(t('conversation-resolved') || 'Conversation resolved');
                }
                else {
                    toast.error(message || t('error-resolve') || 'Error resolving conversation');
                }
            },
            onError: (error) => {
                toast.error(error.message);
            },
        },
    );

    const execute = useCallback((conversationId: string, notes?: string) => {
        return resolve({
            variables: { conversationId, notes },
        });
    }, [resolve]);

    return { resolve: execute, loading };
}

export function useArchiveConversation() {
    const { t } = useTranslate('message');
    const [archive, { loading }] = useMutation<ArchiveConversationMutation, ArchiveConversationMutationVariables>(
        ArchiveConversationDocument,
        {
            refetchQueries: ['getConversations', 'getConversation'],
            awaitRefetchQueries: true,
            onCompleted: (data) => {
                const { success, message } = data.archiveConversation;
                if (success) {
                    toast.success(t('conversation-archived') || 'Conversation archived');
                }
                else {
                    toast.error(message || t('error-archive') || 'Error archiving conversation');
                }
            },
            onError: (error) => {
                toast.error(error.message);
            },
        },
    );

    const execute = useCallback((conversationId: string) => {
        return archive({
            variables: { conversationId },
        });
    }, [archive]);

    return { archive: execute, loading };
}
