import { Edit, Eye, EyeOff, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';
import * as React from 'react';

import type { T_Keyword } from '#shared/graphql';

import { Badge, Button } from '#shared/component';
import { cn } from '#shared/util';

interface KeywordCardProps {
    keyword: T_Keyword;
    onEdit?: (keyword: T_Keyword) => void;
    onDelete?: (keyword: T_Keyword) => void;
    onToggleStatus?: (keywordId: string, currentIsActive: boolean) => void;
    updatingStatusId?: string;
    t: (key: string, params?: Record<string, any>) => string;
}

const KeywordCard: React.FC<KeywordCardProps> = ({ keyword, onEdit, onDelete, onToggleStatus, updatingStatusId, t }) => {
    // You may want to bring in CATEGORY_META and color logic if needed
    const badgeColor = 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300';
    const bgColor = 'bg-white/95 dark:bg-gray-800/95';
    return (
        <motion.div
            whileHover={{ scale: 1.02, y: -4, transition: { duration: 0.2 } }}
            className={`group relative ${bgColor} backdrop-blur-xl rounded-xl border border-white/30 dark:border-gray-600/50 shadow-lg hover:shadow-xl transition-all duration-300`}
        >
            {/* Card Content */}
            <div className="p-6">
                {/* Keyword Word */}
                <div className="flex items-center justify-between mb-3">
                    <h3 className="font-mono text-lg font-bold text-gray-900 dark:text-gray-100">
                        {keyword.word}
                    </h3>
                    <Badge className={cn('text-xs', badgeColor)}>
                        {keyword.category}
                    </Badge>
                </div>
                {/* Stats */}
                <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                            {keyword.occurrences || 0}
                            {' '}
                            {t('keyword.blocks')}
                        </span>
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-300">
                        {t('keyword.status')}
                        :
                        {keyword.isActive ? t('keyword.active') : t('keyword.inactive')}
                    </div>
                </div>
                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                    <Button
                        onClick={() => onEdit?.(keyword)}
                        className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                    >
                        <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                        onClick={() => onToggleStatus?.(keyword.id!, keyword.isActive || false)}
                        disabled={updatingStatusId === keyword.id}
                        className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
                    >
                        {keyword.isActive ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                    </Button>
                    <Button
                        onClick={() => onDelete?.(keyword)}
                        className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white"
                    >
                        <Trash2 className="h-3 w-3" />
                    </Button>
                </div>
            </div>
            {/* Bottom Gradient Border */}
            <div className="h-1 bg-gradient-to-r from-purple-100 to-gray-400 rounded-b-xl" />
        </motion.div>
    );
};

export { KeywordCard };
