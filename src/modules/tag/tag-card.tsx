import { Edit, Star, Tag as TagIcon, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';
import * as React from 'react';

import type { T_Tag } from '#shared/graphql';

import { Badge, Button } from '#shared/component';

const UNDERSCORE_RE = /_/g;

interface I_TagCardProps {
    tag: T_Tag;
    onEdit?: (tag: T_Tag) => void;
    onDelete?: (tag: T_Tag) => void;
    t: (key: string, params?: Record<string, any>) => string;
}

const tagTypeIcons = {
    BODY_TYPE: <TagIcon className="h-4 w-4" />,
    CATALOGUE: <TagIcon className="h-4 w-4" />,
    EYE_COLOR: <TagIcon className="h-4 w-4" />,
    HAIR_COLOR: <TagIcon className="h-4 w-4" />,
    HEIGHT: <TagIcon className="h-4 w-4" />,
    LOOKING_FOR: <TagIcon className="h-4 w-4" />,
    PREFERRED_DRINKS: <TagIcon className="h-4 w-4" />,
    PROFILE_PURPOSE: <TagIcon className="h-4 w-4" />,
    RELATIONSHIP_STATUS: <TagIcon className="h-4 w-4" />,
    RULES_OF_ENGAGEMENT: <TagIcon className="h-4 w-4" />,
    SEXUAL_ORIENTATION: <TagIcon className="h-4 w-4" />,
    SEXUAL_PREFERENCES: <TagIcon className="h-4 w-4" />,
    ETHNICITY: <TagIcon className="h-4 w-4" />,
    SMOKING_HABITS: <TagIcon className="h-4 w-4" />,
    WILLINGNESS_TO_GO: <TagIcon className="h-4 w-4" />,
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

const TagCard: React.FC<I_TagCardProps> = ({ tag, onEdit, onDelete, t }) => {
    return (
        <motion.div
            whileHover={{
                scale: 1.02,
                y: -4,
                transition: { duration: 0.2 },
            }}
            className={`group relative bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-xl border border-white/30 dark:border-gray-600/50 shadow-lg hover:shadow-xl transition-all duration-300 ${tagTypeGradients[tag.type as keyof typeof tagTypeGradients] || 'shadow-gray-500/30'}`}
        >
            {/* Custom Badge */}
            {tag.isCustom && (
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 z-10"
                >
                    <div className="bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs px-2 py-0.5 rounded-full shadow-lg flex items-center gap-1">
                        <Star className="h-2.5 w-2.5" />
                        {t('custom')}
                    </div>
                </motion.div>
            )}
            {/* Card Content */}
            <div className="p-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                    <div className={`p-2 rounded-lg bg-gradient-to-br ${tagTypeGradients[tag.type as keyof typeof tagTypeGradients] || 'from-gray-400 to-gray-600'}`}>
                        {tagTypeIcons[tag.type as keyof typeof tagTypeIcons] || <TagIcon className="h-4 w-4 text-white" />}
                    </div>
                    <Badge variant="outline" className="text-xs border-gray-300 dark:border-gray-500 text-gray-700 dark:text-gray-200 bg-white/50 dark:bg-gray-700/50">
                        {t(tag.type?.toLowerCase().replace(UNDERSCORE_RE, '-') || 'unknown')}
                    </Badge>
                </div>
                {/* Tag Name */}
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 text-sm leading-tight">
                    {tag.name}
                </h3>
                {/* Usage Count */}
                <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        {tag.usageCount || 0}
                        {' '}
                        {t('usage-count')}
                    </span>
                </div>
                {/* Created Info */}
                <div className="text-xs text-gray-600 dark:text-gray-300 mb-3 space-y-1">
                    <div>
                        {t('created')}
                        :
                        {new Date(tag.createdAt).toLocaleDateString()}
                    </div>
                    {tag.createdBy?.username && (
                        <div>
                            {t('by')}
                            :
                            {tag.createdBy.username}
                        </div>
                    )}
                </div>
                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                    <Button
                        onClick={() => onEdit?.(tag)}
                        className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                    >
                        <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                        onClick={() => onDelete?.(tag)}
                        className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white"
                    >
                        <Trash2 className="h-3 w-3" />
                    </Button>
                </div>
            </div>
            {/* Bottom Gradient Border */}
            <div className={`h-1 bg-gradient-to-r ${tagTypeGradients[tag.type as keyof typeof tagTypeGradients] || 'from-gray-400 to-gray-600'} rounded-b-xl`} />
        </motion.div>
    );
};

export { TagCard };
