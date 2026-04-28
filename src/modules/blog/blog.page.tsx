import { FileText } from 'lucide-react';
import { motion } from 'motion/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { E_SocialPlatform, Input_CreateBlog, Input_UpdateBlog, T_Blog } from '#shared/graphql';

import { ConfirmDialog } from '#shared/component/confirm-dialog';
import { E_BlogCategory, E_BlogType } from '#shared/graphql';
import { useTranslate } from '#shared/i18n';
import { usePortal } from '#shared/portal';

import { BlogForm } from './blog-form';
import { useCreateBlog, useDeleteBlog, useGetBlogs, useUpdateBlog } from './blog.hook';
import { BlogList } from './blog.list';

export default function BlogPage() {
    const { t } = useTranslate('blog');
    const { setHeader } = usePortal();
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<E_BlogCategory | 'ALL'>('ALL');
    const [selectedStatus, setSelectedStatus] = useState<'ACTIVE' | 'INACTIVE' | 'ALL'>('ALL');
    const [sortField, setSortField] = useState<'title' | 'category' | 'createdAt'>('createdAt');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [selectedType, setSelectedType] = useState<'ALL' | E_BlogType>('ALL');
    const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
    const [blogToDelete, setBlogToDelete] = useState<T_Blog | null>(null);
    const blogFormRef = useRef<any>(null);

    useEffect(() => {
        setHeader({
            title: t('title-blog'),
            description: t('blogs-hint') || t('add-blog-description') || 'Manage your blogs',
            icon: FileText,
        });
        return () => setHeader(null);
    }, [setHeader, t]);

    const isSearching = search.trim().length > 0;

    const filter = useMemo(() => {
        const filterObj: any = {};

        if (selectedCategory !== 'ALL')
            filterObj.category = selectedCategory;

        if (selectedStatus !== 'ALL')
            filterObj.isActive = selectedStatus === 'ACTIVE';

        if (selectedType !== 'ALL')
            filterObj.type = selectedType;

        return filterObj;
    }, [selectedCategory, selectedStatus, selectedType]);

    const options = useMemo(() => ({
        page: isSearching ? 1 : page,
        limit: isSearching ? 1000 : pageSize,
        sort: { [sortField]: sortOrder === 'desc' ? -1 : 1 },
        populate: ['author'],
    }), [page, pageSize, sortField, sortOrder, isSearching]);

    const { blogs: rawBlogs, refetch, totalDocs: rawTotalDocs } = useGetBlogs(filter, options);

    const filteredBlogs = useMemo(() => {
        if (!isSearching)
            return rawBlogs;
        const searchTerm = search.toLowerCase().trim();
        return rawBlogs.filter((blog: T_Blog) =>
            blog?.title?.toLowerCase().includes(searchTerm)
            || blog?.authorName?.toLowerCase().includes(searchTerm)
            || blog?.hostName?.toLowerCase().includes(searchTerm),
        );
    }, [rawBlogs, search, isSearching]);

    const blogs = useMemo(() => {
        if (!isSearching)
            return filteredBlogs;
        const start = (page - 1) * pageSize;
        return filteredBlogs.slice(start, start + pageSize);
    }, [filteredBlogs, page, pageSize, isSearching]);

    const totalDocs = isSearching ? filteredBlogs.length : rawTotalDocs;
    const { createBlog, loading: creatingBlog } = useCreateBlog();
    const { updateBlog, loading: updatingBlog } = useUpdateBlog();
    const { deleteBlog } = useDeleteBlog();

    const _handleCreateBlog = useCallback(() => {
        blogFormRef.current?.open();
    }, []);

    const _handleEditBlog = useCallback((blog: T_Blog) => {
        blogFormRef.current?.open(blog);
    }, []);

    const _handleDeleteBlog = useCallback((blog: T_Blog) => {
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
            title: data.title ?? '',
            authorName: data.authorName ?? '',
            websiteName: data.websiteName ?? '',
            websiteURL: data.websiteURL ?? '',
            hostName: data.hostName ?? '',
            content: data.content ?? '',
            contentHeadline: data.contentHeadline ?? '',
            contentSubHeadline: data.contentSubHeadline ?? '',
            featuredImage: data.featuredImage ?? '',
            logo: data.logo ?? '',
            cover: data.cover ?? '',
            file: data.file ?? '',
            socialLinks: Array.isArray(data.socialLinks)
                ? data.socialLinks.filter(l => l && l.type && l.url)
                        .map(l => ({ type: l!.type as E_SocialPlatform, url: l!.url || '' }))
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
            title: data.title ?? '',
            authorName: data.authorName ?? '',
            websiteName: data.websiteName ?? '',
            websiteURL: data.websiteURL ?? '',
            hostName: data.hostName ?? '',
            content: data.content ?? '',
            contentHeadline: data.contentHeadline ?? '',
            contentSubHeadline: data.contentSubHeadline ?? '',
            featuredImage: data.featuredImage ?? '',
            logo: data.logo ?? '',
            cover: data.cover ?? '',
            file: data.file ?? '',
            socialLinks: Array.isArray(data.socialLinks)
                ? data.socialLinks.filter(l => l && l.type && l.url)
                        .map(l => ({ type: l!.type as E_SocialPlatform, url: l!.url || '' }))
                : [],
        };
        await updateBlog({ id }, safeData);
        await refetch();
    }, [updateBlog, refetch]);

    const _handlePageChange = useCallback((newPage: number) => {
        setPage(newPage);
    }, []);

    const _handlePageSizeChange = useCallback((newPageSize: number) => {
        setPageSize(newPageSize);
        setPage(1);
    }, []);

    const _handleSearchChange = useCallback((value: string) => {
        setSearch(value);
        setPage(1);
    }, []);

    const _handleCategoryChange = useCallback((category: E_BlogCategory | 'ALL') => {
        setSelectedCategory(category);
        setPage(1);
    }, []);

    const _handleStatusChange = useCallback((status: 'ACTIVE' | 'INACTIVE' | 'ALL') => {
        setSelectedStatus(status);
        setPage(1);
    }, []);

    const _handleSortChange = useCallback((field: 'title' | 'category' | 'createdAt', order: 'asc' | 'desc') => {
        setSortField(field);
        setSortOrder(order);
        setPage(1);
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 p-6">
                <BlogList
                    blogs={blogs}
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
                    onTypeChange={(v) => {
                        setSelectedType(v as any);
                        setPage(1);
                    }}
                />
                <BlogForm
                    ref={blogFormRef}
                    onCreateSubmit={_handleCreateSubmit}
                    onUpdateSubmit={_handleUpdateSubmit}
                    creating={creatingBlog}
                    updating={updatingBlog}
                />
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
