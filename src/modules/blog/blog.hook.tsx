import { useLazyQuery, useMutation, useQuery } from '@cyberskill/shared/react/apollo-client';
import { toast } from '@cyberskill/shared/react/toast';
import { useCallback, useEffect } from 'react';

import type {
    createBlogMutation,
    createBlogMutationVariables,
    deleteBlogMutation,
    deleteBlogMutationVariables,
    getBlogQuery,
    getBlogQueryVariables,
    getBlogsQuery,
    getBlogsQueryVariables,
    T_Blog,
    updateBlogMutation,
    updateBlogMutationVariables,
} from '#shared/graphql';

import {
    createBlogDocument,
    deleteBlogDocument,
    getBlogDocument,
    getBlogsDocument,
    updateBlogDocument,
} from '#shared/graphql';
import { useTranslate } from '#shared/i18n';

export function useGetBlog(
    filter: getBlogQueryVariables['filter'],
    projection: getBlogQueryVariables['projection'],
    options: getBlogQueryVariables['options'],
    /* populate?: getBlogQueryVariables['populate'], */
) {
    const { data, loading, error, refetch } = useQuery<getBlogQuery, getBlogQueryVariables>(
        getBlogDocument,
        {
            variables: { filter, projection, options },
            fetchPolicy: 'network-only',
        },
    );

    useEffect(() => {
        if (error) {
            toast.error(error.message || 'Failed to fetch blog');
        }
    }, [error]);

    const blog = data?.getBlog?.result || null;

    return { blog, loading, error, refetch };
}

export function useGetBlogLazy() {
    const [getBlog, { data, loading, error }] = useLazyQuery<getBlogQuery, getBlogQueryVariables>(
        getBlogDocument,
        {
            fetchPolicy: 'network-only',
        },
    );

    useEffect(() => {
        if (error) {
            toast.error(error.message || 'Failed to fetch blog details');
        }
    }, [error]);

    const execute = useCallback((filter: getBlogQueryVariables['filter']) => {
        return getBlog({
            variables: {
                filter,
                options: {
                    populate: ['author', 'language', 'relatedBlogs'],
                },
            },
        });
    }, [getBlog]);

    return { getBlog: execute, blog: data?.getBlog?.result || null, loading, error };
}

export function useGetBlogs(
    filter?: getBlogsQueryVariables['filter'],
    options?: getBlogsQueryVariables['options'],
) {
    // Add populate to include author information
    const mergedOptions = {
        ...options,
        populate: ['author', 'language', 'relatedBlogs'],
    };

    const { data, loading, error, refetch } = useQuery<
        getBlogsQuery,
        getBlogsQueryVariables
    >(getBlogsDocument, {
        variables: { filter, options: mergedOptions },
        fetchPolicy: 'network-only',
    });

    useEffect(() => {
        if (error) {
            toast.error(error.message || 'Failed to fetch blogs');
        }
    }, [error]);

    const blogs: T_Blog[]
        = data?.getBlogs?.result?.docs?.filter(
            (d): d is T_Blog => d !== null && d !== undefined,
        ) || [];

    const totalDocs = data?.getBlogs?.result?.totalDocs || 0;
    const totalPages = data?.getBlogs?.result?.totalPages || 1;
    const hasNextPage = data?.getBlogs?.result?.hasNextPage || false;
    const hasPrevPage = data?.getBlogs?.result?.hasPrevPage || false;
    const page = data?.getBlogs?.result?.page || 1;
    const limit = data?.getBlogs?.result?.limit || 10;

    return {
        blogs,
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

export function useCreateBlog() {
    const { t } = useTranslate('blog');
    const [createBlog, { loading }] = useMutation<createBlogMutation, createBlogMutationVariables>(
        createBlogDocument,
        {
            onCompleted: (data) => {
                const { success, message } = data.createBlog;
                if (success) {
                    toast.success(t('save-blog-post'));
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

    const execute = useCallback((blogData: createBlogMutationVariables['doc']) => {
        return createBlog({
            variables: { doc: blogData },
        });
    }, [createBlog]);

    return { createBlog: execute, loading };
}

export function useUpdateBlog() {
    const { t } = useTranslate('blog');
    const [updateBlog, { loading }] = useMutation<updateBlogMutation, updateBlogMutationVariables>(
        updateBlogDocument,
        {
            onCompleted: (data) => {
                const { success, message } = data.updateBlog;
                if (success) {
                    toast.success(t('update'));
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

    const execute = useCallback((filter: { id: string }, updatedBlog: updateBlogMutationVariables['update']) => {
        return updateBlog({
            variables: {
                filter,
                update: updatedBlog,
                options: {},
            },
        });
    }, [updateBlog]);

    return { updateBlog: execute, loading };
}

export function useDeleteBlog() {
    const { t } = useTranslate('blog');
    const [deleteBlog, { loading }] = useMutation<deleteBlogMutation, deleteBlogMutationVariables>(
        deleteBlogDocument,
        {
            onCompleted: (data) => {
                const { success, message } = data.deleteBlog;
                if (success) {
                    toast.success(t('delete'));
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
        return deleteBlog({
            variables: {
                filter,
                options: {},
            },
        });
    }, [deleteBlog]);

    return { deleteBlog: execute, loading };
}
