import { Edit, MousePointer, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';
import * as React from 'react';

import { Badge, Button, Switch } from '#shared/component';

import type { I_AdvertisementCardProps } from './advertisement.type';

const gradientBorders = [
    'from-purple-400 via-violet-400 to-purple-600',
    'from-blue-400 via-cyan-400 to-blue-600',
    'from-pink-400 via-fuchsia-400 to-pink-600',
    'from-green-400 via-teal-400 to-green-600',
    'from-yellow-400 via-orange-400 to-yellow-600',
    'from-red-400 via-pink-400 to-red-600',
];

function getRandomGradient(idx: number) {
    return gradientBorders[idx % gradientBorders.length];
}

export const AdvertisementCard: React.FC<I_AdvertisementCardProps> = ({ ad, idx, onEdit, onDelete, onToggleStatus, updatingStatusId, t }) => {
    const placementLabel = ad.placementType
        ? {
                DASHBOARD: t('placement-dashboard'),
                CLUB: t('placement-club'),
                RESORT: t('placement-resort'),
                BLOG: t('placement-blog'),
                PODCAST: t('placement-podcast'),
            }[ad.placementType] || ad.placementType
        : 'N/A';
    const placementTarget = ad.placementDestination?.name || ad.placementBlog?.title || (ad.placementType === 'DASHBOARD' ? t('placement-dashboard') : '-');

    return (
        <motion.div
            variants={{ hidden: { opacity: 0, y: 10, scale: 0.95 }, visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 200, damping: 20 } } }}
            whileHover={{ scale: 1.02, y: -4, transition: { duration: 0.2 } }}
            className="group relative bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-xl border border-white/30 dark:border-gray-600/50 shadow-lg hover:shadow-xl transition-all duration-300"
        >
            {/* Large Image Section */}
            <div className="relative h-32 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-t-xl overflow-hidden">
                {/* Placement Type Badge */}
                <div className="absolute top-3 left-3 z-10">
                    <Badge variant="outline" className="text-xs border-purple-300 dark:border-purple-500 text-purple-700 dark:text-purple-200 bg-white/50 dark:bg-gray-700/50">
                        {placementLabel}
                    </Badge>
                </div>
                {/* Slot Badge (if dashboard) */}
                {ad.slot && (
                    <div className="absolute top-3 right-3 z-10">
                        <Badge variant="outline" className="text-xs border-gray-300 dark:border-gray-500 text-gray-700 dark:text-gray-200 bg-white/50 dark:bg-gray-700/50">
                            {t(ad.slot.toLowerCase().replace('_', '-'))}
                        </Badge>
                    </div>
                )}
                {/* Advertisement Image */}
                {ad.image && (Array.isArray(ad.image) ? ad.image[0] : ad.image)
                    ? (
                            <img
                                src={Array.isArray(ad.image) ? (ad.image[0] ?? '') || '' : (ad.image ?? '') || ''}
                                alt={ad.name ?? ''}
                                className="w-full h-full object-cover"
                            />
                        )
                    : (
                            <div className="w-full h-full flex items-center justify-center">
                                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <rect x="3" y="3" width="18" height="18" rx="2" />
                                    <path d="M3 17l6-6 4 4 8-8" />
                                </svg>
                            </div>
                        )}
                {/* Gradient Overlay for better text readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            </div>
            {/* Card Content */}
            <div className="p-4">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 text-sm leading-tight">
                    {ad.name}
                </h3>
                {/* Placement Target */}
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-2 truncate">
                    {t('placement')}
                    :
                    <span className="font-medium">{placementTarget}</span>
                </div>
                {/* Metrics Row */}
                <div className="flex items-center justify-between mb-3 p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div className="flex items-center gap-3">
                        {/* Clicks */}
                        <div className="flex items-center gap-1">
                            <MousePointer className="h-3 w-3 text-blue-500" />
                            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                {ad.clickCount || 0}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                {t('clicks')}
                            </span>
                        </div>
                    </div>
                    {/* Status Badge */}
                    <Badge
                        variant="outline"
                        className={`text-xs ${ad.isActive ? 'border-green-300 text-green-700 bg-green-50 dark:border-green-600 dark:text-green-300 dark:bg-green-900/20' : 'border-gray-300 text-gray-600 bg-gray-50 dark:border-gray-600 dark:text-gray-400 dark:bg-gray-800/50'}`}
                    >
                        {ad.isActive ? t('active') : t('inactive')}
                    </Badge>
                </div>
                {/* Created By */}
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                    {t('created-by')}
                    <span>: </span>
                    <span className="font-medium">{ad.createdBy?.username || '-'}</span>
                </div>
                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                    <Button
                        onClick={() => onEdit?.(ad)}
                        size="sm"
                        className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                    >
                        <Edit className="h-3 w-3 mr-1" />
                    </Button>
                    <Button
                        onClick={() => onDelete?.(ad)}
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 border-red-300 dark:border-red-600"
                    >
                        <Trash2 className="h-3 w-3" />
                    </Button>
                </div>

                {/* Status Toggle */}
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <Switch
                        checked={ad.isActive || false}
                        onCheckedChange={() => onToggleStatus?.(ad.id!, ad.isActive || false)}
                        aria-label={t('toggle-status')}
                        disabled={updatingStatusId === ad.id}
                    />
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                        {ad.isActive ? t('active') : t('inactive')}
                    </span>
                </div>
            </div>
            {/* Bottom Gradient Border */}
            <div className={`h-1 bg-gradient-to-r ${getRandomGradient(idx)} rounded-b-xl`} />
        </motion.div>
    );
};
