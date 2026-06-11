import { Image } from 'lucide-react';
import { motion } from 'motion/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { F_CatalogueListItemFragment, Input_CreateCatalogue, T_Catalogue } from '#shared/graphql';

import { ConfirmDialog } from '#shared/component';
import { E_CatalogueType } from '#shared/graphql';
import { createEnumQueryParam, createIntegerQueryParam, createStringQueryParam, useListQueryState } from '#shared/hooks';
import { useTranslate } from '#shared/i18n';
import { usePortal } from '#shared/portal';

import type { I_CatalogueFormRef } from './catalogue.type';

import { CatalogueForm } from './catalogue-form';
import { CatalogueList } from './catalogue-list';
import { useCreateCatalogue, useDeleteCatalogue, useGetCatalogues, useUpdateCatalogue } from './catalogue.hook';

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;
const CATALOGUE_TYPES = ['ALL', E_CatalogueType.BOOTYCALL, E_CatalogueType.PARTY, E_CatalogueType.TRAVEL] as const;
const CATALOGUE_SORTS = ['createdAt-desc', 'createdAt-asc', 'type-asc', 'type-desc'] as const;
const VIEW_MODES = ['grid', 'table'] as const;

const CATALOGUE_QUERY_CONFIG = {
    page: createIntegerQueryParam(1),
    pageSize: createIntegerQueryParam(10, { allowedValues: PAGE_SIZE_OPTIONS }),
    type: createEnumQueryParam<'ALL' | E_CatalogueType>('ALL', CATALOGUE_TYPES),
    tag: createStringQueryParam('ALL'),
    sort: createEnumQueryParam('createdAt-desc', CATALOGUE_SORTS),
    view: createEnumQueryParam('grid', VIEW_MODES),
};

export default function CataloguePage() {
    const { t } = useTranslate('catalogue');
    const { setHeader } = usePortal();
    const { state: queryState, setState: setQueryState } = useListQueryState(CATALOGUE_QUERY_CONFIG);
    const { page, pageSize, type: selectedType, tag: search, view: viewMode } = queryState;
    const [sortField, sortOrder] = queryState.sort.split('-') as ['type' | 'createdAt', 'asc' | 'desc'];
    const [deletingCatalogue, setDeletingCatalogue] = useState<F_CatalogueListItemFragment | null>(null);
    const catalogueFormRef = useRef<I_CatalogueFormRef>(null);

    useEffect(() => {
        setHeader({
            title: t('title'),
            description: t('catalogues-hint'),
            icon: Image,
        });
        return () => setHeader(null);
    }, [setHeader, t]);

    const filter = useMemo(() => {
        const filterObj: {
            isDel: boolean;
            type?: E_CatalogueType;
            tagId?: string;
        } = {
            isDel: false,
        };

        if (selectedType !== 'ALL') {
            filterObj.type = selectedType;
        }

        if (search && search !== 'ALL') {
            filterObj.tagId = search;
        }

        return filterObj;
    }, [selectedType, search]);

    const options = useMemo(() => ({
        page,
        limit: pageSize,
        sort: { [sortField]: sortOrder === 'desc' ? -1 : 1 },
        projection: {
            id: 1,
            isDel: 1,
            createdAt: 1,
            updatedAt: 1,
            type: 1,
            tagId: 1,
            url: 1,
        },
        populate: [{ path: 'tag', select: 'id name type' }],
        lean: true,
    }), [page, pageSize, sortField, sortOrder]);

    const {
        catalogues,
        totalDocs,
        totalPages,
        hasNextPage,
        hasPrevPage,
        loading,
        refetch,
    } = useGetCatalogues(filter, options);

    const { createCatalogue, loading: creating } = useCreateCatalogue();
    const { updateCatalogue, loading: updating } = useUpdateCatalogue();
    const { deleteCatalogue, loading: deleting } = useDeleteCatalogue();

    const _handleCreateCatalogue = useCallback(() => {
        catalogueFormRef.current?.open();
    }, []);

    const _handleEditCatalogue = useCallback((catalogue: F_CatalogueListItemFragment) => {
        catalogueFormRef.current?.open(catalogue);
    }, []);

    const _handleDeleteCatalogue = useCallback((catalogue: F_CatalogueListItemFragment) => {
        setDeletingCatalogue(catalogue);
    }, []);

    const _handleConfirmDelete = useCallback(async () => {
        if (deletingCatalogue?.id) {
            await deleteCatalogue({ id: deletingCatalogue.id });
            setDeletingCatalogue(null);
            refetch();
        }
    }, [deletingCatalogue, deleteCatalogue, refetch]);

    const _handleCreateSubmit = useCallback(async (data: Input_CreateCatalogue) => {
        await createCatalogue(data);
        catalogueFormRef.current?.close();
        refetch();
    }, [createCatalogue, refetch]);

    const _handleUpdateSubmit = useCallback(async (id: string, data: Partial<T_Catalogue>) => {
        await updateCatalogue({ id }, data);
        catalogueFormRef.current?.close();
        refetch();
    }, [updateCatalogue, refetch]);

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

    const _handleSearchChange = useCallback((newSearch: string) => {
        setQueryState({ tag: newSearch }, { resetPage: true });
    }, [setQueryState]);

    const _handleTypeChange = useCallback((newType: string) => {
        setQueryState({ type: newType as E_CatalogueType | 'ALL' }, { resetPage: true });
    }, [setQueryState]);

    const _handleSortChange = useCallback((field: string, order: 'asc' | 'desc') => {
        const sort = `${field}-${order}` as 'createdAt-asc' | 'createdAt-desc' | 'type-asc' | 'type-desc';
        setQueryState({ sort }, { resetPage: true });
    }, [setQueryState]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
        >
            <CatalogueList
                catalogues={catalogues}
                loading={loading}
                onEditCatalogue={_handleEditCatalogue}
                onCreateCatalogue={_handleCreateCatalogue}
                onDeleteCatalogue={_handleDeleteCatalogue}
                totalDocs={totalDocs}
                page={page}
                pageSize={pageSize}
                onPageChange={_handlePageChange}
                onPageSizeChange={_handlePageSizeChange}
                search={search}
                onSearchChange={_handleSearchChange}
                selectedType={selectedType}
                onTypeChange={_handleTypeChange}
                sortField={sortField}
                sortOrder={sortOrder}
                onSortChange={_handleSortChange}
                totalPages={totalPages}
                hasNextPage={hasNextPage}
                hasPrevPage={hasPrevPage}
                viewMode={viewMode}
                onViewModeChange={view => setQueryState({ view })}
            />

            <CatalogueForm
                ref={catalogueFormRef}
                onCreateSubmit={_handleCreateSubmit}
                onUpdateSubmit={_handleUpdateSubmit}
                creating={creating}
                updating={updating}
            />

            <ConfirmDialog
                open={!!deletingCatalogue}
                title={t('confirm-delete')}
                description={t('confirm-delete-catalogue-description', { name: deletingCatalogue?.tag?.name || 'this catalogue' })}
                onConfirm={_handleConfirmDelete}
                onCancel={() => setDeletingCatalogue(null)}
                loading={deleting}
            />
        </motion.div>
    );
}
