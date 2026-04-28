import { useMutation, useQuery } from '@cyberskill/shared/react/apollo-client';
import { toast } from '@cyberskill/shared/react/toast';
import { useCallback } from 'react';

import type {
    createKeywordMutation,
    createKeywordMutationVariables,
    deleteKeywordMutation,
    deleteKeywordMutationVariables,
    getKeywordsQuery,
    getKeywordsQueryVariables,
    updateKeywordMutation,
    updateKeywordMutationVariables,
} from '#shared/graphql';

import {
    createKeywordDocument,
    deleteKeywordDocument,
    getKeywordsDocument,
    updateKeywordDocument,
} from '#shared/graphql';
import { useTranslate } from '#shared/i18n';

export function useGetKeywords(
    filter?: getKeywordsQueryVariables['filter'],
    options?: getKeywordsQueryVariables['options'],
) {
    const { data, loading, refetch } = useQuery<getKeywordsQuery, getKeywordsQueryVariables>(
        getKeywordsDocument,
        {
            variables: { filter, options },
            fetchPolicy: 'network-only',
        },
    );

    const keywords = data?.getKeywords?.result?.docs || [];
    const totalDocs = data?.getKeywords?.result?.totalDocs || 0;
    const totalPages = data?.getKeywords?.result?.totalPages || 1;
    const hasNextPage = data?.getKeywords?.result?.hasNextPage || false;
    const hasPrevPage = data?.getKeywords?.result?.hasPrevPage || false;
    const page = data?.getKeywords?.result?.page || 1;
    const limit = data?.getKeywords?.result?.limit || 10;

    return {
        keywords,
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

export function useCreateKeyword() {
    const { t } = useTranslate('moderation');
    const [createKeywordMutation, { loading }] = useMutation<createKeywordMutation, createKeywordMutationVariables>(
        createKeywordDocument,
        {
            onCompleted: (response) => {
                const { success, message } = response.createKeyword;
                if (success) {
                    toast.success(t('keyword.success-save'));
                }
                else {
                    toast.error(message || t('keyword.error-save'));
                }
            },
            onError: (error) => {
                toast.error(error.message || t('keyword.error-save'));
            },
        },
    );

    const createKeyword = useCallback((keywordData: createKeywordMutationVariables['doc']) => {
        return createKeywordMutation({ variables: { doc: keywordData } });
    }, [createKeywordMutation]);

    return { createKeyword, loading };
}

export function useUpdateKeyword() {
    const { t } = useTranslate('moderation');
    const [updateKeywordMutation, { loading }] = useMutation<updateKeywordMutation, updateKeywordMutationVariables>(
        updateKeywordDocument,
        {
            onCompleted: (response) => {
                const { success, message } = response.updateKeyword;
                if (success) {
                    toast.success(t('keyword.success-save'));
                }
                else {
                    toast.error(message || t('keyword.error-save'));
                }
            },
            onError: (error) => {
                toast.error(error.message || t('keyword.error-save'));
            },
        },
    );

    const updateKeyword = useCallback((filter: updateKeywordMutationVariables['filter'], updatedKeyword: updateKeywordMutationVariables['update']) => {
        return updateKeywordMutation({ variables: { filter, update: updatedKeyword } });
    }, [updateKeywordMutation]);

    return { updateKeyword, loading };
}

export function useDeleteKeyword() {
    const { t } = useTranslate('moderation');
    const [deleteKeywordMutation, { loading }] = useMutation<deleteKeywordMutation, deleteKeywordMutationVariables>(
        deleteKeywordDocument,
        {
            onCompleted: (response) => {
                const { success, message } = response.deleteKeyword;
                if (success) {
                    toast.success(t('keyword.success-delete'));
                }
                else {
                    toast.error(message || t('keyword.error-delete'));
                }
            },
            onError: (error) => {
                toast.error(error.message || t('keyword.error-delete'));
            },
        },
    );

    const deleteKeyword = useCallback((filter: deleteKeywordMutationVariables['filter']) => {
        return deleteKeywordMutation({ variables: { filter } });
    }, [deleteKeywordMutation]);

    return { deleteKeyword, loading };
}
