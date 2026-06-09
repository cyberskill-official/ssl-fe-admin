import type { Row } from '@tanstack/react-table';

import { Edit, Grid3X3, List, MousePointer, Plus, SlidersHorizontal, Trash2 } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';

import type { T_Advertisement } from '#shared/graphql';

import { Badge, Button, Input, Pagination, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '#shared/component';
import { DataTable } from '#shared/component/data-table';
import { useTranslate } from '#shared/i18n';

import type { I_AdvertisementListProps } from './advertisement.type';

import { AdvertisementCard } from './advertisement-card';

export function AdvertisementList({
    advertisements,
    loading,
    onEditAdvertisement,
    onCreateAdvertisement,
    onDeleteAdvertisement,
    onToggleStatus,
    updatingStatusId,
    totalDocs = 0,
    page = 1,
    pageSize = 10,
    onPageChange,
    onPageSizeChange,
    search = '',
    onSearchChange,
    selectedStatus = 'ALL',
    onStatusChange,
    sortField = 'createdAt',
    sortOrder = 'desc',
    onSortChange,
}: I_AdvertisementListProps & {
    selectedStatus?: 'ALL' | 'ACTIVE' | 'INACTIVE';
    onStatusChange?: (status: 'ALL' | 'ACTIVE' | 'INACTIVE') => void;
    sortField?: string;
    sortOrder?: string;
    onSortChange?: (field: string, order: string) => void;
}) {
    const { t } = useTranslate('advertisement');
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

    const sortOptions = [
        { value: 'createdAt-desc', label: t('newest-first'), field: 'createdAt', order: 'desc' },
        { value: 'createdAt-asc', label: t('oldest-first'), field: 'createdAt', order: 'asc' },
        { value: 'name-asc', label: t('name-a-z'), field: 'name', order: 'asc' },
        { value: 'name-desc', label: t('name-z-a'), field: 'name', order: 'desc' },
    ];

    const statusOptions = [
        { value: 'ALL', label: t('all'), color: 'gray' },
        { value: 'ACTIVE', label: t('active'), color: 'green' },
        { value: 'INACTIVE', label: t('inactive'), color: 'red' },
    ];

    const getPlacementLabel = (placementType: unknown) => {
        switch (placementType) {
            case 'DASHBOARD':
                return t('placement-dashboard');
            case 'CLUB':
                return t('placement-club');
            case 'RESORT':
                return t('placement-resort');
            case 'BLOG':
                return t('placement-blog');
            case 'PODCAST':
                return t('placement-podcast');
            default:
                return '-';
        }
    };

    const currentSortValue = `${sortField}-${sortOrder}`;

    const columns = [
        {
            accessorKey: 'name',
            header: t('ad-name'),
            cell: ({ row }: { row: Row<T_Advertisement> }) => (
                <div className="font-semibold text-gray-900 dark:text-gray-100">{row.getValue('name')}</div>
            ),
        },
        {
            accessorKey: 'placementType',
            header: t('placement-type'),
            cell: ({ row }: { row: Row<T_Advertisement> }) => (
                <Badge variant="outline" className="text-xs">
                    {getPlacementLabel(row.getValue('placementType'))}
                </Badge>
            ),
        },
        {
            id: 'placement',
            header: t('placement'),
            cell: ({ row }: { row: Row<T_Advertisement> }) => (
                <div className="text-sm text-gray-600 dark:text-gray-300">
                    {row.original.placementDestination?.name || row.original.placementBlog?.title || (row.original.placementType === 'DASHBOARD' ? t('placement-dashboard') : '-')}
                </div>
            ),
        },
        {
            accessorKey: 'isActive',
            header: t('status'),
            cell: ({ row }: { row: Row<T_Advertisement> }) => (
                <Badge className={row.getValue('isActive') ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}>
                    {row.getValue('isActive') ? t('active') : t('inactive')}
                </Badge>
            ),
        },
        {
            accessorKey: 'clickCount',
            header: t('clicks'),
            cell: ({ row }: { row: Row<T_Advertisement> }) => (
                <div className="flex items-center gap-1">
                    <MousePointer className="h-3 w-3 text-blue-500" />
                    <span className="font-medium">{row.getValue('clickCount') || 0}</span>
                </div>
            ),
        },

        {
            accessorKey: 'createdBy',
            header: t('created-by'),
            cell: ({ row }: { row: Row<T_Advertisement> }) => (
                <div className="text-sm text-gray-600 dark:text-gray-300">{row.original.createdBy?.username || '-'}</div>
            ),
        },
        {
            id: 'actions',
            header: t('actions'),
            cell: ({ row }: { row: Row<T_Advertisement> }) => (
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => onEditAdvertisement?.(row.original)} className="h-8 px-3">
                        <Edit className="h-3 w-3 mr-1" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => onDeleteAdvertisement?.(row.original)} className="h-8 px-3 text-red-600 hover:text-red-700">
                        <Trash2 className="h-3 w-3" />
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <div className="   space-y-6">
            {/* Search and Filters */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white/90 dark:bg-gray-800/95 backdrop-blur-xl rounded-2xl border border-white/30 dark:border-gray-600/50 p-6 shadow-xl">
                <div className="flex items-center gap-4 flex-wrap">
                    <div className="relative flex-1 min-w-[300px]">
                        <Input
                            placeholder={t('search-advertisements')}
                            value={search}
                            onChange={e => onSearchChange?.(e.target.value)}
                            className="pl-10 h-12 border-0 bg-white/70 dark:bg-gray-700/80 backdrop-blur-sm focus:bg-white dark:focus:bg-gray-600 focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 rounded-xl shadow-lg"
                        />
                    </div>
                    <Select value={selectedStatus} onValueChange={value => onStatusChange?.(value as 'ALL' | 'ACTIVE' | 'INACTIVE')}>
                        <SelectTrigger className="h-12 w-40 border-0 bg-white/70 dark:bg-gray-700/80 backdrop-blur-sm rounded-xl shadow-lg text-gray-900 dark:text-gray-100">
                            <SelectValue placeholder={t('select-status')} />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                            {statusOptions.map(option => (
                                <SelectItem key={option.value} value={option.value} className="text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700">
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select
                        value={currentSortValue}
                        onValueChange={(value) => {
                            const option = sortOptions.find(opt => opt.value === value);
                            if (option && onSortChange) {
                                onSortChange(option.field, option.order);
                            }
                        }}
                    >
                        <SelectTrigger className="h-12 w-48 border-0 bg-white/70 dark:bg-gray-700/80 backdrop-blur-sm rounded-xl shadow-lg text-gray-900 dark:text-gray-100">
                            <SelectValue placeholder={t('sort-by')} />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                            {sortOptions.map(option => (
                                <SelectItem key={option.value} value={option.value} className="text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700">
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <div className="flex items-center gap-2 bg-white/70 dark:bg-gray-700/80 backdrop-blur-sm rounded-xl p-1 shadow-lg">
                        <Button variant={viewMode === 'grid' ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode('grid')} className="h-8 px-3"><Grid3X3 className="h-4 w-4" /></Button>
                        <Button variant={viewMode === 'table' ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode('table')} className="h-8 px-3"><List className="h-4 w-4" /></Button>
                    </div>
                </div>
                {/* Active Filters Display */}
                {(selectedStatus !== 'ALL') && (
                    <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <SlidersHorizontal className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                            {t('active-filters')}
                        </span>
                        <span>:</span>
                        <Badge variant="outline" className="text-xs">
                            {statusOptions.find(opt => opt.value === selectedStatus)?.label || ''}
                        </Badge>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onStatusChange?.('ALL')}
                            className="text-xs text-red-600 hover:text-red-700"
                        >
                            {t('clear-all')}
                        </Button>
                    </div>
                )}
            </motion.div>
            {/* Content */}
            {viewMode === 'grid'
                ? (
                        <motion.div variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } }} initial="hidden" animate="visible" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            <AnimatePresence>
                                {advertisements.map((ad, idx) => (
                                    <AdvertisementCard
                                        key={ad.id}
                                        ad={ad}
                                        idx={idx}
                                        onEdit={onEditAdvertisement}
                                        onDelete={onDeleteAdvertisement}
                                        onToggleStatus={onToggleStatus}
                                        updatingStatusId={updatingStatusId}
                                        t={t}
                                    />
                                ))}
                            </AnimatePresence>
                        </motion.div>
                    )
                : (
                        <DataTable
                            columns={columns}
                            data={advertisements}
                            searchKey="name"
                            searchPlaceholder={t('search-advertisements')}
                            showPagination={false}
                            showToolbar={false}
                            showColumnVisibility={true}
                            pageSize={pageSize}
                            pageSizeOptions={[10, 20, 50, 100]}
                            page={page}
                            totalItems={totalDocs}
                            onPageChange={onPageChange}
                            onPageSizeChange={onPageSizeChange}
                            searchValue={search}
                            onSearchChange={onSearchChange}
                        />
                    )}
            {/* Pagination */}
            {totalDocs > 0 && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white/90 dark:bg-gray-800/95 backdrop-blur-xl rounded-2xl border border-white/30 dark:border-gray-600/50 shadow-xl">
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
                        sticky={false}
                    />
                </motion.div>
            )}
            {/* Empty State */}
            {!loading && advertisements.length === 0 && (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-16">
                    <div className="mx-auto w-24 h-24 bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-800/30 dark:to-blue-800/30 rounded-full flex items-center justify-center mb-6 shadow-xl">
                        <Plus className="h-12 w-12 text-purple-500 dark:text-purple-400" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">{t('no-advertisements-found')}</h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-6">{t('no-advertisements-description')}</p>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button onClick={onCreateAdvertisement} className="bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-xl hover:shadow-2xl px-6 py-3 rounded-xl font-semibold">
                            <Plus className="h-4 w-4 mr-2" />
                            {t('create-first-advertisement')}
                        </Button>
                    </motion.div>
                </motion.div>
            )}
            {/* Floating Create Button */}
            <motion.div initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} className="fixed bottom-6 right-6 z-50">
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                    <Button onClick={onCreateAdvertisement} className="h-14 w-14 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-2xl hover:shadow-3xl transition-all duration-300">
                        <Plus className="h-6 w-6" />
                    </Button>
                </motion.div>
            </motion.div>
        </div>
    );
}
