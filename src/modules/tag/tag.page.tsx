import { Tag } from 'lucide-react';
import { motion } from 'motion/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { F_TagListItemFragment, Input_CreateTag, Input_UpdateTag } from '#shared/graphql';

import { ConfirmDialog } from '#shared/component';
import { E_TagType } from '#shared/graphql';
import { createBooleanQueryParam, createEnumQueryParam, createIntegerQueryParam, createStringQueryParam, useDebouncedQueryValue, useListQueryState } from '#shared/hooks';
import { useTranslate } from '#shared/i18n';
import { usePortal } from '#shared/portal';

import type { I_TagFormRef } from './tag.type';

import { TagForm } from './tag-form';
import { TagList } from './tag-list';
import { useCreateTag, useDeleteTag, useGetTags, useUpdateTag } from './tag.hook';

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;
const TAG_TYPES = ['ALL', ...Object.values(E_TagType)] as const;
const TAG_SORTS = ['usageCount-desc', 'usageCount-asc', 'createdAt-desc', 'createdAt-asc', 'name-asc', 'name-desc', 'type-asc', 'type-desc'] as const;
const VIEW_MODES = ['grid', 'table'] as const;

const TAG_QUERY_CONFIG = {
    page: createIntegerQueryParam(1),
    pageSize: createIntegerQueryParam(10, { allowedValues: PAGE_SIZE_OPTIONS }),
    q: createStringQueryParam(),
    type: createEnumQueryParam<'ALL' | E_TagType>('ALL', TAG_TYPES),
    custom: createBooleanQueryParam(),
    lowUsage: createBooleanQueryParam(),
    sort: createEnumQueryParam('usageCount-desc', TAG_SORTS),
    view: createEnumQueryParam('grid', VIEW_MODES),
};

export function TagPage() {
    const { t } = useTranslate('tag');
    const { setHeader } = usePortal();
    const { state: queryState, setState: setQueryState } = useListQueryState(TAG_QUERY_CONFIG);
    const { page, pageSize, type: selectedType, custom: showCustomOnly, lowUsage: showLowUsage, view: viewMode } = queryState;
    const [sortField, sortOrder] = queryState.sort.split('-') as ['name' | 'type' | 'usageCount' | 'createdAt', 'asc' | 'desc'];
    const commitSearch = useCallback((q: string) => {
        setQueryState({ q }, { replace: true, resetPage: true });
    }, [setQueryState]);
    const [search, setSearch] = useDebouncedQueryValue(queryState.q, commitSearch);
    const [deletingTag, setDeletingTag] = useState<F_TagListItemFragment | null>(null);
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
            type?: E_TagType;
            isCustom?: boolean;
        } = {
            isDel: false,
        };

        if (selectedType !== 'ALL') {
            filterObj.type = selectedType;
        }

        if (showCustomOnly) {
            filterObj.isCustom = true;
        }

        return filterObj;
    }, [selectedType, showCustomOnly]);

    const options = useMemo(() => {
        const sortValue = sortOrder === 'desc' ? -1 : 1;
        const sortObj: Record<string, 1 | -1> = {};

        if (sortField === 'usageCount') {
            sortObj['usageCount'] = sortValue;
        }
        else {
            sortObj[sortField] = sortValue;
        }

        return {
            page,
            limit: pageSize,
            sort: sortObj,
            search: queryState.q,
            usageCountLte: showLowUsage ? 5 : undefined,
            projection: {
                id: 1,
                createdAt: 1,
                name: 1,
                type: 1,
                isCustom: 1,
                usageCount: 1,
                createdById: 1,
            },
            populate: [{ path: 'createdBy', select: 'id username' }],
            lean: true,
        };
    }, [page, pageSize, queryState.q, showLowUsage, sortField, sortOrder]);

    const {
        tags,
        totalDocs,
        totalPages,
        hasNextPage,
        hasPrevPage,
        loading,
        refetch,
    } = useGetTags(filter, options);

    const { createTag, loading: creating } = useCreateTag();
    const { updateTag, loading: updating } = useUpdateTag();
    const { deleteTag, loading: deleting } = useDeleteTag();

    const _handleCreateTag = useCallback(() => {
        tagFormRef.current?.open();
    }, []);

    const _handleEditTag = useCallback((tag: F_TagListItemFragment) => {
        tagFormRef.current?.open(tag);
    }, []);

    const _handleDeleteTag = useCallback((tag: F_TagListItemFragment) => {
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

    const _handleTypeChange = useCallback((type: E_TagType | 'ALL') => {
        setQueryState({ type }, { resetPage: true });
    }, [setQueryState]);

    const _handleSortChange = useCallback((field: 'name' | 'type' | 'usageCount' | 'createdAt', order: 'asc' | 'desc') => {
        setQueryState({ sort: `${field}-${order}` }, { resetPage: true });
    }, [setQueryState]);

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
                        showCustomOnly={showCustomOnly}
                        onShowCustomOnlyChange={value => setQueryState({ custom: value }, { resetPage: true })}
                        showLowUsage={showLowUsage}
                        onShowLowUsageChange={value => setQueryState({ lowUsage: value }, { resetPage: true })}
                        viewMode={viewMode}
                        onViewModeChange={view => setQueryState({ view })}
                        totalPages={totalPages}
                        hasNextPage={hasNextPage}
                        hasPrevPage={hasPrevPage}
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
