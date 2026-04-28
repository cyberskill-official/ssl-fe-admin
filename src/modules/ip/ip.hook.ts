import { useQuery } from '@cyberskill/shared/react/apollo-client';

import type { getIpQuery } from '#shared/graphql';

import { getIpDocument } from '#shared/graphql';

export function useGetIp() {
    const { data, loading, error, refetch } = useQuery<getIpQuery>(
        getIpDocument,
        {
            fetchPolicy: 'network-only',
        },
    );

    const ip = data?.getIp?.result || null;
    const success = data?.getIp?.success || false;
    const message = data?.getIp?.message || '';

    return {
        ip,
        success,
        message,
        loading,
        error,
        refetch,
    };
}
