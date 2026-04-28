import { AlertTriangle, Edit, Eye, EyeOff, Grid3X3, List, Plus, Shield, Trash2, TrendingUp, Zap } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useMemo, useState } from 'react';

import { Badge, Button, Tooltip, TooltipContent, TooltipTrigger } from '#shared/component';
import { E_KeywordCategory } from '#shared/graphql';
import { useTranslate } from '#shared/i18n';
import { cn } from '#shared/util';

import type { I_KeywordListProps } from './keyword.type';

import { KeywordCard } from './keyword-card';

const CATEGORY_META = {
    [E_KeywordCategory.INAPPROPRIATE]: {
        label: 'INAPPROPRIATE',
        icon: AlertTriangle,
        color: 'text-red-600 dark:text-red-400',
        focus: 'ring-red-400 dark:ring-red-500',
        gradient: 'from-red-500 to-rose-500',
        glow: 'shadow-red-500/50',
        bgColor: 'bg-red-50 dark:bg-red-950/30',
        hoverColor: 'hover:bg-red-100 dark:hover:bg-red-950/50',
        borderColor: 'border-red-200 dark:border-red-800',
        badgeColor: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300',
    },
    [E_KeywordCategory.SPAM]: {
        label: 'SPAM',
        icon: Zap,
        color: 'text-amber-600 dark:text-amber-400',
        focus: 'ring-amber-400 dark:ring-amber-500',
        gradient: 'from-amber-500 to-orange-500',
        glow: 'shadow-amber-500/50',
        bgColor: 'bg-amber-50 dark:bg-amber-950/30',
        hoverColor: 'hover:bg-amber-100 dark:hover:bg-amber-950/50',
        borderColor: 'border-amber-200 dark:border-amber-800',
        badgeColor: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300',
    },
    [E_KeywordCategory.OFFENSIVE]: {
        label: 'OFFENSIVE',
        icon: AlertTriangle,
        color: 'text-orange-600 dark:text-orange-400',
        focus: 'ring-orange-400 dark:ring-orange-500',
        gradient: 'from-orange-500 to-red-500',
        glow: 'shadow-orange-500/50',
        bgColor: 'bg-orange-50 dark:bg-orange-950/30',
        hoverColor: 'hover:bg-orange-100 dark:hover:bg-orange-950/50',
        borderColor: 'border-orange-200 dark:border-orange-800',
        badgeColor: 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300',
    },
    [E_KeywordCategory.CUSTOM]: {
        label: 'CUSTOM',
        icon: Shield,
        color: 'text-indigo-600 dark:text-indigo-400',
        focus: 'ring-indigo-400 dark:ring-indigo-500',
        gradient: 'from-indigo-500 to-purple-500',
        glow: 'shadow-indigo-500/50',
        bgColor: 'bg-indigo-50 dark:bg-indigo-950/30',
        hoverColor: 'hover:bg-indigo-100 dark:hover:bg-indigo-950/50',
        borderColor: 'border-indigo-200 dark:border-indigo-800',
        badgeColor: 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300',
    },
};

