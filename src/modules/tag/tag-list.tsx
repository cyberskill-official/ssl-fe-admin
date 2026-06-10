import type { ColumnDef } from '@tanstack/react-table';

import {
    AlertTriangle,
    Cigarette,
    Coffee,
    Edit,
    Eye,
    Flame,
    Grid3X3,
    Heart,
    List,
    MapPin,
    Palette,
    Plus,
    Ruler,
    Search,
    Shield,
    Palette as SkinToneIcon,
    Sparkles,
    Star,
    Tag as TagIcon,
    Target,
    Trash2,
    Users,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useMemo, useState } from 'react';

import type { E_TagType, T_Tag } from '#shared/graphql';

import { Badge, Button, Input, Pagination, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '#shared/component';
import { DataTable } from '#shared/component/data-table';
import { useTranslate } from '#shared/i18n';

import type { I_TagListProps } from './tag.type';

import { TagCard } from './tag-card';

const UNDERSCORE_RE = /_/g;

const tagTypeIcons = {
    BODY_TYPE: <Users className="h-4 w-4" />,
    CATALOGUE: <TagIcon className="h-4 w-4" />,
    EYE_COLOR: <Eye className="h-4 w-4" />,
    HAIR_COLOR: <Palette className="h-4 w-4" />,
    HEIGHT: <Ruler className="h-4 w-4" />,
    LOOKING_FOR: <Target className="h-4 w-4" />,
    PREFERRED_DRINKS: <Coffee className="h-4 w-4" />,
    PROFILE_PURPOSE: <Star className="h-4 w-4" />,
    RELATIONSHIP_STATUS: <Heart className="h-4 w-4" />,
    RULES_OF_ENGAGEMENT: <Shield className="h-4 w-4" />,
    SEXUAL_ORIENTATION: <Flame className="h-4 w-4" />,
    SEXUAL_PREFERENCES: <Sparkles className="h-4 w-4" />,
    ETHNICITY: <SkinToneIcon className="h-4 w-4" />,
    SMOKING_HABITS: <Cigarette className="h-4 w-4" />,
    WILLINGNESS_TO_GO: <MapPin className="h-4 w-4" />,
};

const tagTypeGradients = {
    BODY_TYPE: 'from-blue-400 via-cyan-400 to-blue-600',
    CATALOGUE: 'from-purple-400 via-violet-400 to-purple-600',
    EYE_COLOR: 'from-green-400 via-emerald-400 to-green-600',
    HAIR_COLOR: 'from-yellow-400 via-amber-400 to-yellow-600',
    HEIGHT: 'from-indigo-400 via-blue-400 to-indigo-600',
    LOOKING_FOR: 'from-pink-400 via-rose-400 to-pink-600',
    PREFERRED_DRINKS: 'from-orange-400 via-red-400 to-orange-600',
    PROFILE_PURPOSE: 'from-teal-400 via-cyan-400 to-teal-600',
    RELATIONSHIP_STATUS: 'from-red-400 via-pink-400 to-red-600',
    RULES_OF_ENGAGEMENT: 'from-amber-400 via-yellow-400 to-amber-600',
    SEXUAL_ORIENTATION: 'from-rose-400 via-red-400 to-rose-600',
    SEXUAL_PREFERENCES: 'from-violet-400 via-purple-400 to-violet-600',
    ETHNICITY: 'from-cyan-400 via-blue-400 to-cyan-600',
    SMOKING_HABITS: 'from-slate-400 via-gray-400 to-slate-600',
    WILLINGNESS_TO_GO: 'from-emerald-400 via-green-400 to-emerald-600',
};

export function TagList({
    tags,
    loading,
    onEditTag,
    onCreateTag,
    onDeleteTag,
    totalDocs = 0,
    page = 1,
    pageSize = 10,
    onPageChange,
    onPageSizeChange,
    search = '',
    onSearchChange,
    selectedType = 'ALL',
    onTypeChange,
    sortField = 'usageCount',
    sortOrder = 'desc',
    onSortChange,
}: I_TagListProps) {
    const { t } = useTranslate('tag');
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

    const tagTypeOptions = [
        { value: 'ALL', label: t('all-types'), icon: <TagIcon className="h-4 w-4" /> },
        { value: 'BODY_TYPE', label: t('body-type'), icon: <Users className="h-4 w-4" /> },
        { value: 'CATALOGUE', label: t('catalogue'), icon: <TagIcon className="h-4 w-4" /> },
        { value: 'EYE_COLOR', label: t('eye-color'), icon: <Eye className="h-4 w-4" /> },
        { value: 'HAIR_COLOR', label: t('hair-color'), icon: <Palette className="h-4 w-4" /> },
        { value: 'HEIGHT', label: t('height'), icon: <Ruler className="h-4 w-4" /> },
        { value: 'LOOKING_FOR', label: t('looking-for'), icon: <Target className="h-4 w-4" /> },
        { value: 'PREFERRED_DRINKS', label: t('preferred-drinks'), icon: <Coffee className="h-4 w-4" /> },
        { value: 'PROFILE_PURPOSE', label: t('profile-purpose'), icon: <Star className="h-4 w-4" /> },
        { value: 'RELATIONSHIP_STATUS', label: t('relationship-status'), icon: <Heart className="h-4 w-4" /> },
        { value: 'RULES_OF_ENGAGEMENT', label: t('rules-of-engagement'), icon: <Shield className="h-4 w-4" /> },
        { value: 'SEXUAL_ORIENTATION', label: t('sexual-orientation'), icon: <Flame className="h-4 w-4" /> },
        { value: 'SEXUAL_PREFERENCES', label: t('sexual-preferences'), icon: <Sparkles className="h-4 w-4" /> },
        { value: 'ETHNICITY', label: 'Ethnicity', icon: <SkinToneIcon className="h-4 w-4" /> },
        { value: 'SMOKING_HABITS', label: t('smoking-habits'), icon: <Cigarette className="h-4 w-4" /> },
        { value: 'WILLINGNESS_TO_GO', label: t('willingness-to-go'), icon: <MapPin className="h-4 w-4" /> },
    ];

    const [showCustomOnly, setShowCustomOnly] = useState(false);
    const [showLowUsage, setShowLowUsage] = useState(false);

    // Calculate counts
    const customTagsCount = tags.filter(t => t.isCustom === true).length;
    const lowUsageTags = tags.filter(t => (t.usageCount || 0) <= 5).length;

    // Filter tags based on custom/low usage toggles
    const filteredTags = tags.filter((tag) => {
        // If showing custom only, exclude non-custom tags
        if (showCustomOnly && tag.isCustom !== true) {
            return false;
        }
        // If showing low usage only, exclude tags with more than 5 uses
        if (showLowUsage && (tag.usageCount || 0) > 5) {
            return false;
        }
        return true;
    });

    const sortOptions = [
        { value: 'usageCount-desc', label: t('most-used'), field: 'usageCount', order: 'desc' },
        { value: 'usageCount-asc', label: t('least-used'), field: 'usageCount', order: 'asc' },
        { value: 'createdAt-desc', label: t('newest-first'), field: 'createdAt', order: 'desc' },
        { value: 'createdAt-asc', label: t('oldest-first'), field: 'createdAt', order: 'asc' },
        { value: 'name-asc', label: t('name-a-z'), field: 'name', order: 'asc' },
        { value: 'name-desc', label: t('name-z-a'), field: 'name', order: 'desc' },
        { value: 'type-asc', label: `${t('type')} A-Z`, field: 'type', order: 'asc' },
        { value: 'type-desc', label: `${t('type')} Z-A`, field: 'type', order: 'desc' },
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

    // Table columns for DataTable
    const columns: ColumnDef<T_Tag>[] = useMemo(() => [
        {
            accessorKey: 'name',
            header: t('name'),
            cell: ({ row }) => (
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-gradient-to-br ${tagTypeGradients[row.original.type as keyof typeof tagTypeGradients] || 'from-gray-400 to-gray-600'}`}>
                        {tagTypeIcons[row.original.type as keyof typeof tagTypeIcons] || <TagIcon className="h-4 w-4 text-white" />}
                    </div>
                    <div>
                        <div className="font-semibold text-gray-900 dark:text-gray-100">{row.getValue('name')}</div>
                        <div className="text-xs text-gray-600 dark:text-gray-300">
                            {t(row.original.type?.toLowerCase().replace(UNDERSCORE_RE, '-') || 'unknown')}
                        </div>
                    </div>
                </div>
            ),
        },
        {
            accessorKey: 'isCustom',
            header: t('type'),
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    {row.original.isCustom && (
                        <Badge className="bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs">
                            <Star className="h-3 w-3 mr-1" />
                            {t('custom')}
                        </Badge>
                    )}
                    <Badge variant="outline" className="text-xs">
                        {t(row.original.type?.toLowerCase().replace(UNDERSCORE_RE, '-') || 'unknown')}
                    </Badge>
                </div>
            ),
        },
        {
            accessorKey: 'usageCount',
            header: t('usage-count'),
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="font-medium">{row.getValue('usageCount') || 0}</span>
                </div>
            ),
        },
        {
            accessorKey: 'createdAt',
            header: t('created'),
            cell: ({ row }) => (
                <div className="text-sm text-gray-600 dark:text-gray-300">
                    <div>{new Date(row.getValue('createdAt')).toLocaleDateString()}</div>
                    {row.original.createdBy?.username && (
                        <div className="text-xs">
                            {t('by')}
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
                        onClick={() => onEditTag?.(row.original)}
                        className="h-8 px-3"
                    >
                        <Edit className="h-3 w-3 mr-1" />
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDeleteTag?.(row.original)}
                        className="h-8 px-3 text-red-600 hover:text-red-700"
                    >
                        <Trash2 className="h-3 w-3" />
                    </Button>
                </div>
            ),
        },
    ], [t, onEditTag, onDeleteTag]);

    return (
        <div className="space-y-6">
            {/* Warning Banner for Custom Tags Issue */}
            {customTagsCount > 50 && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-l-4 border-amber-500 p-6 rounded-xl shadow-lg"
                >
                    <div className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                            <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-semibold text-amber-900 dark:text-amber-100 mb-2">
                                ⚠️
                                {' '}
                                {t('Tag Management Alert')}
                            </h3>
                            <p className="text-sm text-amber-800 dark:text-amber-200 mb-3">
                                <strong>
                                    {customTagsCount}
                                    {' '}
                                    custom tags
                                </strong>
                                {' '}
                                have been created by users. This can cause chaos as each language has different words for the same concepts (e.g., sexual activities).
                            </p>
                            <div className="bg-white/50 dark:bg-gray-800/50 p-4 rounded-lg mb-3">
                                <p className="text-xs text-gray-700 dark:text-gray-300 mb-2">
                                    <strong>Recommendations:</strong>
                                </p>
                                <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1 list-disc list-inside">
                                    <li>Use "Custom Tags" filter to review user-created tags</li>
                                    <li>Use "Low Usage" filter to find potential duplicates or spam</li>
                                    <li>Delete unused custom tags and consolidate similar ones</li>
                                    <li>Create official admin tags to replace common custom tags</li>
                                    <li>Consider disabling user tag creation in production</li>
                                </ul>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowCustomOnly(true)}
                                    className="bg-white dark:bg-gray-800 text-amber-700 dark:text-amber-300 border-amber-300 hover:bg-amber-50 dark:hover:bg-amber-900/30"
                                >
                                    <Star className="h-3 w-3 mr-1" />
                                    {t('Review Custom Tags')}
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowLowUsage(true)}
                                    className="bg-white dark:bg-gray-800 text-red-700 dark:text-red-300 border-red-300 hover:bg-red-50 dark:hover:bg-red-900/30"
                                >
                                    ⚠️
                                    {' '}
                                    {t('Find Low Usage')}
                                </Button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Search and Filters */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/90 dark:bg-gray-800/95 backdrop-blur-xl rounded-2xl border border-white/30 dark:border-gray-600/50 p-6 shadow-xl"
            >
                {/* Filter Info Bar */}
                {(showCustomOnly || showLowUsage) && (
                    <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                                    🔍 Filtering:
                                </span>
                                {showCustomOnly && (
                                    <Badge className="bg-amber-500 text-white">Custom Tags Only</Badge>
                                )}
                                {showLowUsage && (
                                    <Badge className="bg-red-500 text-white">Low Usage (≤5 uses)</Badge>
                                )}
                            </div>
                            <div className="text-sm text-blue-700 dark:text-blue-300">
                                Showing
                                {' '}
                                <strong>{filteredTags.length}</strong>
                                {' '}
                                of
                                {' '}
                                <strong>{tags.length}</strong>
                                {' '}
                                tags
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex items-center gap-4 flex-wrap">
                    <div className="relative flex-1 min-w-[300px]">
                        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500 dark:text-gray-400" />
                        <Input
                            placeholder={t('search-tags')}
                            value={search}
                            onChange={e => onSearchChange?.(e.target.value)}
                            className="pl-10 h-12 border-0 bg-white/70 dark:bg-gray-700/80 backdrop-blur-sm focus:bg-white dark:focus:bg-gray-600 focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 rounded-xl shadow-lg"
                        />
                    </div>

                    <Select value={selectedType} onValueChange={value => onTypeChange?.(value as E_TagType | 'ALL')}>
                        <SelectTrigger className="h-12 w-48 border-0 bg-white/70 dark:bg-gray-700/80 backdrop-blur-sm rounded-xl shadow-lg text-gray-900 dark:text-gray-100">
                            <SelectValue placeholder={t('select-type')} />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                            {tagTypeOptions.map(option => (
                                <SelectItem key={option.value} value={option.value} className="text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700">
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
                                onSortChange(option.field as 'name' | 'type' | 'usageCount' | 'createdAt', option.order as 'asc' | 'desc');
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

                    <div className="flex items-center gap-2">
                        <Button
                            variant={showCustomOnly ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setShowCustomOnly(!showCustomOnly)}
                            className={`h-10 px-4 ${showCustomOnly ? 'bg-amber-500 hover:bg-amber-600 text-white' : ''}`}
                            title={t('Show only user-created tags')}
                        >
                            <Star className="h-4 w-4 mr-2" />
                            {t('Custom Tags')}
                            {' '}
                            (
                            {customTagsCount}
                            )
                        </Button>
                        <Button
                            variant={showLowUsage ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setShowLowUsage(!showLowUsage)}
                            className={`h-10 px-4 ${showLowUsage ? 'bg-red-500 hover:bg-red-600 text-white' : ''}`}
                            title={t('Show tags with 5 or fewer uses - potential duplicates or spam')}
                        >
                            ⚠️
                            {' '}
                            {t('Low Usage')}
                            {' '}
                            (
                            {lowUsageTags}
                            )
                        </Button>
                    </div>

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
                                {filteredTags.map(tag => (
                                    <TagCard
                                        key={tag.id}
                                        tag={tag}
                                        onEdit={onEditTag}
                                        onDelete={onDeleteTag}
                                        t={t}
                                    />
                                ))}
                            </AnimatePresence>
                        </motion.div>
                    )
                : (
                    // Table View
                        <DataTable
                            columns={columns}
                            data={filteredTags}
                            searchKey="name"
                            searchPlaceholder={t('search-tags')}
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
            {!loading && filteredTags.length === 0 && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-16"
                >
                    <div className="mx-auto w-24 h-24 bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-800/30 dark:to-blue-800/30 rounded-full flex items-center justify-center mb-6 shadow-xl">
                        <TagIcon className="h-12 w-12 text-purple-500 dark:text-purple-400" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">{t('no-tags-found')}</h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-6">
                        {showCustomOnly || showLowUsage
                            ? t('Try adjusting your filters')
                            : t('no-tags-description')}
                    </p>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button onClick={onCreateTag} className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-xl hover:shadow-2xl px-6 py-3 rounded-xl font-semibold">
                            <Plus className="h-4 w-4 mr-2" />
                            {t('create-first-tag')}
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
                        onClick={onCreateTag}
                        className="h-14 w-14 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-2xl hover:shadow-3xl transition-all duration-300"
                    >
                        <Plus className="h-6 w-6" />
                    </Button>
                </motion.div>
            </motion.div>
        </div>
    );
}
