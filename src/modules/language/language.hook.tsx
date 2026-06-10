import { useQuery } from '@cyberskill/shared/react/apollo-client';

import type { getLanguagesQuery, getLanguagesQueryVariables, T_Language } from '#shared/graphql';

import { getLanguagesDocument } from '#shared/graphql';

export function useLanguages(
    filter?: getLanguagesQueryVariables['filter'],
    options?: getLanguagesQueryVariables['options'],
) {
    const { data, loading, error, refetch } = useQuery<getLanguagesQuery, getLanguagesQueryVariables>(
        getLanguagesDocument,
        {
            variables: filter || options ? { filter, options } : undefined,
            fetchPolicy: 'network-only',
        },
    );

    const languages: T_Language[] = data?.getLanguages?.result?.docs?.filter(
        (lang): lang is T_Language => lang !== null && lang !== undefined,
    ) || [];

    const totalDocs = data?.getLanguages?.result?.totalDocs || 0;
    const totalPages = data?.getLanguages?.result?.totalPages || 1;
    const hasNextPage = data?.getLanguages?.result?.hasNextPage || false;
    const hasPrevPage = data?.getLanguages?.result?.hasPrevPage || false;
    const page = data?.getLanguages?.result?.page || 1;
    const limit = data?.getLanguages?.result?.limit || 10;

    return {
        languages,
        totalDocs,
        totalPages,
        hasNextPage,
        hasPrevPage,
        page,
        limit,
        loading,
        error,
        refetch,
    };
}

export function useAllLanguages(options?: { skip?: boolean }) {
    const { data, loading, error, refetch } = useQuery<getLanguagesQuery, getLanguagesQueryVariables>(
        getLanguagesDocument,
        {
            variables: {
                filter: undefined,
                options: { limit: 999999 },
            },
            fetchPolicy: 'network-only',
            skip: options?.skip ?? false,
        },
    );

    const languages: T_Language[] = data?.getLanguages?.result?.docs?.filter(
        (lang): lang is T_Language => lang !== null && lang !== undefined,
    ) || [];

    return {
        languages,
        loading,
        error,
        refetch,
    };
}
