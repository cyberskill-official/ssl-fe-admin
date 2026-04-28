import { createContext, use, useMemo } from 'react';

import { useGetSupportConversations } from '#modules/message/message.hook';
import { useGetModerationMedias } from '#modules/moderation/media/media.hook';
import { useGetUsers } from '#modules/user/user.hook';
import { E_AgeVerifyStatus, E_ConversationStatus, E_ModerationMediaStatus } from '#shared/graphql';

interface I_PendingCounts {
    ageVerification: number;
    media: number;
    messages: number;
}

interface I_PendingCountContext {
    counts: I_PendingCounts;
    refetch: () => void;
}

const PendingCountContext = createContext<I_PendingCountContext | null>(null);

export function PendingCountProvider({ children }: { children: React.ReactNode }) {
    // Server-side filter: only count PENDING age verifications via totalDocs
    const { totalDocs: pendingAgeCount, refetch: refetchAge } = useGetUsers(
        { ageVerify: { status: E_AgeVerifyStatus.PENDING } },
        { limit: 1 },
    );

    // Server-side filter already applied, use totalDocs instead of fetching all docs
    const { totalDocs: pendingMediaCount, refetch: refetchMedia } = useGetModerationMedias(
        { status: E_ModerationMediaStatus.PENDING },
        { limit: 1 },
    );

    // No server-side status filter available for conversations, keep client-side
    const { conversations, refetch: refetchConversations } = useGetSupportConversations({
        limit: 1000,
        sort: { updatedAt: -1 },
    });

    const counts = useMemo(() => {
        const newMessages = conversations.filter(
            conv => conv.status === E_ConversationStatus.NEW,
        ).length;

        return {
            ageVerification: pendingAgeCount,
            media: pendingMediaCount,
            messages: newMessages,
        };
    }, [pendingAgeCount, pendingMediaCount, conversations]);

    const refetch = useMemo(() => () => {
        refetchAge();
        refetchMedia();
        refetchConversations();
    }, [refetchAge, refetchMedia, refetchConversations]);

    const contextValue = useMemo(() => ({ counts, refetch }), [counts, refetch]);

    return (
        <PendingCountContext value={contextValue}>
            {children}
        </PendingCountContext>
    );
}

export function usePendingCounts() {
    const context = use(PendingCountContext);
    if (!context) {
        return {
            counts: {
                ageVerification: 0,
                media: 0,
                messages: 0,
            },
            refetch: () => {},
        };
    }
    return context;
}
