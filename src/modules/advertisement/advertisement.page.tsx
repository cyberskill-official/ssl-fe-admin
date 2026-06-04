import { BarChart3, Users, Zap } from 'lucide-react';
import { motion } from 'motion/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { Input_CreateAdvertisement, Input_UpdateAdvertisement, T_Advertisement } from '#shared/graphql';

import { ConfirmDialog } from '#shared/component';
import { useTranslate } from '#shared/i18n';
import { usePortal } from '#shared/portal';

import type { I_AdvertisementFormRef } from './advertisement.type';

import { AdvertisementForm } from './advertisement-form';
import { AdvertisementList } from './advertisement-list';
import { useCreateAdvertisement, useDeleteAdvertisement, useGetAdvertisements, useUpdateAdvertisement } from './advertisement.hook';

export function AdvertisementPage() {
    const { t } = useTranslate('advertisement');
    const { setHeader } = usePortal();
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
    const [sortField, setSortField] = useState('createdAt');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [deletingAd, setDeletingAd] = useState<T_Advertisement | null>(null);
    const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
    const adFormRef = useRef<I_AdvertisementFormRef | null>(null);

    useEffect(() => {
        setHeader({
            title: t('title'),
            description: t('ads-hint'),
            icon: BarChart3,
        });
        return () => setHeader(null);
    }, [setHeader, t]);

    const filter = useMemo(() => {
        const filterObj: Record<string, unknown> = {};
        if (search)
            filterObj['name'] = search;
        if (status === 'ACTIVE')
            filterObj['isActive'] = true;
        if (status === 'INACTIVE')
            filterObj['isActive'] = false;
        return filterObj;
    }, [search, status]);

    const options = useMemo(() => ({
        page,
        limit: pageSize,
        sort: { [sortField]: sortOrder === 'desc' ? -1 : 1 },
        populate: ['createdBy'],
    }), [page, pageSize, sortField, sortOrder]);

    const {
        advertisements,
        totalDocs,
        loading,
        refetch,
    } = useGetAdvertisements(filter, options);

    const { createAdvertisement, loading: creating } = useCreateAdvertisement();
    const { updateAdvertisement, loading: updating } = useUpdateAdvertisement();
    const { deleteAdvertisement, loading: deleting } = useDeleteAdvertisement();

    const _handleCreateAd = useCallback(() => {
        adFormRef.current?.open();
    }, []);

    const _handleEditAd = useCallback((ad: T_Advertisement) => {
        adFormRef.current?.open(ad);
    }, []);

    const _handleDeleteAd = useCallback((ad: T_Advertisement) => {
        setDeletingAd(ad);
    }, []);

    const _handleConfirmDelete = useCallback(async () => {
        if (deletingAd?.id) {
            await deleteAdvertisement({ id: deletingAd.id });
            setDeletingAd(null);
            refetch();
        }
    }, [deletingAd, deleteAdvertisement, refetch]);

    const _handleCreateSubmit = useCallback(async (data: Input_CreateAdvertisement) => {
        await createAdvertisement(data);
        refetch();
    }, [createAdvertisement, refetch]);

    const _handleUpdateSubmit = useCallback(async (id: string, data: Input_UpdateAdvertisement) => {
        await updateAdvertisement({ id }, data);
        refetch();
    }, [updateAdvertisement, refetch]);

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

    const _handleStatusChange = useCallback((value: 'ALL' | 'ACTIVE' | 'INACTIVE') => {
        setStatus(value);
        setPage(1);
    }, []);

    const _handleSortChange = useCallback((field: string, order: string) => {
        setSortField(field);
        setSortOrder(order as 'asc' | 'desc');
        setPage(1);
    }, []);

    const _handleToggleStatus = useCallback(async (adId: string, currentIsActive: boolean) => {
        setUpdatingStatusId(adId);
        try {
            const advertisement = advertisements.find(ad => ad.id === adId);
            if (!advertisement) {
                throw new Error('Advertisement not found');
            }

            await updateAdvertisement(
                { id: adId },
                {
                    name: advertisement.name,
                    isActive: !currentIsActive,
                    slot: advertisement.slot,
                    targetURL: advertisement.targetURL,
                    startDate: advertisement.startDate,
                    endDate: advertisement.endDate,
                    image: advertisement.image,
                    placementType: advertisement.placementType,
                    placementId: advertisement.placementId,
                },
            );
            refetch();
        }
        catch (error) {
            console.error('Error toggling advertisement status:', error);
        }
        finally {
            setUpdatingStatusId(null);
        }
    }, [updateAdvertisement, refetch, advertisements]);

    const totalAds = advertisements.length;
    const totalClicks = advertisements.reduce((sum, ad) => sum + (ad.clickCount || 0), 0);
    const avgClicks = totalAds > 0 ? Math.round(totalClicks / totalAds) : 0;

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-6 animate-fade-in-up">
            <div className="w-full mx-auto space-y-8">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/20 dark:border-gray-700/50 hover:shadow-2xl transition-all duration-300 hover:scale-105">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('total-ads')}</p>
                                <p className="text-3xl font-bold text-gray-900 dark:text-white">{totalAds}</p>
                            </div>
                            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                                <BarChart3 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/20 dark:border-gray-700/50 hover:shadow-2xl transition-all duration-300 hover:scale-105">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('total-clicks')}</p>
                                <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{totalClicks.toLocaleString()}</p>
                            </div>
                            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                                <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/20 dark:border-gray-700/50 hover:shadow-2xl transition-all duration-300 hover:scale-105">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('avg-clicks')}</p>
                                <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">{avgClicks}</p>
                            </div>
                            <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-xl">
                                <Zap className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                            </div>
                        </div>
                    </div>
                </div>
                {/* Main List & Form */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="w-full mx-auto">
                    <AdvertisementList
                        advertisements={advertisements}
                        loading={loading}
                        onEditAdvertisement={_handleEditAd}
                        onCreateAdvertisement={_handleCreateAd}
                        onDeleteAdvertisement={_handleDeleteAd}
                        onToggleStatus={_handleToggleStatus}
                        updatingStatusId={updatingStatusId ?? undefined}
                        totalDocs={totalDocs}
                        page={page}
                        pageSize={pageSize}
                        onPageChange={_handlePageChange}
                        onPageSizeChange={_handlePageSizeChange}
                        search={search}
                        onSearchChange={_handleSearchChange}
                        selectedStatus={status}
                        onStatusChange={_handleStatusChange}
                        sortField={sortField}
                        sortOrder={sortOrder}
                        onSortChange={_handleSortChange}
                    />
                </motion.div>
                <AdvertisementForm
                    ref={adFormRef}
                    onCreateSubmit={_handleCreateSubmit}
                    onUpdateSubmit={_handleUpdateSubmit}
                    creating={creating}
                    updating={updating}
                    existingAdvertisements={advertisements}
                />
                <ConfirmDialog
                    open={!!deletingAd}
                    title={t('delete-advertisement')}
                    description={t('confirm-delete-advertisement')}
                    onConfirm={_handleConfirmDelete}
                    onCancel={() => setDeletingAd(null)}
                    loading={deleting}
                />
            </div>
        </div>
    );
}

export default AdvertisementPage;
