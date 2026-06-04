import { Tag } from 'lucide-react';
import { motion } from 'motion/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { E_TagType, Input_CreateTag, Input_UpdateTag, T_Tag } from '#shared/graphql';

import { ConfirmDialog } from '#shared/component';
import { useTranslate } from '#shared/i18n';
import { usePortal } from '#shared/portal';

import type { I_TagFormRef } from './tag.type';

import { TagForm } from './tag-form';
import { TagList } from './tag-list';
import { useCreateTag, useDeleteTag, useGetTags, useUpdateTag } from './tag.hook';

export function TagPage() {
    const { t } = useTranslate('tag');
    const { setHeader } = usePortal();
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [search, setSearch] = useState('');
    const [selectedType, setSelectedType] = useState<E_TagType | 'ALL'>('ALL');
    const [sortField, setSortField] = useState<'name' | 'type' | 'usageCount' | 'createdAt'>('usageCount');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [deletingTag, setDeletingTag] = useState<T_Tag | null>(null);
    const tagFormRef = useRef<I_TagFormRef>(null);

    useEffect(() => {
        setHeader({
            title: t('title'),
            description: t('tags-hint'),
            icon: Tag,
        });
        return () => setHeader(null);
    }, [setHeader, t]);

    const shouldFetchAll = !!search;

    const [knownTotal, setKnownTotal] = useState(1000);

    const filter = useMemo(() => {
        const filterObj: {
            isDel: boolean;
            type?: E_TagType;
        } = {
            isDel: false,
        };

        if (selectedType !== 'ALL') {
            filterObj.type = selectedType;
        }

        return filterObj;
    }, [selectedType]);

    const options = useMemo(() => {
        const sortValue = sortOrder === 'desc' ? -1 : 1;
        const sortObj: any = {};

        if (sortField === 'usageCount') {
            sortObj.usageCount = sortValue;
        }
        else {
            sortObj[sortField] = sortValue;
        }

        return {
            page: shouldFetchAll ? 1 : page,
            limit: shouldFetchAll ? knownTotal : pageSize,
            sort: sortObj,
            populate: ['createdBy'],
        };
    }, [shouldFetchAll, page, pageSize, knownTotal, sortField, sortOrder]);

    const {
        tags: rawTags,
        totalDocs: serverTotalDocs,
        loading,
        refetch,
    } = useGetTags(filter, options);

    useEffect(() => {
        if (serverTotalDocs > 0) {
            // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect
            setKnownTotal(prev => Math.max(prev, serverTotalDocs));
        }
    }, [serverTotalDocs]);

    const filteredTags = useMemo(() => {
        if (!search) {
            return rawTags;
        }
        return rawTags.filter(tag =>
            tag.name?.toLowerCase().includes(search.toLowerCase()),
        );
    }, [rawTags, search]);

    const sortedTags = useMemo(() => {
        if (!filteredTags.length) {
            return filteredTags;
        }
        if (sortField === 'usageCount') {
            return [...filteredTags].sort((a, b) => {
                const aCount = Number(a.usageCount) || 0;
                const bCount = Number(b.usageCount) || 0;
                return sortOrder === 'desc' ? bCount - aCount : aCount - bCount;
            });
        }

        return filteredTags;
    }, [filteredTags, sortField, sortOrder]);

    const paginatedData = useMemo(() => {
        if (shouldFetchAll) {
            const totalFiltered = sortedTags.length;
            const totalPagesCalculated = Math.ceil(totalFiltered / pageSize);
            const startIndex = (page - 1) * pageSize;
            const endIndex = startIndex + pageSize;
            const paginatedTags = sortedTags.slice(startIndex, endIndex);

            return {
                tags: paginatedTags,
                totalDocs: totalFiltered,
                totalPages: totalPagesCalculated,
                hasNextPage: page < totalPagesCalculated,
                hasPrevPage: page > 1,
            };
        }
        else {
            return {
                tags: sortedTags,
                totalDocs: serverTotalDocs,
                totalPages: Math.ceil(serverTotalDocs / pageSize),
                hasNextPage: page * pageSize < serverTotalDocs,
                hasPrevPage: page > 1,
            };
        }
    }, [shouldFetchAll, sortedTags, page, pageSize, serverTotalDocs]);

    const { createTag, loading: creating } = useCreateTag();
    const { updateTag, loading: updating } = useUpdateTag();
    const { deleteTag, loading: deleting } = useDeleteTag();

    const _handleCreateTag = useCallback(() => {
        tagFormRef.current?.open();
    }, []);

    const _handleEditTag = useCallback((tag: T_Tag) => {
        tagFormRef.current?.open(tag);
    }, []);

    const _handleDeleteTag = useCallback((tag: T_Tag) => {
        setDeletingTag(tag);
    }, []);

    const _handleConfirmDelete = useCallback(async () => {
        if (deletingTag?.id) {
            await deleteTag({ id: deletingTag.id });
            setDeletingTag(null);
            refetch();
        }
    }, [deletingTag, deleteTag, refetch]);

    const _handleCreateSubmit = useCallback(async (data: Input_CreateTag) => {
        await createTag(data as Input_CreateTag);
        refetch();
    }, [createTag, refetch]);

    const _handleUpdateSubmit = useCallback(async (id: string, data: Input_UpdateTag) => {
        await updateTag({ id }, data);
        refetch();
    }, [updateTag, refetch]);

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

    const _handleTypeChange = useCallback((type: E_TagType | 'ALL') => {
        setSelectedType(type);
        setPage(1);
    }, []);

    const _handleSortChange = useCallback((field: 'name' | 'type' | 'usageCount' | 'createdAt', order: 'asc' | 'desc') => {
        setSortField(field);
        setSortOrder(order);
        setPage(1);
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
            {/* Background Pattern */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-200 dark:bg-purple-900/30 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-200 dark:bg-blue-900/30 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
                <div className="absolute top-40 left-40 w-80 h-80 bg-pink-200 dark:bg-pink-900/30 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
            </div>

            {/* Main Content */}
            <div className="relative z-10 p-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <TagList
                        sortField={sortField}
                        sortOrder={sortOrder}
                        tags={paginatedData.tags}
                        loading={loading}
                        onEditTag={_handleEditTag}
                        onCreateTag={_handleCreateTag}
                        onDeleteTag={_handleDeleteTag}
                        totalDocs={paginatedData.totalDocs}
                        page={page}
                        pageSize={pageSize}
                        onPageChange={_handlePageChange}
                        onPageSizeChange={_handlePageSizeChange}
                        search={search}
                        onSearchChange={_handleSearchChange}
                        selectedType={selectedType}
                        onTypeChange={_handleTypeChange}
                        onSortChange={_handleSortChange}
                    />
                </motion.div>
            </div>

            {/* Form and Dialog Overlays */}
            <TagForm
                ref={tagFormRef}
                onCreateSubmit={_handleCreateSubmit}
                onUpdateSubmit={_handleUpdateSubmit}
                creating={creating}
                updating={updating}
            />
            <ConfirmDialog
                open={!!deletingTag}
                title={t('delete-tag')}
                description={t('delete-tag-confirmation', { name: deletingTag?.name })}
                onConfirm={_handleConfirmDelete}
                onCancel={() => setDeletingTag(null)}
                loading={deleting}
            />
        </div>
    );
}

export default TagPage;
