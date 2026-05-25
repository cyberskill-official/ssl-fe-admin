import { useQuery } from '@cyberskill/shared/react/apollo-client';
import { createContext, use, useCallback, useMemo } from 'react';

import type { getAdminPendingCountsQuery, getAdminPendingCountsQueryVariables } from '#shared/graphql';

import { getAdminPendingCountsDocument } from '#shared/graphql';

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
    const { data, refetch: refetchPendingCounts } = useQuery<
        getAdminPendingCountsQuery,
        getAdminPendingCountsQueryVariables
    >(
        getAdminPendingCountsDocument,
        {
            variables: { refresh: false },
            fetchPolicy: 'cache-first',
            nextFetchPolicy: 'cache-first',
            notifyOnNetworkStatusChange: true,
        },
    );

    const counts = useMemo(() => {
        const pendingCounts = data?.getAdminPendingCounts?.result;

        return {
            ageVerification: pendingCounts?.ageVerification ?? 0,
            media: pendingCounts?.media ?? 0,
            messages: pendingCounts?.messages ?? 0,
        };
    }, [data]);

    const refetch = useCallback(() => {
        void refetchPendingCounts({ refresh: true });
    }, [refetchPendingCounts]);

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
