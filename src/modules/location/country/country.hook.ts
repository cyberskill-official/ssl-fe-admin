import { useQuery } from '@cyberskill/shared/react/apollo-client';

import type { getCountriesQuery, getCountriesQueryVariables } from '#shared/graphql';

import { getCountriesDocument } from '#shared/graphql';

export function useGetCountries(
    filter?: getCountriesQueryVariables['filter'],
    options?: getCountriesQueryVariables['options'],
) {
    const { data, loading, refetch } = useQuery<getCountriesQuery, getCountriesQueryVariables>(
        getCountriesDocument,
        {
            variables: { filter, options },
            fetchPolicy: 'network-only',
        },
    );
    const countries = data?.getCountries?.result?.docs || [];

    return { countries, loading, refetch };
}
