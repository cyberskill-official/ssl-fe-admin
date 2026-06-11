import { useMutation, useQuery } from '@cyberskill/shared/react/apollo-client';
import { toast } from '@cyberskill/shared/react/toast';
import { useCallback } from 'react';

import type {
    createTagMutation,
    createTagMutationVariables,
    deleteTagMutation,
    deleteTagMutationVariables,
    F_TagListItemFragment,
    F_TagOptionFragment,
    getTagOptionsQuery,
    getTagOptionsQueryVariables,
    getTagQuery,
    getTagQueryVariables,
    getTagsQuery,
    getTagsQueryVariables,
    updateTagMutation,
    updateTagMutationVariables,
} from '#shared/graphql';

import {
    createTagDocument,
    deleteTagDocument,
    getTagDocument,
    getTagOptionsDocument,
    getTagsDocument,
    updateTagDocument,
} from '#shared/graphql';
import { useTranslate } from '#shared/i18n';

export function useGetTag(filter: getTagQueryVariables['filter'], projection: getTagQueryVariables['projection'], options: getTagQueryVariables['options'], populate: getTagQueryVariables['populate']) {
    const { data, loading, refetch } = useQuery<getTagQuery, getTagQueryVariables>(
        getTagDocument,
        {
            variables: { filter, projection, options, populate },
            fetchPolicy: 'network-only',
        },
    );

    const tag = data?.getTag?.result || null;

    return { tag, loading, refetch };
}

export function useGetTags(
    filter?: getTagsQueryVariables['filter'],
    options?: getTagsQueryVariables['options'],
) {
    const { data, loading, refetch } = useQuery<
        getTagsQuery,
        getTagsQueryVariables
    >(getTagsDocument, {
        variables: { filter, options },
        fetchPolicy: 'network-only',
    });

    const tags: F_TagListItemFragment[]
        = data?.getTags?.result?.docs?.filter(
            (t): t is F_TagListItemFragment => t !== null && t !== undefined,
        ) || [];

    const totalDocs = data?.getTags?.result?.totalDocs || 0;
    const totalPages = data?.getTags?.result?.totalPages || 1;
    const hasNextPage = data?.getTags?.result?.hasNextPage || false;
    const hasPrevPage = data?.getTags?.result?.hasPrevPage || false;
    const page = data?.getTags?.result?.page || 1;
    const limit = data?.getTags?.result?.limit || 10;

    return {
        tags,
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

export function useGetTagOptions(
    filter?: getTagOptionsQueryVariables['filter'],
    options?: getTagOptionsQueryVariables['options'],
) {
    const { data, loading } = useQuery<getTagOptionsQuery, getTagOptionsQueryVariables>(
        getTagOptionsDocument,
        {
            variables: { filter, options },
            fetchPolicy: 'network-only',
        },
    );

    const tags: F_TagOptionFragment[] = data?.getTags?.result?.docs?.filter(
        (tag): tag is F_TagOptionFragment => tag !== null && tag !== undefined,
    ) || [];

    return { tags, loading };
}

export function useCreateTag() {
    const { t } = useTranslate('tag');
    const [createTag, { loading }] = useMutation<createTagMutation, createTagMutationVariables>(
        createTagDocument,
        {
            onCompleted: (data) => {
                const { success, message } = data.createTag;
                if (success) {
                    toast.success(t('success-save'));
                }
                else {
                    toast.error(message || t('error-save'));
                }
            },
            onError: (error) => {
                toast.error(error.message);
            },
        },
    );

    const execute = useCallback((tagData: createTagMutationVariables['doc']) => {
        return createTag({
            variables: { doc: tagData },
        });
    }, [createTag]);

    return { createTag: execute, loading };
}

export function useUpdateTag() {
    const { t } = useTranslate('tag');
    const [updateTag, { loading }] = useMutation<updateTagMutation, updateTagMutationVariables>(
        updateTagDocument,
        {
            onCompleted: (data) => {
                const { success, message } = data.updateTag;
                if (success) {
                    toast.success(t('success-save'));
                }
                else {
                    toast.error(message || t('error-save'));
                }
            },
            onError: (error) => {
                toast.error(error.message);
            },
        },
    );

    const execute = useCallback((filter: { id: string }, updatedTag: updateTagMutationVariables['update']) => {
        return updateTag({
            variables: {
                filter,
                update: updatedTag,
                options: {},
            },
        });
    }, [updateTag]);

    return { updateTag: execute, loading };
}

export function useDeleteTag() {
    const { t } = useTranslate('tag');
    const [deleteTag, { loading }] = useMutation<deleteTagMutation, deleteTagMutationVariables>(
        deleteTagDocument,
        {
            onCompleted: (data) => {
                const { success, message } = data.deleteTag;
                if (success) {
                    toast.success(t('success-delete'));
                }
                else {
                    toast.error(message || t('error-delete'));
                }
            },
            onError: (error) => {
                toast.error(error.message);
            },
        },
    );

    const execute = useCallback((filter: { id: string }) => {
        return deleteTag({
            variables: {
                filter,
                options: {},
            },
        });
    }, [deleteTag]);

    return { deleteTag: execute, loading };
}
