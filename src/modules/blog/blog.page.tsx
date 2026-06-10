import { FileText } from 'lucide-react';
import { motion } from 'motion/react';
import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { E_SocialPlatform, F_BlogListItemFragment, Input_CreateBlog, Input_UpdateBlog, T_Blog } from '#shared/graphql';

import { ConfirmDialog } from '#shared/component/confirm-dialog';
import { E_BlogCategory, E_BlogType } from '#shared/graphql';
import { createEnumQueryParam, createIntegerQueryParam, createStringQueryParam, useDebouncedQueryValue, useListQueryState } from '#shared/hooks';
import { useTranslate } from '#shared/i18n';
import { usePortal } from '#shared/portal';

import type { I_BlogFormApi } from './blog-form';

import { getBlogFormText, getBlogText } from './blog-text';
import { useCreateBlog, useDeleteBlog, useGetBlogLazy, useGetBlogs, useUpdateBlog } from './blog.hook';
import { BlogList } from './blog.list';

const BlogForm = lazy(() => import('./blog-form').then(module => ({ default: module.BlogForm })));

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;
const BLOG_TYPES = ['ALL', E_BlogType.BLOG, E_BlogType.PODCAST] as const;
const BLOG_CATEGORIES = ['ALL', ...Object.values(E_BlogCategory)] as const;
const BLOG_STATUSES = ['ALL', 'ACTIVE', 'INACTIVE'] as const;
const BLOG_SORTS = ['createdAt-desc', 'createdAt-asc', 'title-asc', 'title-desc', 'category-asc', 'category-desc'] as const;
const VIEW_MODES = ['grid', 'table'] as const;

const BLOG_QUERY_CONFIG = {
    page: createIntegerQueryParam(1),
    pageSize: createIntegerQueryParam(10, { allowedValues: PAGE_SIZE_OPTIONS }),
    q: createStringQueryParam(),
    type: createEnumQueryParam<'ALL' | E_BlogType>('ALL', BLOG_TYPES),
    category: createEnumQueryParam<'ALL' | E_BlogCategory>('ALL', BLOG_CATEGORIES),
    status: createEnumQueryParam('ALL', BLOG_STATUSES),
    sort: createEnumQueryParam('createdAt-desc', BLOG_SORTS),
    view: createEnumQueryParam('grid', VIEW_MODES),
};

