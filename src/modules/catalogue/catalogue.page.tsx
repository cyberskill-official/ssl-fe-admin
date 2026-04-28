import { Image } from 'lucide-react';
import { motion } from 'motion/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { E_CatalogueType, Input_CreateCatalogue, T_Catalogue } from '#shared/graphql';

import { ConfirmDialog } from '#shared/component';
import { useTranslate } from '#shared/i18n';
import { usePortal } from '#shared/portal';

import type { I_CatalogueFormRef } from './catalogue.type';

import { CatalogueForm } from './catalogue-form';
import { CatalogueList } from './catalogue-list';
import { useCreateCatalogue, useDeleteCatalogue, useGetCatalogues, useUpdateCatalogue } from './catalogue.hook';

export default function CataloguePage() {
    const { t } = useTranslate('catalogue');
    const { setHeader } = usePortal();
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [search, setSearch] = useState('ALL');
    const [selectedType, setSelectedType] = useState<E_CatalogueType | 'ALL'>('ALL');
    const [sortField, setSortField] = useState<'type' | 'createdAt'>('createdAt');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [deletingCatalogue, setDeletingCatalogue] = useState<T_Catalogue | null>(null);
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
        populate: ['tag'],
    }), [page, pageSize, sortField, sortOrder]);

    const {
        catalogues,
        totalDocs,
        loading,
        refetch,
    } = useGetCatalogues(filter, options);

    const { createCatalogue, loading: creating } = useCreateCatalogue();
    const { updateCatalogue, loading: updating } = useUpdateCatalogue();
    const { deleteCatalogue, loading: deleting } = useDeleteCatalogue();

    const _handleCreateCatalogue = useCallback(() => {
        catalogueFormRef.current?.open();
    }, []);

    const _handleEditCatalogue = useCallback((catalogue: T_Catalogue) => {
        catalogueFormRef.current?.open(catalogue);
    }, []);

    const _handleDeleteCatalogue = useCallback((catalogue: T_Catalogue) => {
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

    const _handlePageChange = useCallback((newPage: number) => {
        setPage(newPage);
    }, []);

    const _handlePageSizeChange = useCallback((newPageSize: number) => {
        setPageSize(newPageSize);
        setPage(1);
    }, []);

    const _handleSearchChange = useCallback((newSearch: string) => {
        setSearch(newSearch);
        setPage(1);
    }, []);

    const _handleTypeChange = useCallback((newType: string) => {
        setSelectedType(newType as E_CatalogueType | 'ALL');
        setPage(1);
    }, []);

    const _handleSortChange = useCallback((field: string, order: 'asc' | 'desc') => {
        setSortField(field as 'type' | 'createdAt');
        setSortOrder(order);
    }, []);

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
