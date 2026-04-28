import type { ColumnDef } from '@tanstack/react-table';

import { Check, Edit2, Globe, Plus, Trash2, Users, X } from 'lucide-react';
import { motion } from 'motion/react';

import type { T_Pricing } from '#shared/graphql';

import { Badge, Button, Pagination, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '#shared/component';
import { DataTable } from '#shared/component/data-table';
import { E_PricingType } from '#shared/graphql';
import { useTranslate } from '#shared/i18n';
import { cn } from '#shared/util';

import type { I_PricingListProps } from './pricing.type';

const pricingTypeIcons = {
    [E_PricingType.MEMBERSHIP]: <Users className="h-4 w-4" />,
    [E_PricingType.ANNOUNCEMENT]: <Globe className="h-4 w-4" />,
};

const pricingTypeGradients = {
    [E_PricingType.MEMBERSHIP]: 'from-blue-400 via-cyan-400 to-blue-600',
    [E_PricingType.ANNOUNCEMENT]: 'from-purple-400 via-violet-400 to-purple-600',
};

export function PricingList({
    prices,
    loading,
    onEditPrice,
    onCreatePrice,
    onDeletePrice,
    onToggleStatus,
    updatingStatusId,
    totalDocs = 0,
    page = 1,
    pageSize = 10,
    onPageChange,
    onPageSizeChange,
    search = '',
    onSearchChange,
    selectedType = 'ALL',
    onTypeChange,
    selectedStatus = 'ALL',
    onStatusChange,
    countries,
}: I_PricingListProps) {
    const { t } = useTranslate('pricing');

    const pricingTypeOptions = [
        { value: 'ALL', label: t('all-types'), icon: <Globe className="h-4 w-4" /> },
        { value: E_PricingType.MEMBERSHIP, label: t('membership'), icon: pricingTypeIcons[E_PricingType.MEMBERSHIP] },
        { value: E_PricingType.ANNOUNCEMENT, label: t('announcement'), icon: pricingTypeIcons[E_PricingType.ANNOUNCEMENT] },
    ];

    const statusOptions = [
        { value: 'ALL', label: t('all-statuses'), icon: <Globe className="h-4 w-4" /> },
        { value: 'ACTIVE', label: t('active'), icon: <Check className="h-4 w-4" /> },
        { value: 'INACTIVE', label: t('inactive'), icon: <X className="h-4 w-4" /> },
    ];

    const _calculateTotal = (price?: number | null, taxRate?: number | null): number => {
        if (typeof price !== 'number')
            return 0;
        const rate = typeof taxRate === 'number' ? taxRate : 0;
        return price + (price * rate) / 100;
    };

    const columns: ColumnDef<T_Pricing>[] = [
        {
            accessorKey: 'countryId',
            header: t('country'),
            cell: ({ row }) => {
                const price = row.original;
                return (
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg">
                            <Globe size={16} className="text-white" />
                        </div>
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                            {price?.country?.name || countries.find(country => country?.id === price?.countryId)?.name}
                        </span>
                    </div>
                );
            },
        },
        {
            accessorKey: 'stateId',
            header: t('state'),
            cell: ({ row }) => {
                const price = row.original;
                return (
                    <div className="text-gray-900 dark:text-gray-100">
                        {price?.state?.name || '-'}
                    </div>
                );
            },
        },
        {
            accessorKey: 'type',
            header: t('type'),
            cell: ({ row }) => {
                const price = row.original;
                const gradient = pricingTypeGradients[price?.type as E_PricingType];
                const icon = pricingTypeIcons[price?.type as E_PricingType];
                return (
                    <Badge className={`bg-gradient-to-r ${gradient} text-white border-0`}>
                        <div className="flex items-center space-x-2">
                            {icon}
                            <span>{price?.type === E_PricingType.MEMBERSHIP ? t('membership') : t('announcement')}</span>
                        </div>
                    </Badge>
                );
            },
        },
        {
            accessorKey: 'price',
            header: t('price'),
            cell: ({ row }) => {
                const price = row.original;
                const currencySymbol = price?.currency?.symbol || '€';
                return (
                    <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {currencySymbol}
                        {price?.price?.toFixed(2)}
                    </div>
                );
            },
        },
        {
            accessorKey: 'taxRate',
            header: t('tax-rate'),
            cell: ({ row }) => {
                const price = row.original;
                return (
                    <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {price?.taxRate}
                        %
                    </div>
                );
            },
        },
        {
            accessorKey: 'total',
            header: t('total'),
            cell: ({ row }) => {
                const price = row.original;
                const total = _calculateTotal(price?.price, price?.taxRate);
                const currencySymbol = price?.currency?.symbol || '€';
                return (
                    <div className="text-lg font-bold text-green-600 dark:text-green-400">
                        {currencySymbol}
                        {total.toFixed(2)}
                    </div>
                );
            },
        },
        {
            accessorKey: 'isActive',
            header: t('status'),
            cell: ({ row }) => {
                const price = row.original;
                const isUpdating = updatingStatusId === price?.id;

                return (
                    <Button
                        variant="ghost"
                        onClick={() => price?.id && onToggleStatus?.(price.id, !price?.isActive)}
                        disabled={isUpdating}
                        className={cn(
                            'px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full transition-all duration-200',
                            price?.isActive
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50'
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600',
                        )}
                    >
                        {isUpdating
                            ? (
                                    <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin mr-1" />
                                )
                            : (
                                    <span className="mr-1">{price?.isActive ? '✓' : '○'}</span>
                                )}
                        {price?.isActive ? t('active') : t('inactive')}
                    </Button>
                );
            },
        },
        {
            id: 'actions',
            header: t('actions'),
            cell: ({ row }) => {
                const price = row.original;

                return (
                    <div className="flex items-center space-x-2">
                        <Button
                            variant="ghost"
                            onClick={() => onEditPrice?.(price)}
                            className="text-blue-600 hover:text-blue-900 dark:hover:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg p-2 transition-all duration-300"
                        >
                            <Edit2 size={18} />
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={() => onDeletePrice?.(price)}
                            className="text-red-600 hover:text-red-900 dark:hover:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg p-2 transition-all duration-300"
                        >
                            <Trash2 size={18} />
                        </Button>
                    </div>
                );
            },
        },
    ];

    return (
        <div className="space-y-6">
            {/* Header and Controls */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="bg-white/90 dark:bg-gray-800/95 backdrop-blur-xl rounded-2xl border border-white/30 dark:border-gray-600/50 shadow-xl p-6"
            >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex flex-wrap gap-4">
                        {/* Country Filter */}
                        <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {t('country')}
                                :
                            </span>
                            <Select value={search || 'ALL'} onValueChange={onSearchChange}>
                                <SelectTrigger className="w-40 h-8">
                                    <SelectValue placeholder={t('all-countries')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">
                                        {t('all-countries')}
                                    </SelectItem>
                                    {countries.map(country => (
                                        <SelectItem key={country?.id} value={country?.id || 'ALL'}>
                                            {country?.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Type Filter */}
                        <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {t('type')}
                                :
                            </span>
                            <Select value={selectedType} onValueChange={onTypeChange}>
                                <SelectTrigger className="w-40 h-8">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {pricingTypeOptions.map(({ value, label, icon }) => (
                                        <SelectItem key={value} value={value}>
                                            <div className="flex items-center space-x-2">
                                                {icon}
                                                <span>{label}</span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Status Filter */}
                        <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {t('status')}
                                :
                            </span>
                            <Select value={selectedStatus} onValueChange={onStatusChange}>
                                <SelectTrigger className="w-40 h-8">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {statusOptions.map(({ value, label, icon }) => (
                                        <SelectItem key={value} value={value}>
                                            <div className="flex items-center space-x-2">
                                                {icon}
                                                <span>{label}</span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Table View */}
            <DataTable
                columns={columns}
                data={prices}
                searchPlaceholder={t('search-prices')}
                showPagination={false}
                showToolbar={false}
                showColumnVisibility={true}
                pageSize={pageSize}
                pageSizeOptions={[10, 20, 30, 40, 50]}
                page={page}
                totalItems={totalDocs}
                onPageChange={onPageChange}
                onPageSizeChange={onPageSizeChange}
            />

            {/* Pagination for Table */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/90 dark:bg-gray-800/95 backdrop-blur-xl rounded-2xl border border-white/30 dark:border-gray-600/50 shadow-xl"
            >
                <Pagination
                    total={totalDocs}
                    page={page}
                    limit={pageSize}
                    onPageChange={onPageChange}
                    onLimitChange={onPageSizeChange}
                    hasNextPage={page * pageSize < totalDocs}
                    hasPrevPage={page > 1}
                    totalPages={Math.ceil(totalDocs / pageSize)}
                    className="border-0 bg-transparent"
                />
            </motion.div>

            {/* Empty State */}
            {!loading && prices.length === 0 && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-16"
                >
                    <div className="mx-auto w-24 h-24 bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-800/30 dark:to-blue-800/30 rounded-full flex items-center justify-center mb-6 shadow-xl">
                        <Globe className="h-12 w-12 text-purple-500 dark:text-purple-400" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">{t('no-prices-found')}</h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-6">{t('no-prices-description')}</p>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button onClick={onCreatePrice} className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-xl hover:shadow-2xl px-6 py-3 rounded-xl font-semibold">
                            <Plus className="h-4 w-4 mr-2" />
                            {t('create-first-price')}
                        </Button>
                    </motion.div>
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
                        onClick={onCreatePrice}
                        className="h-14 w-14 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-2xl hover:shadow-3xl transition-all duration-300"
                    >
                        <Plus className="h-6 w-6" />
                    </Button>
                </motion.div>
            </motion.div>
        </div>
    );
}
