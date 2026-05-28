import { useQuery } from '@cyberskill/shared/react/apollo-client';
import { useMemo } from 'react';

import type {
    getStateQuery,
    getStateQueryVariables,
    getStatesQuery,
    getStatesQueryVariables,
} from '#shared/graphql';

import { getStateDocument, getStatesDocument } from '#shared/graphql';

export function useGetStates(
    filter?: getStatesQueryVariables['filter'],
    options?: getStatesQueryVariables['options'],
) {
    const serializedFilter = JSON.stringify(filter);
    const serializedOptions = JSON.stringify(options);

    const memoizedFilter = useMemo(() => {
        return serializedFilter ? JSON.parse(serializedFilter) : undefined;
    }, [serializedFilter]);

    const memoizedOptions = useMemo(() => {
        return serializedOptions ? JSON.parse(serializedOptions) : undefined;
    }, [serializedOptions]);

    const { data, loading, refetch } = useQuery<
        getStatesQuery,
        getStatesQueryVariables
    >(getStatesDocument, {
        variables: { filter: memoizedFilter, options: memoizedOptions },
        fetchPolicy: 'cache-first',
    });
    const states = data?.getStates?.result?.docs || [];

    return { states, loading, refetch };
}

export function useGetStateByCoordinates(
    latitude?: number,
    longitude?: number,
) {
    const { data, loading } = useQuery<getStateQuery, getStateQueryVariables>(
        getStateDocument,
        {
            variables: {
                filter: {
                    isDel: false,
                    latitude: latitude?.toString(),
                    longitude: longitude?.toString(),
                },
            },
        },
    );

    const state = data?.getState?.result || null;

    return { state, loading };
}
