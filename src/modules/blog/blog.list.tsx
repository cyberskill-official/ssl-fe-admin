import { AlertTriangle, Edit, FileText, Grid3X3, List, Plus, RefreshCw, Search, Tag, Trash2, User } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useMemo, useState } from 'react';

import type { T_Blog } from '#shared/graphql';

import { Badge, Button, Input, Pagination, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Switch } from '#shared/component';
import { DataTable } from '#shared/component/data-table';
import { E_BlogType } from '#shared/graphql';
import { useTranslate } from '#shared/i18n';

import { getBlogText } from './blog-text';
import { BlogCard } from './blog.card';

export function BlogList({
    blogs,
    loading,
    onEditBlog,
    onCreateBlog,
    onDeleteBlog,
    onToggleStatus,
    updatingStatusId,
    totalDocs,
    page = 1,
    pageSize = 10,
    onPageChange,
    onPageSizeChange,
    search = '',
    onSearchChange,
    selectedCategory = 'ALL',
    onCategoryChange,
    selectedStatus = 'ALL',
    onStatusChange,
    sortField = 'createdAt',
    sortOrder = 'desc',
    onSortChange,
    selectedType = 'ALL',
    onTypeChange,
    error,
    onRetry,
}: {
    blogs: T_Blog[];
    loading?: boolean;
    onEditBlog?: (blog: T_Blog) => void;
    onCreateBlog?: () => void;
    onDeleteBlog?: (blog: T_Blog) => void;
    onToggleStatus?: (blogId: string, currentIsActive: boolean) => void;
    updatingStatusId?: string;
    totalDocs?: number;
    page?: number;
    pageSize?: number;
    onPageChange?: (page: number) => void;
    onPageSizeChange?: (size: number) => void;
    search?: string;
    onSearchChange?: (value: string) => void;
    selectedCategory?: string;
    onCategoryChange?: (category: string) => void;
    selectedStatus?: string;
    onStatusChange?: (status: string) => void;
    sortField?: string;
    sortOrder?: string;
    onSortChange?: (field: string, order: string) => void;
    selectedType?: string;
    onTypeChange?: (type: string) => void;
    error?: Error | null;
    onRetry?: () => void;
}) {
    const { t } = useTranslate('blog');
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

    const categoryOptions = [
        { value: 'ALL', label: t('all-categories'), icon: <Tag className="h-4 w-4" /> },
        { value: 'SWINGER_CLUB', label: t('swinger-club'), icon: <Tag className="h-4 w-4" /> },
        { value: 'DATING', label: t('dating'), icon: <Tag className="h-4 w-4" /> },
        { value: 'SEX', label: t('sex'), icon: <Tag className="h-4 w-4" /> },
        { value: 'LIFESTYLE', label: t('lifestyle'), icon: <Tag className="h-4 w-4" /> },
        { value: 'TRAVELS', label: t('travels'), icon: <Tag className="h-4 w-4" /> },
        { value: 'RELATIONSHIPS', label: t('relationships'), icon: <Tag className="h-4 w-4" /> },
        { value: 'SEXUALITY', label: t('sexuality'), icon: <Tag className="h-4 w-4" /> },
    ];

    const statusOptions = [
        { value: 'ALL', label: t('all-statuses'), icon: <FileText className="h-4 w-4" /> },
        { value: 'ACTIVE', label: t('published'), icon: <FileText className="h-4 w-4" /> },
        { value: 'INACTIVE', label: t('draft'), icon: <FileText className="h-4 w-4" /> },
    ];

    const sortOptions = [
        { value: 'createdAt-desc', label: t('newest-first'), field: 'createdAt', order: 'desc' },
        { value: 'createdAt-asc', label: t('oldest-first'), field: 'createdAt', order: 'asc' },
        { value: 'title-asc', label: t('title-a-z'), field: 'title', order: 'asc' },
        { value: 'title-desc', label: t('title-z-a'), field: 'title', order: 'desc' },
        { value: 'category-asc', label: t('category-a-z'), field: 'category', order: 'asc' },
        { value: 'category-desc', label: t('category-z-a'), field: 'category', order: 'desc' },
    ];

    const currentSortValue = `${sortField}-${sortOrder}`;

    const typeOptions = [
        { value: 'ALL', label: t('all-types') },
        { value: E_BlogType.BLOG, label: t('blog') },
        { value: E_BlogType.PODCAST, label: t('podcast') },
    ];

    const columns = useMemo(() => [
        {
            accessorKey: 'title',
            header: t('title'),
            cell: ({ row }: any) => (
                <div className="font-semibold text-gray-900 dark:text-gray-100">{getBlogText(row.original.title, '-')}</div>
            ),
        },
        {
            accessorKey: 'category',
            header: t('category'),
            cell: ({ row }: any) => (
                <Badge className="bg-gradient-to-r from-purple-400 to-pink-400 text-white text-xs">
                    {row.original.category}
                </Badge>
            ),
        },
        {
            accessorKey: 'author',
            header: t('author'),
            cell: ({ row }: any) => {
                const blog = row.original;
                const author = blog.author;

                if (author) {
                    return (
                        <div className="flex items-center gap-2 text-xs">
                            <User className="w-3 h-3" />
                            <a
                                href={`https://development.secretswingerlust.com/profile/${author.username}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:underline font-medium"
                            >
                                {author.username}
                            </a>
                        </div>
                    );
                }

                return (
                    <div className="flex items-center gap-2 text-xs">
                        <User className="w-3 h-3" />
                        <span className="text-gray-500">{getBlogText(blog.hostName, t('unknown-author'))}</span>
                    </div>
                );
            },
        },
        {
            accessorKey: 'isActive',
            header: t('status'),
            cell: ({ row }: any) => {
                const blog = row.original;
                const isActive = blog.isActive || false;
                return (
                    <div className="flex items-center gap-2">
                        <Switch
                            checked={isActive}
                            onCheckedChange={() => onToggleStatus?.(blog.id!, isActive)}
                            aria-label={t('toggle-status')}
                            disabled={updatingStatusId === blog.id}
                        />
                        <Badge
                            className={
                                isActive
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                    : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                            }
                        >
                            {isActive ? t('published') : t('draft')}
                        </Badge>
                    </div>
                );
            },
        },
        {
            accessorKey: 'createdAt',
            header: t('created'),
            cell: ({ row }: any) => (
                <div className="text-sm text-gray-600 dark:text-gray-300">
                    <div>{new Date(row.original.createdAt).toLocaleDateString()}</div>
                    {row.original.author?.username && (
                        <div className="text-xs">
                            by
                            {' '}
                            {row.original.author.username}
                        </div>
                    )}
                </div>
            ),
        },
        {
            id: 'actions',
            header: t('actions'),
            cell: ({ row }: any) => (
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEditBlog?.(row.original)}
                        className="h-8 px-3"
                    >
                        <Edit className="h-3 w-3 mr-1" />
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDeleteBlog?.(row.original)}
                        className="h-8 px-3 text-red-600 hover:text-red-700"
                    >
                        <Trash2 className="h-3 w-3" />
                    </Button>
                </div>
            ),
        },
    ], [t, onEditBlog, onDeleteBlog, onToggleStatus, updatingStatusId]);

    return (
        <div className="space-y-6">
            {/* Toolbar - styled like destination */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/90 dark:bg-gray-800/95 backdrop-blur-xl rounded-2xl border border-white/30 dark:border-gray-600/50 p-6 shadow-xl"
            >
                <div className="flex items-center gap-4 flex-wrap">
                    <div className="relative flex-1 min-w-[300px]">
                        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500 dark:text-gray-400" />
                        <Input
                            value={search}
                            onChange={e => onSearchChange?.(e.target.value)}
                            placeholder={t('search-blog')}
                            className="pl-10 h-12 border-0 bg-white/70 dark:bg-gray-700/80 backdrop-blur-sm focus:bg-white dark:focus:bg-gray-600 focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 rounded-xl shadow-lg"
                        />
                    </div>
                    <Select value={selectedType} onValueChange={v => onTypeChange?.(v)}>
                        <SelectTrigger className="h-12 w-40 border-0 bg-white/70 dark:bg-gray-700/80 backdrop-blur-sm rounded-xl shadow-lg text-gray-900 dark:text-gray-100">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                            {typeOptions.map(opt => (
                                <SelectItem key={opt.value} value={opt.value} className="text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700">
                                    {opt.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={selectedCategory} onValueChange={v => onCategoryChange?.(v as any)}>
                        <SelectTrigger className="h-12 w-48 border-0 bg-white/70 dark:bg-gray-700/80 backdrop-blur-sm rounded-xl shadow-lg text-gray-900 dark:text-gray-100">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                            {categoryOptions.map(opt => (
                                <SelectItem key={opt.value} value={opt.value} className="text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700">
                                    {opt.icon}
                                    {opt.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={selectedStatus} onValueChange={v => onStatusChange?.(v as any)}>
                        <SelectTrigger className="h-12 w-40 border-0 bg-white/70 dark:bg-gray-700/80 backdrop-blur-sm rounded-xl shadow-lg text-gray-900 dark:text-gray-100">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                            {statusOptions.map(opt => (
                                <SelectItem key={opt.value} value={opt.value} className="text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700">
                                    {opt.icon}
                                    {opt.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select
                        value={currentSortValue}
                        onValueChange={(v) => {
                            const [field, order] = v.split('-');
                            onSortChange?.(field as any, order as any);
                        }}
                    >
                        <SelectTrigger className="h-12 w-48 border-0 bg-white/70 dark:bg-gray-700/80 backdrop-blur-sm rounded-xl shadow-lg text-gray-900 dark:text-gray-100">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                            {sortOptions.map(opt => (
                                <SelectItem key={opt.value} value={opt.value} className="text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700">
                                    {opt.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <div className="flex gap-2 items-center ml-auto">
                        <Button
                            variant={viewMode === 'grid' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setViewMode('grid')}
                            className="h-10 w-10 rounded-xl"
                        >
                            <Grid3X3 className="h-5 w-5" />
                        </Button>
                        <Button
                            variant={viewMode === 'table' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setViewMode('table')}
                            className="h-10 w-10 rounded-xl"
                        >
                            <List className="h-5 w-5" />
                        </Button>
                    </div>
                </div>
            </motion.div>
            {/* Content */}
            {loading && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex min-h-[360px] flex-col items-center justify-center rounded-2xl border border-white/30 bg-white/90 shadow-xl backdrop-blur-xl dark:border-gray-600/50 dark:bg-gray-800/95"
                >
                    <div className="h-12 w-12 rounded-full border-4 border-purple-200 border-t-purple-600 animate-spin" />
                </motion.div>
            )}
            {!loading && error && blogs.length === 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center justify-center py-20 text-center"
                >
                    <div className="rounded-full bg-red-100 dark:bg-red-900/30 p-6 mb-4">
                        <AlertTriangle className="h-12 w-12 text-red-400 dark:text-red-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        {t('error-loading-blogs')}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mb-4">
                        {error?.message || t('something-went-wrong')}
                    </p>
                    <Button onClick={onRetry} variant="outline" className="gap-2">
                        <RefreshCw className="h-4 w-4" />
                        {t('retry')}
                    </Button>
                </motion.div>
            )}
            {!loading && !error && blogs.length === 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center justify-center py-20 text-center"
                >
                    <div className="rounded-full bg-purple-100 dark:bg-purple-900/30 p-6 mb-4">
                        <FileText className="h-12 w-12 text-purple-400 dark:text-purple-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        {t('no-blogs-found')}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md">
                        {search || selectedCategory !== 'ALL' || selectedStatus !== 'ALL' || selectedType !== 'ALL'
                            ? t('try-adjusting-filters')
                            : t('create-first-blog')}
                    </p>
                </motion.div>
            )}
            {!loading && blogs.length > 0 && viewMode === 'grid' && (
                <AnimatePresence>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
                    >
                        {blogs.map(blog => (
                            <BlogCard
                                key={blog.id}
                                blog={blog}
                                onEdit={onEditBlog!}
                                onDelete={onDeleteBlog!}
                                onToggleStatus={onToggleStatus!}
                                updatingStatusId={updatingStatusId}
                                t={t}
                            />
                        ))}
                    </motion.div>
                </AnimatePresence>
            )}
            {!loading && blogs.length > 0 && viewMode === 'table' && (
                <DataTable
                    columns={columns}
                    data={blogs}
                    searchKey="title"
                    searchPlaceholder={t('search-blog')}
                    showPagination={false}
                    showToolbar={false}
                    showColumnVisibility={true}
                    pageSize={pageSize}
                    page={page}
                    totalItems={totalDocs}
                    onPageChange={onPageChange}
                    onPageSizeChange={onPageSizeChange}
                    searchValue={search}
                    onSearchChange={onSearchChange}
                />
            )}
            {/* Shared Pagination for both Grid and Table views */}
            {(typeof totalDocs === 'number' && totalDocs > 0) && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/90 dark:bg-gray-800/95 backdrop-blur-xl rounded-2xl border border-white/30 dark:border-gray-600/50 shadow-xl"
                >
                    <Pagination
                        total={totalDocs ?? 0}
                        page={page ?? 1}
                        limit={pageSize ?? 10}
                        onPageChange={onPageChange}
                        onLimitChange={onPageSizeChange}
                        hasNextPage={typeof (blogs as any).hasNextPage !== 'undefined' ? (blogs as any).hasNextPage : false}
                        hasPrevPage={typeof (blogs as any).hasPrevPage !== 'undefined' ? (blogs as any).hasPrevPage : false}
                        totalPages={typeof (blogs as any).totalPages !== 'undefined' ? (blogs as any).totalPages : Math.ceil(((totalDocs ?? 0) || blogs.length) / (pageSize ?? 10))}
                        className="border-0 bg-transparent"
                    />
                </motion.div>
            )}
            {/* Floating Create Button */}
            <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                className="fixed bottom-6 right-6 z-50"
            >
                <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                >
                    <Button
                        onClick={onCreateBlog}
                        className="h-14 w-14 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-2xl hover:shadow-3xl transition-all duration-300 flex items-center justify-center"
                    >
                        <Plus className="h-6 w-6" />
                    </Button>
                </motion.div>
            </motion.div>
        </div>
    );
}
