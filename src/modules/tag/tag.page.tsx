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

    const filter = useMemo(() => {
        const filterObj: {
            isDel: boolean;
            name?: string;
            type?: E_TagType;
        } = {
            isDel: false,
        };

        if (search) {
            filterObj.name = search;
        }

        if (selectedType !== 'ALL') {
            filterObj.type = selectedType;
        }

        return filterObj;
    }, [search, selectedType]);

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
            page,
            limit: pageSize,
            sort: sortObj,
            populate: ['createdBy'],
        };
    }, [page, pageSize, sortField, sortOrder]);

    const {
        tags: rawTags,
        totalDocs,
        loading,
        refetch,
    } = useGetTags(filter, options);

    const tags = useMemo(() => {
        if (!rawTags.length) {
            return rawTags;
        }
        if (sortField === 'usageCount') {
            return [...rawTags].sort((a, b) => {
                const aCount = Number(a.usageCount) || 0;
                const bCount = Number(b.usageCount) || 0;
                return sortOrder === 'desc' ? bCount - aCount : aCount - bCount;
            });
        }

        return rawTags;
    }, [rawTags, sortField, sortOrder]);

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
                        tags={tags}
                        loading={loading}
                        onEditTag={_handleEditTag}
                        onCreateTag={_handleCreateTag}
                        onDeleteTag={_handleDeleteTag}
                        totalDocs={totalDocs}
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
