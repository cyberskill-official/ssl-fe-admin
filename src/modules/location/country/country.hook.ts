import { useQuery } from '@cyberskill/shared/react/apollo-client';
import { useMemo } from 'react';

import type { getCountriesQuery, getCountriesQueryVariables } from '#shared/graphql';

import { getCountriesDocument } from '#shared/graphql';

export function useGetCountries(
    filter?: getCountriesQueryVariables['filter'],
    options?: getCountriesQueryVariables['options'],
) {
    const serializedFilter = JSON.stringify(filter);
    const serializedOptions = JSON.stringify(options);

    const memoizedFilter = useMemo(() => {
        return serializedFilter ? JSON.parse(serializedFilter) : undefined;
    }, [serializedFilter]);

    const memoizedOptions = useMemo(() => {
        return serializedOptions ? JSON.parse(serializedOptions) : undefined;
    }, [serializedOptions]);

    const { data, loading, refetch } = useQuery<getCountriesQuery, getCountriesQueryVariables>(
        getCountriesDocument,
        {
            variables: { filter: memoizedFilter, options: memoizedOptions },
            fetchPolicy: 'cache-first',
        },
    );
    const countries = data?.getCountries?.result?.docs || [];

    return { countries, loading, refetch };
}
