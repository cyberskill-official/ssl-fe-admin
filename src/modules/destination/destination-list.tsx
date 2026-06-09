import type { ColumnDef } from '@tanstack/react-table';

import { Loading } from '@cyberskill/shared/react/loading';
import {
    Building,
    Edit,
    Grid3X3,
    List,
    MapPin,
    Plus,
    Search,
    SlidersHorizontal,
    Star,
    Trash2,
    Users,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';

import type { T_Destination } from '#shared/graphql';

import {
    Badge,
    Button,
    Input,
    Pagination,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    Switch,
} from '#shared/component';
import { DataTable } from '#shared/component/data-table';
import { useTranslate } from '#shared/i18n';

import type { I_DestinationListProps } from './destination.type';

import { DestinationCard } from './destination-card';

const destinationTypeIcons = {
    CLUB: <Building className="h-4 w-4" />,
    RESORT: <Building className="h-4 w-4" />,
};

const destinationTypeGradients = {
    CLUB: 'from-purple-400 via-violet-400 to-purple-600',
    RESORT: 'from-blue-400 via-cyan-400 to-blue-600',
};

const destinationTypeGlows = {
    CLUB: 'shadow-purple-500/30',
    RESORT: 'shadow-blue-500/30',
};

const ratingColors = {
    GOLD: 'from-yellow-400 to-amber-500',
    SILVER: 'from-gray-300 to-gray-400',
    BRONZE: 'from-amber-600 to-orange-700',
};

export function DestinationList({
    destinations,
    loading,
    onEditDestination,
    onCreateDestination,
    onDeleteDestination,
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
    selectedRating = 'ALL',
    onRatingChange,
    selectedStatus = 'ALL',
    onStatusChange,
    sortField = 'createdAt',
    sortOrder = 'desc',
    onSortChange,
}: I_DestinationListProps) {
    const { t } = useTranslate('destination');
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

    const destinationTypeOptions = [
        {
            value: 'ALL',
            label: t('all-types'),
            icon: <Building className="h-4 w-4" />,
        },
        { value: 'CLUB', label: t('club'), icon: <Building className="h-4 w-4" /> },
        {
            value: 'RESORT',
            label: t('resort'),
            icon: <Building className="h-4 w-4" />,
        },
    ];

    const ratingOptions = [
        {
            value: 'ALL',
            label: t('all-ratings'),
            icon: <Star className="h-4 w-4" />,
        },
        { value: 'GOLD', label: t('gold'), icon: <Star className="h-4 w-4" /> },
        { value: 'SILVER', label: t('silver'), icon: <Star className="h-4 w-4" /> },
        { value: 'BRONZE', label: t('bronze'), icon: <Star className="h-4 w-4" /> },
    ];

    const statusOptions = [
        {
            value: 'ALL',
            label: t('all-statuses'),
            icon: <Building className="h-4 w-4" />,
        },
        {
            value: 'ACTIVE',
            label: t('published'),
            icon: <Building className="h-4 w-4" />,
        },
        {
            value: 'INACTIVE',
            label: t('draft'),
            icon: <Building className="h-4 w-4" />,
        },
    ];

    const sortOptions = [
        {
            value: 'createdAt-desc',
            label: t('newest-first'),
            field: 'createdAt',
            order: 'desc',
        },
        {
            value: 'createdAt-asc',
            label: t('oldest-first'),
            field: 'createdAt',
            order: 'asc',
        },
        { value: 'name-asc', label: t('name-a-z'), field: 'name', order: 'asc' },
        { value: 'name-desc', label: t('name-z-a'), field: 'name', order: 'desc' },
        { value: 'type-asc', label: t('type-a-z'), field: 'type', order: 'asc' },
        { value: 'type-desc', label: t('type-z-a'), field: 'type', order: 'desc' },
        {
            value: 'rating-asc',
            label: t('rating-a-z'),
            field: 'rating',
            order: 'asc',
        },
        {
            value: 'rating-desc',
            label: t('rating-z-a'),
            field: 'rating',
            order: 'desc',
        },
    ];

    const currentSortValue = `${sortField}-${sortOrder}`;

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.05,
            },
        },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 10, scale: 0.95 },
        visible: {
            opacity: 1,
            y: 0,
            scale: 1,
            transition: {
                type: 'spring' as const,
                stiffness: 200,
                damping: 20,
            },
        },
    };

    // Table columns for DataTable
    const columns: ColumnDef<T_Destination>[] = [
        {
            accessorKey: 'name',
            header: t('name'),
            cell: ({ row }) => (
                <div className="flex items-center gap-3">
                    <div
                        className={`p-2 rounded-lg bg-gradient-to-br ${
                            destinationTypeGradients[
                                row.original.type as keyof typeof destinationTypeGradients
                            ] || 'from-gray-400 to-gray-600'
                        }`}
                    >
                        {destinationTypeIcons[
                            row.original.type as keyof typeof destinationTypeIcons
                        ] || <Building className="h-4 w-4 text-white" />}
                    </div>
                    <div>
                        <div className="font-semibold text-gray-900 dark:text-gray-100">
                            {row.getValue('name')}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-300">
                            {t(row.original.type?.toLowerCase() || 'unknown')}
                        </div>
                    </div>
                </div>
            ),
        },
        {
            accessorKey: 'location',
            header: t('location'),
            cell: ({ row }) => {
                const destination = row.original;
                const city = destination.location?.city?.name;
                const country = destination.location?.country?.name;

                return (
                    <div className="flex items-center gap-2">
                        <MapPin className="w-3 h-3 text-gray-500" />
                        <div className="text-sm">
                            <div className="font-medium text-gray-900 dark:text-gray-100">
                                {city || t('location-not-specified')}
                            </div>
                            {country && (
                                <div className="text-xs text-gray-600 dark:text-gray-300">
                                    {country}
                                </div>
                            )}
                        </div>
                    </div>
                );
            },
        },
        {
            accessorKey: 'rating',
            header: t('rating'),
            cell: ({ row }) => {
                const rating = row.getValue('rating') as string;
                return (
                    <div className="flex items-center gap-2">
                        <Badge
                            className={`bg-gradient-to-r ${
                                ratingColors[rating as keyof typeof ratingColors]
                                || 'from-gray-300 to-gray-400'
                            } text-white text-xs`}
                        >
                            {rating}
                        </Badge>
                    </div>
                );
            },
        },
        {
            accessorKey: 'ageGroup',
            header: t('age-group'),
            cell: ({ row }) => {
                const ageGroup = row.getValue('ageGroup') as string;
                return (
                    <div className="flex items-center gap-2">
                        <Users className="w-3 h-3 text-gray-500" />
                        <Badge variant="outline" className="text-xs">
                            {ageGroup?.replace('A', '').replace('_', '-') || '18-25'}
                        </Badge>
                    </div>
                );
            },
        },
        {
            accessorKey: 'isActive',
            header: t('status'),
            cell: ({ row }) => {
                const destination = row.original;
                const isActive = destination.isActive || false;
                return (
                    <div className="flex items-center gap-2">
                        <Switch
                            checked={isActive}
                            onCheckedChange={() =>
                                onToggleStatus?.(destination.id!, isActive)}
                            aria-label={t('toggle-status')}
                            disabled={updatingStatusId === destination.id}
                        />
                        <Badge
                            className={
                                isActive
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                    : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                            }
                        >
                            {isActive ? t('published') : t('draft')}
                        </Badge>
                    </div>
                );
            },
        },
        {
            accessorKey: 'createdAt',
            header: t('created'),
            cell: ({ row }) => (
                <div className="text-sm text-gray-600 dark:text-gray-300">
                    <div>{new Date(row.getValue('createdAt')).toLocaleDateString()}</div>
                    {row.original.createdBy?.username && (
                        <div className="text-xs">
                            by
                            {' '}
                            {row.original.createdBy.username}
                        </div>
                    )}
                </div>
            ),
        },
        {
            id: 'actions',
            header: t('actions'),
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEditDestination?.(row.original)}
                        className="h-8 px-3"
                    >
                        <Edit className="h-3 w-3 mr-1" />
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDeleteDestination?.(row.original)}
                        className="h-8 px-3 text-red-600 hover:text-red-700"
                    >
                        <Trash2 className="h-3 w-3" />
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            {loading && <Loading />}

            {/* Search and Filters */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/90 dark:bg-gray-800/95 backdrop-blur-xl rounded-2xl border border-white/30 dark:border-gray-600/50 p-6 shadow-xl"
            >
                <div className="flex items-center gap-4 flex-wrap">
                    <div className="relative flex-1 min-w-[300px]">
                        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500 dark:text-gray-400" />
                        <Input
                            placeholder={t('search-destinations')}
                            value={search}
                            onChange={e => onSearchChange?.(e.target.value)}
                            className="pl-10 h-12 border-0 bg-white/70 dark:bg-gray-700/80 backdrop-blur-sm focus:bg-white dark:focus:bg-gray-600 focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 rounded-xl shadow-lg"
                        />
                    </div>

                    <Select
                        value={selectedType}
                        onValueChange={value =>
                            onTypeChange?.(value as 'CLUB' | 'RESORT' | 'ALL')}
                    >
                        <SelectTrigger className="h-12 w-48 border-0 bg-white/70 dark:bg-gray-700/80 backdrop-blur-sm rounded-xl shadow-lg text-gray-900 dark:text-gray-100">
                            <SelectValue placeholder={t('select-type')} />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                            {destinationTypeOptions.map(option => (
                                <SelectItem
                                    key={option.value}
                                    value={option.value}
                                    className="text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700"
                                >
                                    <div className="flex items-center gap-2">
                                        {option.icon}
                                        {option.label}
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select
                        value={selectedRating}
                        onValueChange={value =>
                            onRatingChange?.(value as 'GOLD' | 'SILVER' | 'BRONZE' | 'ALL')}
                    >
                        <SelectTrigger className="h-12 w-48 border-0 bg-white/70 dark:bg-gray-700/80 backdrop-blur-sm rounded-xl shadow-lg text-gray-900 dark:text-gray-100">
                            <SelectValue placeholder={t('select-rating')} />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                            {ratingOptions.map(option => (
                                <SelectItem
                                    key={option.value}
                                    value={option.value}
                                    className="text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700"
                                >
                                    <div className="flex items-center gap-2">
                                        {option.icon}
                                        {option.label}
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select
                        value={selectedStatus}
                        onValueChange={value =>
                            onStatusChange?.(value as 'ACTIVE' | 'INACTIVE' | 'ALL')}
                    >
                        <SelectTrigger className="h-12 w-48 border-0 bg-white/70 dark:bg-gray-700/80 backdrop-blur-sm rounded-xl shadow-lg text-gray-900 dark:text-gray-100">
                            <SelectValue placeholder={t('select-status')} />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                            {statusOptions.map(option => (
                                <SelectItem
                                    key={option.value}
                                    value={option.value}
                                    className="text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700"
                                >
                                    <div className="flex items-center gap-2">
                                        {option.icon}
                                        {option.label}
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select
                        value={currentSortValue}
                        onValueChange={(value) => {
                            const option = sortOptions.find(opt => opt.value === value);
                            if (option && onSortChange) {
                                onSortChange(
                                    option.field as 'name' | 'type' | 'rating' | 'createdAt',
                                    option.order as 'asc' | 'desc',
                                );
                            }
                        }}
                    >
                        <SelectTrigger className="h-12 w-48 border-0 bg-white/70 dark:bg-gray-700/80 backdrop-blur-sm rounded-xl shadow-lg text-gray-900 dark:text-gray-100">
                            <SelectValue placeholder={t('sort-by')} />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                            {sortOptions.map(option => (
                                <SelectItem
                                    key={option.value}
                                    value={option.value}
                                    className="text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700"
                                >
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <div className="flex items-center gap-2 bg-white/70 dark:bg-gray-700/80 backdrop-blur-sm rounded-xl p-1 shadow-lg">
                        <Button
                            variant={viewMode === 'grid' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setViewMode('grid')}
                            className="h-8 px-3"
                        >
                            <Grid3X3 className="h-4 w-4" />
                        </Button>
                        <Button
                            variant={viewMode === 'table' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setViewMode('table')}
                            className="h-8 px-3"
                        >
                            <List className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Active Filters Display */}
                {(selectedType !== 'ALL'
                    || selectedRating !== 'ALL'
                    || selectedStatus !== 'ALL') && (
                    <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <SlidersHorizontal className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                            {t('active-filters')}
                            :
                        </span>
                        {selectedType !== 'ALL' && (
                            <Badge variant="outline" className="text-xs">
                                {
                                    destinationTypeOptions.find(
                                        opt => opt.value === selectedType,
                                    )?.label
                                }
                            </Badge>
                        )}
                        {selectedRating !== 'ALL' && (
                            <Badge variant="outline" className="text-xs">
                                {
                                    ratingOptions.find(opt => opt.value === selectedRating)
                                        ?.label
                                }
                            </Badge>
                        )}
                        {selectedStatus !== 'ALL' && (
                            <Badge variant="outline" className="text-xs">
                                {
                                    statusOptions.find(opt => opt.value === selectedStatus)
                                        ?.label
                                }
                            </Badge>
                        )}
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                onTypeChange?.('ALL');
                                onRatingChange?.('ALL');
                                onStatusChange?.('ALL');
                            }}
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
                    // Grid View
                        <motion.div
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4"
                        >
                            <AnimatePresence>
                                {destinations.map(destination => (
                                    <motion.div
                                        key={destination.id}
                                        variants={itemVariants}
                                        whileHover={{
                                            scale: 1.02,
                                            y: -4,
                                            transition: { duration: 0.2 },
                                        }}
                                        className={`group relative bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-xl border border-white/30 dark:border-gray-600/50 shadow-lg hover:shadow-xl transition-all duration-300 ${
                                            destinationTypeGlows[
                                                destination.type as keyof typeof destinationTypeGlows
                                            ] || 'shadow-gray-500/30'
                                        }`}
                                    >
                                        <DestinationCard
                                            destination={destination}
                                            onEdit={onEditDestination!}
                                            onDelete={onDeleteDestination!}
                                            onToggleStatus={onToggleStatus!}
                                            updatingStatusId={updatingStatusId}
                                            t={t}
                                        />
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </motion.div>
                    )
                : (
                    // Table View
                        <DataTable
                            columns={columns}
                            data={destinations}
                            searchKey="name"
                            searchPlaceholder={t('search-destinations')}
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

            {/* Shared Pagination for both Grid and Table views */}
            {totalDocs > 0 && (
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
            )}

            {/* Empty State */}
            {!loading && destinations.length === 0 && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-16"
                >
                    <div className="mx-auto w-24 h-24 bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-800/30 dark:to-blue-800/30 rounded-full flex items-center justify-center mb-6 shadow-xl">
                        <Building className="h-12 w-12 text-purple-500 dark:text-purple-400" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                        {t('no-destinations-found')}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-6">
                        {t('no-destinations-description')}
                    </p>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button
                            onClick={onCreateDestination}
                            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-xl hover:shadow-2xl px-6 py-3 rounded-xl font-semibold"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            {t('create-first-destination')}
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
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                    <Button
                        onClick={onCreateDestination}
                        className="h-14 w-14 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-2xl hover:shadow-3xl transition-all duration-300"
                    >
                        <Plus className="h-6 w-6" />
                    </Button>
                </motion.div>
            </motion.div>
        </div>
    );
}