export function KeywordList({
    keywords,
    onEditKeyword,
    onCreateKeyword,
    onDeleteKeyword,
    onToggleStatus,
    updatingStatusId,
    loading = false,
}: I_KeywordListProps) {
    const { t } = useTranslate('moderation');
    const [selectedCategory, setSelectedCategory] = useState<E_KeywordCategory | 'all'>('all');
    const [hoveredKeyword, setHoveredKeyword] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'cloud' | 'grid' | 'table'>('cloud');

    const cloudKeywords = useMemo(() => {
        if (!keywords.length)
            return [];
        const maxOccurrences = Math.max(...keywords.map(k => k.occurrences || 0));
        const minOccurrences = Math.min(...keywords.map(k => k.occurrences || 0));
        return keywords
            .filter(keyword => selectedCategory === 'all' || (keyword.category && keyword.category === selectedCategory))
            .map((keyword) => {
                const occurrences = keyword.occurrences || 0;
                const normalizedOccurrences = maxOccurrences === minOccurrences
                    ? 0.5
                    : (occurrences - minOccurrences) / (maxOccurrences - minOccurrences);
                const fontSize = Math.max(14, 12 + (normalizedOccurrences * 28));
                const opacity = keyword.isActive ? 1 : 0.4;

                const getCategoryColors = (category: E_KeywordCategory) => {
                    const meta = CATEGORY_META[category] || CATEGORY_META[E_KeywordCategory.CUSTOM];
                    return {
                        color: meta.color,
                        bgColor: meta.bgColor,
                        hoverColor: meta.hoverColor,
                        gradient: meta.gradient,
                        glow: meta.glow,
                        borderColor: meta.borderColor,
                        badgeColor: meta.badgeColor,
                    };
                };
                const colors = getCategoryColors(keyword.category || E_KeywordCategory.CUSTOM);

                return {
                    ...keyword,
                    fontSize,
                    opacity,
                    ...colors,
                };
            })
            .sort((a, b) => (b.occurrences || 0) - (a.occurrences || 0));
    }, [keywords, selectedCategory]);

    const categoryStats = useMemo(() => {
        const stats = {
            [E_KeywordCategory.INAPPROPRIATE]: { count: 0, active: 0, totalOccurrences: 0 },
            [E_KeywordCategory.SPAM]: { count: 0, active: 0, totalOccurrences: 0 },
            [E_KeywordCategory.OFFENSIVE]: { count: 0, active: 0, totalOccurrences: 0 },
            [E_KeywordCategory.CUSTOM]: { count: 0, active: 0, totalOccurrences: 0 },
        };
        keywords.forEach((keyword) => {
            const category = keyword.category;
            if (category && stats[category]) {
                stats[category].count++;
                if (keyword.isActive)
                    stats[category].active++;
                stats[category].totalOccurrences += keyword.occurrences || 0;
            }
        });
        return stats;
    }, [keywords]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="relative">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                    <div className="absolute inset-0 rounded-full border-2 border-purple-200 animate-ping opacity-20"></div>
                </div>
            </div>
        );
    }

    // Helper for keyboard accessibility
    const _handleCategoryKeyDown = (category: E_KeywordCategory) => (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
            setSelectedCategory(category === selectedCategory ? 'all' : category as E_KeywordCategory);
        }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.05,
            },
        },
    };

    return (
        <div className="space-y-6">
            {/* Stats Overview as Filter */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(categoryStats).map(([category, stats], index) => {
                    const meta = CATEGORY_META[category as E_KeywordCategory];
                    const isSelected = selectedCategory === category;
                    return (
                        <motion.div
                            key={category}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            whileHover={{ y: -2, transition: { duration: 0.2 } }}
                        >
                            <button
                                type="button"
                                tabIndex={0}
                                aria-pressed={isSelected}
                                onClick={() => setSelectedCategory(isSelected ? 'all' : category as E_KeywordCategory)}
                                onKeyDown={_handleCategoryKeyDown(category as E_KeywordCategory)}
                                className={cn(
                                    'w-full h-full text-left rounded-2xl border bg-white dark:bg-gray-800 p-6 shadow-sm hover:shadow-md transition-all duration-200 focus:outline-none',
                                    isSelected ? `${meta.focus} ring-2 ${meta.borderColor} shadow-lg` : 'border-gray-200 dark:border-gray-700',
                                    'cursor-pointer group',
                                )}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <span className={cn('font-semibold tracking-wide', meta.color)}>{meta.label}</span>
                                    <meta.icon className={cn('w-5 h-5', meta.color)} />
                                </div>
                                <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">{stats.count}</div>
                                <div className="flex items-center gap-2 mt-2">
                                    <span className="text-green-600 dark:text-green-400 text-sm font-medium">
                                        {stats.active}
                                        {' '}
                                        {t('keyword.active')}
                                    </span>
                                    {stats.totalOccurrences > 0 && (
                                        <span className="text-xs text-gray-500">
                                            {stats.totalOccurrences}
                                            {' '}
                                            {t('keyword.blocks')}
                                        </span>
                                    )}
                                </div>
                            </button>
                        </motion.div>
                    );
                })}
            </div>

            {/* View Mode Toggle */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-end"
            >
                <div className="flex items-center gap-2 bg-white/70 dark:bg-gray-700/80 backdrop-blur-sm rounded-xl p-1 shadow-lg">
                    <Button
                        variant={viewMode === 'cloud' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('cloud')}
                        className="h-8 px-3"
                    >
                        <TrendingUp className="h-4 w-4" />
                    </Button>
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
            </motion.div>

            {/* Content */}
            {viewMode === 'cloud'
                ? (
                    // Cloud View
                        <div className="relative min-h-[400px] bg-gradient-to-br from-gray-50 via-purple-50 to-blue-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-blue-900/20 rounded-2xl p-8 border shadow-inner">
                            <div className="flex flex-wrap justify-center items-center gap-4 min-h-[300px]">
                                <AnimatePresence>
                                    {cloudKeywords.map((keyword, index) => (
                                        <motion.div
                                            key={keyword.id}
                                            initial={{ opacity: 0, scale: 0, rotate: -180 }}
                                            animate={{
                                                opacity: keyword.opacity,
                                                scale: 1,
                                                rotate: 0,
                                                transition: {
                                                    duration: 0.5,
                                                    delay: index * 0.05,
                                                    type: 'spring',
                                                    stiffness: 100,
                                                    damping: 10,
                                                },
                                            }}
                                            exit={{ opacity: 0, scale: 0, rotate: 180 }}
                                            whileHover={{
                                                scale: 1.15,
                                                zIndex: 10,
                                                transition: { duration: 0.2 },
                                            }}
                                            onHoverStart={() => setHoveredKeyword(keyword.id!)}
                                            onHoverEnd={() => setHoveredKeyword(null)}
                                            className={cn(
                                                'relative cursor-pointer transition-all duration-300 rounded-lg px-3 py-2 border shadow-sm',
                                                keyword.bgColor,
                                                keyword.hoverColor,
                                                hoveredKeyword === keyword.id && 'shadow-xl ring-2 ring-purple-300 dark:ring-purple-600 transform rotate-1',
                                            )}
                                        >
                                            <span
                                                className={cn(
                                                    'font-medium transition-all duration-200',
                                                    keyword.color,
                                                )}
                                                style={{ fontSize: `${keyword.fontSize}px` }}
                                            >
                                                {keyword.word}
                                            </span>

                                            {/* Quick Actions Overlay */}
                                            <AnimatePresence>
                                                {hoveredKeyword === keyword.id && (
                                                    <motion.div
                                                        initial={{ opacity: 0, y: 10, scale: 0.8 }}
                                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                                        exit={{ opacity: 0, y: 10, scale: 0.8 }}
                                                        className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 z-20"
                                                    >
                                                        <div className="flex gap-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border p-1 backdrop-blur-sm">
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Button
                                                                        size="sm"
                                                                        variant="ghost"
                                                                        onClick={() => onEditKeyword?.(keyword)}
                                                                        className="h-8 w-8 p-0 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                                                                    >
                                                                        <Edit className="w-3 h-3" />
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>Edit keyword</TooltipContent>
                                                            </Tooltip>

                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Button
                                                                        size="sm"
                                                                        variant="ghost"
                                                                        onClick={() => onToggleStatus?.(keyword.id!, keyword.isActive || false)}
                                                                        disabled={updatingStatusId === keyword.id}
                                                                        className="h-8 w-8 p-0 hover:bg-green-50 dark:hover:bg-green-900/20"
                                                                    >
                                                                        {keyword.isActive
                                                                            ? (
                                                                                    <Eye className="w-3 h-3" />
                                                                                )
                                                                            : (
                                                                                    <EyeOff className="w-3 h-3" />
                                                                                )}
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    {keyword.isActive ? 'Deactivate' : 'Activate'}
                                                                </TooltipContent>
                                                            </Tooltip>

                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Button
                                                                        size="sm"
                                                                        variant="ghost"
                                                                        onClick={() => onDeleteKeyword?.(keyword)}
                                                                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                                                                    >
                                                                        <Trash2 className="w-3 h-3" />
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>Delete keyword</TooltipContent>
                                                            </Tooltip>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>

                                            {/* Occurrence Badge - Only show when count > 0 */}
                                            {keyword.occurrences && keyword.occurrences > 0 && (
                                                <motion.div
                                                    className="absolute -top-2 -right-2"
                                                    initial={{ scale: 0 }}
                                                    animate={{ scale: 1 }}
                                                    transition={{ delay: 0.3 }}
                                                >
                                                    <Badge
                                                        variant="secondary"
                                                        className="text-xs px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 animate-pulse"
                                                    >
                                                        {keyword.occurrences}
                                                    </Badge>
                                                </motion.div>
                                            )}

                                            {/* Pulse effect for active keywords */}
                                            {keyword.isActive && (
                                                <motion.div
                                                    className="absolute inset-0 rounded-lg border-2 border-purple-300 dark:border-purple-600"
                                                    animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0, 0.5] }}
                                                    transition={{ duration: 2, repeat: Infinity }}
                                                />
                                            )}
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>

                            {/* Empty State */}
                            {cloudKeywords.length === 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-gray-400"
                                >
                                    <motion.div
                                        animate={{ rotate: [0, 10, -10, 0] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                    >
                                        <Shield className="w-16 h-16 mb-4 opacity-50" />
                                    </motion.div>
                                    <p className="text-lg font-medium mb-2">No keywords found</p>
                                    <p className="text-sm text-center max-w-md">
                                        {selectedCategory === 'all'
                                            ? 'Start adding keywords to protect your community from unwanted content.'
                                            : `No keywords in the "${selectedCategory}" category.`}
                                    </p>
                                </motion.div>
                            )}
                        </div>
                    )
                : viewMode === 'grid'
                    ? (
                        // Grid View
                            <motion.div
                                variants={containerVariants}
                                initial="hidden"
                                animate="visible"
                                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4"
                            >
                                <AnimatePresence>
                                    {cloudKeywords.map(keyword => (
                                        <KeywordCard
                                            key={keyword.id}
                                            keyword={keyword}
                                            onEdit={onEditKeyword}
                                            onDelete={onDeleteKeyword}
                                            onToggleStatus={onToggleStatus}
                                            updatingStatusId={updatingStatusId}
                                            t={t}
                                        />
                                    ))}
                                </AnimatePresence>
                            </motion.div>
                        )
                    : (
                        // Table View
                            <div className="bg-white/90 dark:bg-gray-800/95 backdrop-blur-xl rounded-2xl border border-white/30 dark:border-gray-600/50 shadow-xl overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-50 dark:bg-gray-700/50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                    {t('keyword.table-keyword')}
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                    {t('keyword.table-category')}
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                    {t('keyword.table-status')}
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                    {t('keyword.table-occurrences')}
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                    {t('keyword.table-actions')}
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                                            {cloudKeywords.map(keyword => (
                                                <tr key={keyword.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="font-mono text-sm font-medium text-gray-900 dark:text-gray-100">
                                                            {keyword.word}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <Badge className={cn('text-xs', keyword.badgeColor)}>
                                                            {keyword.category}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <Badge variant={keyword.isActive ? 'default' : 'secondary'} className="text-xs">
                                                            {keyword.isActive ? t('keyword.active') : t('keyword.inactive')}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                                        {keyword.occurrences || 0}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                        <div className="flex items-center gap-2">
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => onEditKeyword?.(keyword)}
                                                                className="h-8 px-3"
                                                            >
                                                                <Edit className="h-3 w-3 mr-1" />
                                                                {t('keyword.edit-keyword')}
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => onToggleStatus?.(keyword.id!, keyword.isActive || false)}
                                                                disabled={updatingStatusId === keyword.id}
                                                                className="h-8 px-3"
                                                            >
                                                                {keyword.isActive ? <Eye className="h-3 w-3 mr-1" /> : <EyeOff className="h-3 w-3 mr-1" />}
                                                                {keyword.isActive ? t('keyword.deactivate') : t('keyword.activate')}
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => onDeleteKeyword?.(keyword)}
                                                                className="h-8 px-3 text-red-600 hover:text-red-700"
                                                            >
                                                                <Trash2 className="h-3 w-3 mr-1" />
                                                                {t('keyword.delete')}
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

            {/* Legend - Only show for cloud view */}
            {viewMode === 'cloud' && (
                <div className="flex flex-wrap gap-4 justify-center text-sm">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-red-500 dark:bg-red-400 rounded animate-pulse"></div>
                        <span>{t('keyword.category-inappropriate')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-amber-500 dark:bg-amber-400 rounded animate-pulse"></div>
                        <span>{t('keyword.category-spam')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-orange-500 dark:bg-orange-400 rounded animate-pulse"></div>
                        <span>{t('keyword.category-offensive')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-indigo-500 dark:bg-indigo-400 rounded animate-pulse"></div>
                        <span>{t('keyword.category-custom')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-purple-600 animate-bounce" />
                        <span>{t('keyword.size-frequency')}</span>
                    </div>
                </div>
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
                        onClick={onCreateKeyword}
                        className="h-14 w-14 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-2xl hover:shadow-3xl transition-all duration-300"
                    >
                        <Plus className="h-6 w-6" />
                    </Button>
                </motion.div>
            </motion.div>
        </div>
    );
}
