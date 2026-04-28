import { log } from '@cyberskill/shared/react/log';
import { toast } from '@cyberskill/shared/react/toast';
import { Tag } from 'lucide-react';
import { useEffect, useState } from 'react';

import type { T_PromoCode } from '#shared/graphql';

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '#shared/component';
import { ConfirmDialog } from '#shared/component/confirm-dialog';
import { useTranslate } from '#shared/i18n';
import { usePortal } from '#shared/portal';

import { PromoCodeForm } from './promo-code-form';
import { PromoCodeGrid } from './promo-code-grid';
import { PromoCodeSearch } from './promo-code-search';
import { useCreatePromoCode, useDeletePromoCode, useGetPromoCodes, useUpdatePromoCode } from './promo-code.hook';

export function PromoCodesPage() {
    const { t } = useTranslate('promoCodes');
    const { setHeader } = usePortal();
    const [showForm, setShowForm] = useState(false);
    const [editingPromoCode, setEditingPromoCode] = useState<T_PromoCode | null>(null);
    const [formMode, setFormMode] = useState<'create' | 'update'>('create');
    const [promoCodeToDelete, setPromoCodeToDelete] = useState<T_PromoCode | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [search, setSearch] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    const [filters, setFilters] = useState({
        code: '',
        isActive: 'all',
        benefit: 'all',
        isLimit: 'all',
    });

    const buildFilter = () => {
        const filter: Record<string, unknown> = { isDel: false };

        if (filters.isActive !== 'all') {
            filter['isActive'] = filters.isActive === 'true';
        }

        if (filters.isLimit !== 'all') {
            filter['isLimit'] = filters.isLimit === 'true';
        }

        return filter;
    };

    const _hasActiveFilters = filters.code.trim() !== ''
        || filters.isActive !== 'all'
        || filters.isLimit !== 'all';

    const { promoCodes, loading, refetch, totalDocs: _totalDocs } = useGetPromoCodes(
        buildFilter(),
        { pagination: false },
    );

    const visiblePromoCodes = (filters.code && filters.code.trim() !== '')
        ? (promoCodes || []).filter(pc => (
                (pc.code || '') as string
            ).toLowerCase().includes(filters.code!.toLowerCase()))
        : promoCodes;

    const effectiveTotalDocs = visiblePromoCodes?.length || 0;

    const { createPromoCode, loading: creatingPromoCode } = useCreatePromoCode();
    const { updatePromoCode, loading: updatingPromoCode } = useUpdatePromoCode();
    const { deletePromoCode } = useDeletePromoCode();

    useEffect(() => {
        setHeader({
            title: t('title'),
            description: t('promo-code-hint'),
            icon: Tag,
        });
        return () => setHeader(null);
    }, [setHeader, t]);

    const _handleCreatePromoCode = () => {
        setEditingPromoCode(null);
        setFormMode('create');
        setShowForm(true);
    };

    const _handleEditPromoCode = (promoCode: T_PromoCode) => {
        setEditingPromoCode(promoCode);
        setFormMode('update');
        setShowForm(true);
    };

    const _handleDeletePromoCode = (promoCode: T_PromoCode) => {
        setPromoCodeToDelete(promoCode);
    };

    const _handleToggleStatus = async (promoCodeId: string, currentIsActive: boolean) => {
        const promoCode = promoCodes?.find(code => code.id === promoCodeId);

        if (!promoCode) {
            toast.error(t('error.promo-code-not-found'));
            return;
        }

        setUpdatingStatusId(promoCodeId);
        try {
            await updatePromoCode(
                { id: promoCodeId },
                {
                    isActive: !currentIsActive,
                },
            );
            await refetch();
        }
        catch (error) {
            log.error('Error updating promo code status:', error);
            toast.error(t('error-update-status'));
        }
        finally {
            setUpdatingStatusId(null);
        }
    };

    const _handleFormSubmit = async (formData: Partial<T_PromoCode> & { membershipDurationDays?: number }) => {
        try {
            if (formMode === 'update' && editingPromoCode?.id) {
                await updatePromoCode(
                    { id: editingPromoCode.id },
                    {
                        code: formData.code,
                        expiresAt: formData.expiresAt,
                        isActive: formData.isActive,
                        isLimit: formData.isLimit,
                        usageLimit: formData.usageLimit,
                        globalUsageLimit: formData.globalUsageLimit,
                    },
                );
            }
            else if (formMode === 'create') {
                const createData = {
                    code: formData.code!,
                    expiresAt: formData.expiresAt,
                    isActive: formData.isActive!,
                    isLimit: formData.isLimit!,
                    usageLimit: formData.usageLimit,
                    globalUsageLimit: formData.globalUsageLimit,
                    membershipDurationDays: formData.membershipDurationDays,
                };

                await createPromoCode(createData);
            }

            setShowForm(false);
            setEditingPromoCode(null);
            await refetch();
        }
        catch (error) {
            log.error('Error saving promo code:', error);
            toast.error(t('error-save'));
        }
    };

    const _handleFormCancel = () => {
        setShowForm(false);
        setEditingPromoCode(null);
        setFormMode('create');
    };

    const _handleFiltersChange = (newFilters: Partial<typeof filters>) => {
        setFilters(prev => ({ ...prev, ...newFilters }));
        setPage(1);
    };

    const _handleClearFilters = () => {
        setFilters({
            code: '',
            isActive: 'all',
            benefit: 'all',
            isLimit: 'all',
        });
        setPage(1);
    };

    return (
        <div className="container mx-auto space-y-8 flex flex-col bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 min-h-screen">
            <PromoCodeSearch
                filters={filters}
                onFiltersChange={_handleFiltersChange}
                onClear={_handleClearFilters}
                loading={loading}
            />

            {/* Promo Codes Grid/List */}
            <div className="flex-1 border rounded-2xl p-6 bg-white dark:bg-gray-800 shadow-lg overflow-auto">
                <PromoCodeGrid
                    promoCodes={visiblePromoCodes}
                    loading={loading}
                    onEditPromoCode={_handleEditPromoCode}
                    onCreatePromoCode={_handleCreatePromoCode}
                    onDeletePromoCode={_handleDeletePromoCode}
                    onToggleStatus={_handleToggleStatus}
                    updatingStatusId={updatingStatusId || undefined}
                    totalDocs={effectiveTotalDocs}
                    page={page}
                    pageSize={pageSize}
                    onPageChange={setPage}
                    onPageSizeChange={setPageSize}
                    search={search}
                    onSearchChange={setSearch}
                    viewMode={viewMode}
                    onViewModeChange={setViewMode}
                />
            </div>

            {/* Form Dialog */}
            <Dialog open={showForm} onOpenChange={setShowForm}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>
                            {formMode === 'update' ? t('update-promo-code') : t('create-new-promo-code')}
                        </DialogTitle>
                    </DialogHeader>
                    <PromoCodeForm
                        promoCode={editingPromoCode || undefined}
                        mode={formMode}
                        onSubmit={_handleFormSubmit}
                        onCancel={_handleFormCancel}
                        loading={creatingPromoCode || updatingPromoCode}
                    />
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                open={!!promoCodeToDelete}
                title={t('delete-promo-code')}
                description={(
                    <span>
                        {t('confirm.delete-promo-code')}
                        &nbsp;
                        <b>{promoCodeToDelete?.code}</b>
                        ?
                    </span>
                )}
                onCancel={() => setPromoCodeToDelete(null)}
                onConfirm={async () => {
                    if (!promoCodeToDelete?.id) {
                        toast.error(t('error.promo-code-not-found'));
                        return;
                    }
                    setDeleting(true);
                    await deletePromoCode({ id: promoCodeToDelete.id });
                    setDeleting(false);
                    setPromoCodeToDelete(null);
                    await refetch();
                }}
                loading={deleting}
                confirmLabel={t('delete')}
                cancelLabel={t('cancel')}
            />
        </div>
    );
}

export default PromoCodesPage;
