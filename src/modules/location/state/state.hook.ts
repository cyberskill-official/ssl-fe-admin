import { useQuery } from '@cyberskill/shared/react/apollo-client';

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
    const { data, loading, refetch } = useQuery<
        getStatesQuery,
        getStatesQueryVariables
    >(getStatesDocument, {
        variables: { filter, options },
        fetchPolicy: 'network-only',
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
