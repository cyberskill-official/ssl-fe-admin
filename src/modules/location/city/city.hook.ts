import { useQuery } from '@cyberskill/shared/react/apollo-client';

import type { getCitiesQuery, getCitiesQueryVariables } from '#shared/graphql';

import { getCitiesDocument } from '#shared/graphql';

export function useGetCities(
    filter?: getCitiesQueryVariables['filter'],
    options?: getCitiesQueryVariables['options'] & { skip?: boolean },
) {
    const { data, loading, refetch } = useQuery<getCitiesQuery, getCitiesQueryVariables>(
        getCitiesDocument,
        {
            variables: { filter, options },
            fetchPolicy: 'network-only',
            skip: options?.skip || !filter,
        },
    );
    const cities = data?.getCities?.result?.docs || [];

    return { cities, loading, refetch };
}
