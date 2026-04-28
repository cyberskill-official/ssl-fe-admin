import { Loading } from '@cyberskill/shared/react/loading';
import { Grid3X3, List, Plus, Search, SlidersHorizontal } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';

import { Badge, Button } from '#shared/component';
import { useTranslate } from '#shared/i18n';

import type { I_PromoCodeGridProps } from './promo-code.type';

import { PromoCodeCard } from './promo-code-card';
import { PromoCodeList } from './promo-code-list';

export function PromoCodeGrid({
    promoCodes,
    loading,
    onEditPromoCode,
    onCreatePromoCode,
    onDeletePromoCode,
    onToggleStatus,
    updatingStatusId,
    totalDocs,
    page,
    pageSize,
    onPageChange,
    onPageSizeChange,
    search,
    onSearchChange,
    viewMode = 'grid',
    onViewModeChange,
}: I_PromoCodeGridProps) {
    const { t } = useTranslate('promoCodes');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [expiryFilter, setExpiryFilter] = useState<string>('all');

    const filteredPromoCodes = promoCodes.filter((promoCode) => {
        const isActive = promoCode.isActive || false;
        const isExpired = promoCode.expiresAt ? new Date(promoCode.expiresAt) < new Date() : false;
        const isExpiringSoon = promoCode.expiresAt
            ? {
                    daysLeft: Math.ceil((new Date(promoCode.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
                }
            : null;
        const isLifetime = !promoCode.expiresAt || (promoCode.expiresAt && new Date(promoCode.expiresAt).getFullYear() >= 3000);

        // Status filter
        if (statusFilter === 'active' && !isActive)
            return false;
        if (statusFilter === 'inactive' && isActive)
            return false;
        if (statusFilter === 'expired' && !isExpired)
            return false;
        if (statusFilter === 'expiring-soon' && (!isExpiringSoon || isExpiringSoon.daysLeft > 7))
            return false;

        // Expiry filter
        if (expiryFilter === 'lifetime' && !isLifetime)
            return false;
        if (expiryFilter === 'temporary' && isLifetime)
            return false;
        if (expiryFilter === 'expiring-this-week' && (!isExpiringSoon || isExpiringSoon.daysLeft > 7))
            return false;

        return true;
    });

    const getStatusCounts = () => {
        const now = new Date();
        const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

        return {
            'all': promoCodes.length,
            'active': promoCodes.filter(code => code.isActive).length,
            'inactive': promoCodes.filter(code => !code.isActive).length,
            'expired': promoCodes.filter(code => code.expiresAt && new Date(code.expiresAt) < now).length,
            'expiring-soon': promoCodes.filter(code =>
                code.expiresAt
                && new Date(code.expiresAt) <= sevenDaysFromNow
                && new Date(code.expiresAt) > now,
            ).length,
        };
    };

    const statusCounts = getStatusCounts();

    const statusFilterOptions = [
        { value: 'all', label: t('all-statuses'), count: statusCounts.all },
        { value: 'active', label: t('active'), count: statusCounts.active },
        { value: 'inactive', label: t('inactive'), count: statusCounts.inactive },
        { value: 'expired', label: t('expired'), count: statusCounts.expired },
        { value: 'expiring-soon', label: t('expiring-soon'), count: statusCounts['expiring-soon'] },
    ];

    const expiryFilterOptions = [
        { value: 'all', label: t('all-types') },
        { value: 'lifetime', label: t('lifetime-benefit') },
        { value: 'temporary', label: t('temporary') },
        { value: 'expiring-this-week', label: t('expiring-this-week') },
    ];

    return (
        <div className="space-y-6">
            {loading && <Loading />}
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="flex flex-col sm:flex-row sm:items-center justify-end gap-4"
            >
                <Button
                    size="sm"
                    onClick={onCreatePromoCode}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                >
                    <Plus className="w-4 h-4 mr-1" />
                    {t('create-promo-code')}
                </Button>
            </motion.div>
            {/* Filters and Search */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-lg border border-gray-200 dark:border-gray-700"
            >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

                    {/* View Mode Toggle */}
                    <div className="flex items-center gap-2">
                        <Button
                            variant={viewMode === 'grid' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => onViewModeChange?.('grid')}
                            className="flex-1"
                        >
                            <Grid3X3 className="w-4 h-4" />
                        </Button>
                        <Button
                            variant={viewMode === 'list' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => onViewModeChange?.('list')}
                            className="flex-1"
                        >
                            <List className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
                {/* Active Filters Display */}
                {(statusFilter !== 'all' || expiryFilter !== 'all') && (
                    <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <SlidersHorizontal className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                            {t('active-filters')}
                            :
                        </span>
                        {statusFilter !== 'all' && (
                            <Badge variant="outline" className="text-xs">
                                {statusFilterOptions.find(opt => opt.value === statusFilter)?.label}
                            </Badge>
                        )}
                        {expiryFilter !== 'all' && (
                            <Badge variant="outline" className="text-xs">
                                {expiryFilterOptions.find(opt => opt.value === expiryFilter)?.label}
                            </Badge>
                        )}
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                setStatusFilter('all');
                                setExpiryFilter('all');
                            }}
                            className="text-xs text-red-600 hover:text-red-700"
                        >
                            {t('clear-all')}
                        </Button>
                    </div>
                )}
            </motion.div>
            {/* Results Count */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400"
            >
                <span>
                    {t('showing')}
                    {' '}
                    {filteredPromoCodes.length}
                    {' '}
                    {t('of')}
                    {' '}
                    {totalDocs}
                    {' '}
                    {t('promo-code')}
                </span>
            </motion.div>
            {/* Content */}
            <AnimatePresence mode="wait">
                {viewMode === 'grid'
                    ? (
                            <motion.div
                                key="grid"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                {filteredPromoCodes.length === 0
                                    ? (
                                            <motion.div
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="text-center py-12"
                                            >
                                                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                                                    <Search className="w-8 h-8 text-gray-400" />
                                                </div>
                                                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                                                    {t('no-promo-code-found')}
                                                </h3>
                                                <p className="text-gray-600 dark:text-gray-400 mb-4">
                                                    {t('no-promo-code-description')}
                                                </p>
                                                <Button onClick={onCreatePromoCode}>
                                                    <Plus className="w-4 h-4 mr-2" />
                                                    {t('create-first-promo-code')}
                                                </Button>
                                            </motion.div>
                                        )
                                    : (
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                                {filteredPromoCodes
                                                    .slice(((page ?? 1) - 1) * (pageSize ?? 10), (page ?? 1) * (pageSize ?? 10))
                                                    .map((promoCode, index) => (
                                                        <motion.div
                                                            key={promoCode.id}
                                                            initial={{ opacity: 0, y: 20 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            transition={{ duration: 0.3, delay: index * 0.1 }}
                                                        >
                                                            <PromoCodeCard
                                                                promoCode={promoCode}
                                                                onEdit={onEditPromoCode!}
                                                                onDelete={onDeletePromoCode!}
                                                                onToggleStatus={onToggleStatus!}
                                                                updatingStatusId={updatingStatusId}
                                                                t={t}
                                                            />
                                                        </motion.div>
                                                    ))}
                                            </div>
                                        )}
                                {/* Grid Pagination */}
                                {filteredPromoCodes.length > 0 && (
                                    <div className="mt-6">
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1 text-sm text-muted-foreground">
                                                {t('showing')}
                                                {' '}
                                                {((page ?? 1) - 1) * (pageSize ?? 10) + 1}
                                                -
                                                {Math.min((page ?? 1) * (pageSize ?? 10), filteredPromoCodes.length)}
                                                {' '}
                                                {t('of')}
                                                {' '}
                                                {filteredPromoCodes.length}
                                            </div>
                                            <div className="flex items-center space-x-6 lg:space-x-8">
                                                <div className="flex items-center space-x-2">
                                                    <p className="text-sm font-medium">{t('rows-per-page')}</p>
                                                    <select
                                                        value={pageSize ?? 10}
                                                        onChange={(e) => {
                                                            onPageSizeChange?.(Number(e.target.value));
                                                            onPageChange?.(1);
                                                        }}
                                                        className="h-8 w-[70px] rounded-md border border-input bg-background px-2 text-sm"
                                                    >
                                                        {[10, 20, 30, 40, 50].map(size => (
                                                            <option key={size} value={size}>
                                                                {size}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="flex w-[100px] items-center justify-center text-sm font-medium">
                                                    {t('page')}
                                                    {' '}
                                                    {page ?? 1}
                                                    {' '}
                                                    {t('of')}
                                                    {' '}
                                                    {Math.ceil(filteredPromoCodes.length / (pageSize ?? 10))}
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => onPageChange?.(1)}
                                                        disabled={(page ?? 1) === 1}
                                                        className="hidden h-8 w-8 rounded-md border border-input bg-background p-0 lg:flex items-center justify-center disabled:opacity-50"
                                                    >
                                                        <span className="sr-only">{t('first-page')}</span>
                                                        <span>«</span>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => onPageChange?.((page ?? 1) - 1)}
                                                        disabled={(page ?? 1) === 1}
                                                        className="h-8 w-8 rounded-md border border-input bg-background p-0 flex items-center justify-center disabled:opacity-50"
                                                    >
                                                        <span className="sr-only">{t('previous-page')}</span>
                                                        <span>‹</span>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => onPageChange?.((page ?? 1) + 1)}
                                                        disabled={(page ?? 1) >= Math.ceil(filteredPromoCodes.length / (pageSize ?? 10))}
                                                        className="h-8 w-8 rounded-md border border-input bg-background p-0 flex items-center justify-center disabled:opacity-50"
                                                    >
                                                        <span className="sr-only">{t('next-page')}</span>
                                                        <span>›</span>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => onPageChange?.(Math.ceil(filteredPromoCodes.length / (pageSize ?? 10)))}
                                                        disabled={(page ?? 1) >= Math.ceil(filteredPromoCodes.length / (pageSize ?? 10))}
                                                        className="hidden h-8 w-8 rounded-md border border-input bg-background p-0 lg:flex items-center justify-center disabled:opacity-50"
                                                    >
                                                        <span className="sr-only">{t('last-page')}</span>
                                                        <span>»</span>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        )
                    : (
                            <motion.div
                                key="list"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                <PromoCodeList
                                    promoCodes={filteredPromoCodes}
                                    loading={loading}
                                    onEditPromoCode={onEditPromoCode}
                                    onCreatePromoCode={onCreatePromoCode}
                                    onDeletePromoCode={onDeletePromoCode}
                                    onToggleStatus={onToggleStatus}
                                    updatingStatusId={updatingStatusId}
                                    totalDocs={filteredPromoCodes.length}
                                    page={page}
                                    pageSize={pageSize}
                                    onPageChange={onPageChange}
                                    onPageSizeChange={onPageSizeChange}
                                    search={search}
                                    onSearchChange={onSearchChange}
                                />
                            </motion.div>
                        )}
            </AnimatePresence>
        </div>
    );
}