export default function BlogPage() {
    const { t } = useTranslate('blog');
    const { setHeader } = usePortal();
    const { state: queryState, setState: setQueryState } = useListQueryState(BLOG_QUERY_CONFIG);
    const { page, pageSize, type: selectedType, category: selectedCategory, status: selectedStatus, view: viewMode } = queryState;
    const [sortField, sortOrder] = queryState.sort.split('-') as ['title' | 'category' | 'createdAt', 'asc' | 'desc'];
    const commitSearch = useCallback((q: string) => {
        setQueryState({ q }, { replace: true, resetPage: true });
    }, [setQueryState]);
    const [search, setSearch] = useDebouncedQueryValue(queryState.q, commitSearch);
    const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
    const [blogToDelete, setBlogToDelete] = useState<F_BlogListItemFragment | null>(null);
    const blogFormApiRef = useRef<I_BlogFormApi | null>(null);
    const [shouldRenderBlogForm, setShouldRenderBlogForm] = useState(false);
    const [pendingFormBlog, setPendingFormBlog] = useState<T_Blog | undefined>();
    const [formOpenVersion, setFormOpenVersion] = useState(0);
    const openedFormVersionRef = useRef(-1);

    useEffect(() => {
        setHeader({
            title: t('title-blog'),
            description: t('blogs-hint') || t('add-blog-description') || 'Manage your blogs',
            icon: FileText,
        });
        return () => setHeader(null);
    }, [setHeader, t]);

    const filter = useMemo(() => {
        const filterObj: {
            category?: E_BlogCategory;
            isActive?: boolean;
            type?: E_BlogType;
        } = {};

        if (selectedCategory !== 'ALL')
            filterObj.category = selectedCategory;

        if (selectedStatus !== 'ALL')
            filterObj.isActive = selectedStatus === 'ACTIVE';

        if (selectedType !== 'ALL')
            filterObj.type = selectedType;

        return filterObj;
    }, [selectedCategory, selectedStatus, selectedType]);

    const options = useMemo(() => ({
        page,
        limit: pageSize,
        sort: { [sortField]: sortOrder === 'desc' ? -1 : 1 },
        search: queryState.q,
        projection: {
            id: 1,
            createdAt: 1,
            title: 1,
            type: 1,
            category: 1,
            featuredImage: 1,
            hostName: 1,
            readCount: 1,
            isActive: 1,
        },
        lean: true,
    }), [page, pageSize, queryState.q, sortField, sortOrder]);

    const { blogs, loading, error, refetch, totalDocs, totalPages, hasNextPage, hasPrevPage } = useGetBlogs(filter, options);
    const { getBlog, loading: fetchingBlog } = useGetBlogLazy();
    const { createBlog, loading: creatingBlog } = useCreateBlog();
    const { updateBlog, loading: updatingBlog } = useUpdateBlog();
    const { deleteBlog } = useDeleteBlog();

    const _setBlogFormApi = useCallback((api: I_BlogFormApi | null) => {
        blogFormApiRef.current = api;
        if (api && shouldRenderBlogForm && openedFormVersionRef.current !== formOpenVersion) {
            openedFormVersionRef.current = formOpenVersion;
            api.open(pendingFormBlog);
        }
    }, [formOpenVersion, pendingFormBlog, shouldRenderBlogForm]);

    const _handleCreateBlog = useCallback(() => {
        setPendingFormBlog(undefined);
        setShouldRenderBlogForm(true);
        setFormOpenVersion(version => version + 1);
    }, []);

    const _handleEditBlog = useCallback(async (blog: F_BlogListItemFragment) => {
        try {
            const { data } = await getBlog({ id: blog.id });
            const fullBlog = data?.getBlog?.result;
            if (!fullBlog)
                return;
            setPendingFormBlog(fullBlog);
            setShouldRenderBlogForm(true);
            setFormOpenVersion(version => version + 1);
        }
        catch (error) {
            console.error('Failed to fetch blog details:', error);
        }
    }, [getBlog]);

    const _handleDeleteBlog = useCallback((blog: F_BlogListItemFragment) => {
        setBlogToDelete(blog);
    }, []);

    const _handleToggleStatus = useCallback(async (blogId: string, currentIsActive: boolean) => {
        const blog = blogs?.find(b => b.id === blogId);
        if (!blog)
            return;
        setUpdatingStatusId(blogId);
        try {
            await updateBlog(
                { id: blogId },
                { isActive: !currentIsActive },
            );
            await refetch();
        }
        finally {
            setUpdatingStatusId(null);
        }
    }, [blogs, updateBlog, refetch]);

    const _handleCreateSubmit = useCallback(async (data: Input_CreateBlog) => {
        // Coerce required string fields
        const safeData = {
            ...data,
            category: data.category ?? E_BlogCategory.TRAVELS,
            type: data.type ?? E_BlogType.BLOG,
            title: getBlogFormText(data.title),
            authorName: getBlogFormText(data.authorName),
            websiteName: getBlogFormText(data.websiteName),
            websiteURL: getBlogFormText(data.websiteURL),
            hostName: getBlogFormText(data.hostName),
            content: getBlogText(data.content),
            contentHeadline: getBlogFormText(data.contentHeadline),
            contentSubHeadline: getBlogFormText(data.contentSubHeadline),
            featuredImage: getBlogFormText(data.featuredImage),
            logo: getBlogFormText(data.logo),
            cover: getBlogFormText(data.cover),
            file: getBlogFormText(data.file),
            socialLinks: Array.isArray(data.socialLinks)
                ? data.socialLinks.filter(l => l && l.type && l.url)
                        .map(l => ({ type: l!.type as E_SocialPlatform, url: getBlogFormText(l!.url) }))
                : [],
        };
        await createBlog(safeData);
        await refetch();
    }, [createBlog, refetch]);

    const _handleUpdateSubmit = useCallback(async (id: string, data: Input_UpdateBlog) => {
        const safeData = {
            ...data,
            category: data.category ?? E_BlogCategory.TRAVELS,
            type: data.type ?? E_BlogType.BLOG,
            title: getBlogFormText(data.title),
            authorName: getBlogFormText(data.authorName),
            websiteName: getBlogFormText(data.websiteName),
            websiteURL: getBlogFormText(data.websiteURL),
            hostName: getBlogFormText(data.hostName),
            content: getBlogText(data.content),
            contentHeadline: getBlogFormText(data.contentHeadline),
            contentSubHeadline: getBlogFormText(data.contentSubHeadline),
            featuredImage: getBlogFormText(data.featuredImage),
            logo: getBlogFormText(data.logo),
            cover: getBlogFormText(data.cover),
            file: getBlogFormText(data.file),
            socialLinks: Array.isArray(data.socialLinks)
                ? data.socialLinks.filter(l => l && l.type && l.url)
                        .map(l => ({ type: l!.type as E_SocialPlatform, url: getBlogFormText(l!.url) }))
                : [],
        };
        await updateBlog({ id }, safeData);
        await refetch();
    }, [updateBlog, refetch]);

    useEffect(() => {
        if (!loading && totalPages > 0 && page > totalPages) {
            // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect
            setQueryState({ page: totalPages }, { replace: true });
        }
    }, [loading, page, setQueryState, totalPages]);

    const _handlePageChange = useCallback((newPage: number) => {
        setQueryState({ page: newPage });
    }, [setQueryState]);

    const _handlePageSizeChange = useCallback((newPageSize: number) => {
        setQueryState({ pageSize: newPageSize }, { resetPage: true });
    }, [setQueryState]);

    const _handleSearchChange = useCallback((value: string) => {
        setSearch(value);
    }, [setSearch]);

    const _handleCategoryChange = useCallback((category: E_BlogCategory | 'ALL') => {
        setQueryState({ category }, { resetPage: true });
    }, [setQueryState]);

    const _handleStatusChange = useCallback((status: 'ACTIVE' | 'INACTIVE' | 'ALL') => {
        setQueryState({ status }, { resetPage: true });
    }, [setQueryState]);

    const _handleSortChange = useCallback((field: 'title' | 'category' | 'createdAt', order: 'asc' | 'desc') => {
        setQueryState({ sort: `${field}-${order}` }, { resetPage: true });
    }, [setQueryState]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 p-6">
                <BlogList
                    error={error}
                    onRetry={() => refetch?.()}
                    blogs={blogs}
                    loading={loading}
                    onEditBlog={_handleEditBlog}
                    onCreateBlog={_handleCreateBlog}
                    onDeleteBlog={_handleDeleteBlog}
                    onToggleStatus={_handleToggleStatus}
                    updatingStatusId={updatingStatusId || undefined}
                    totalDocs={totalDocs}
                    page={page}
                    pageSize={pageSize}
                    onPageChange={_handlePageChange}
                    onPageSizeChange={_handlePageSizeChange}
                    search={search}
                    onSearchChange={_handleSearchChange}
                    selectedCategory={selectedCategory}
                    onCategoryChange={v => _handleCategoryChange(v as any)}
                    selectedStatus={selectedStatus}
                    onStatusChange={v => _handleStatusChange(v as any)}
                    sortField={sortField}
                    sortOrder={sortOrder}
                    onSortChange={(f, o) => _handleSortChange(f as any, o as any)}
                    selectedType={selectedType}
                    onTypeChange={v => setQueryState({ type: v as 'ALL' | E_BlogType }, { resetPage: true })}
                    totalPages={totalPages}
                    hasNextPage={hasNextPage}
                    hasPrevPage={hasPrevPage}
                    viewMode={viewMode}
                    onViewModeChange={view => setQueryState({ view })}
                />
                {shouldRenderBlogForm && (
                    <Suspense fallback={null}>
                        <BlogForm
                            ref={_setBlogFormApi}
                            onCreateSubmit={_handleCreateSubmit}
                            onUpdateSubmit={_handleUpdateSubmit}
                            creating={creatingBlog}
                            updating={updatingBlog}
                            fetching={fetchingBlog}
                        />
                    </Suspense>
                )}
                <ConfirmDialog
                    open={!!blogToDelete}
                    title={t('delete-blog')}
                    description={t('delete-blog-confirm')}
                    onConfirm={async () => {
                        if (blogToDelete) {
                            await deleteBlog({ id: blogToDelete.id ?? '' });
                            setBlogToDelete(null);
                            await refetch();
                        }
                    }}
                    onCancel={() => setBlogToDelete(null)}
                />
            </motion.div>
        </div>
    );
}
