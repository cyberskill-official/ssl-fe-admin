import { Check, Eye } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

import type { T_ModerationMedia } from '#shared/graphql';

import { Button } from '#shared/component';
import { useTranslate } from '#shared/i18n';

import { MediaList } from './media-list';

interface MediaSectionProps {
    title: string;
    icon: React.ComponentType<{ className?: string }>;
    iconGradient: string;
    items: T_ModerationMedia[];
    viewMode: 'grid' | 'list';
    status: 'pending' | 'approved' | 'rejected';
    mutationLoading: boolean;
    showItems?: boolean;
    onToggleShow?: () => void;
    onApprove?: (item: T_ModerationMedia) => void;
    onReject?: (item: T_ModerationMedia) => void;
    onRejectApproved?: (item: T_ModerationMedia) => void;
    onOpenNotes?: (item: T_ModerationMedia) => void;
    onSendMessage?: (userId: string, username: string) => void;
    onSuspendUser?: (user: { id: string; name: string }) => void;
    onViewFullSize?: (url: string) => void;
    emptyMessage?: string;
    emptyDescription?: string;
}

export function MediaSection({
    title,
    icon: Icon,
    iconGradient,
    items,
    viewMode,
    status,
    mutationLoading,
    showItems = true,
    onToggleShow,
    onApprove,
    onReject,
    onRejectApproved,
    onOpenNotes,
    onSendMessage,
    onSuspendUser,
    onViewFullSize,
    emptyMessage,
    emptyDescription,
}: MediaSectionProps) {
    const { t } = useTranslate('media');

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
        >
            <div className={`flex items-center ${onToggleShow ? 'justify-between' : 'gap-3'} mb-6`}>
                <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 ${iconGradient} rounded-lg flex items-center justify-center`}>
                        <Icon className="w-5 h-5 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                        {title}
                        {' '}
                        (
                        {items.length}
                        )
                    </h2>
                </div>

                {onToggleShow && (
                    <Button
                        variant="ghost"
                        onClick={onToggleShow}
                        className={`${
                            status === 'approved'
                                ? 'text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20'
                                : 'text-purple-600 hover:text-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/20'
                        }`}
                    >
                        <Eye className="w-4 h-4 mr-2" />
                        {showItems ? 'Hide' : 'Show'}
                        {' '}
                        {status === 'approved' ? 'Approved' : 'Removed'}
                    </Button>
                )}
            </div>

            <AnimatePresence>
                {showItems && (
                    items.length === 0
                        ? (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="text-center py-16 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-200 dark:border-gray-700"
                                >
                                    <div className={`w-16 h-16 ${iconGradient} rounded-full flex items-center justify-center mx-auto mb-4`}>
                                        <Check className="w-8 h-8 text-white" />
                                    </div>
                                    <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">
                                        {emptyMessage || t('no-content')}
                                    </h3>
                                    <p className="text-gray-600 dark:text-gray-300">
                                        {emptyDescription || t('no-content-description')}
                                    </p>
                                </motion.div>
                            )
                        : (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                >
                                    <MediaList
                                        items={items}
                                        viewMode={viewMode}
                                        status={status}
                                        mutationLoading={mutationLoading}
                                        onApprove={onApprove}
                                        onReject={onReject}
                                        onRejectApproved={onRejectApproved}
                                        onOpenNotes={onOpenNotes}
                                        onSendMessage={onSendMessage}
                                        onSuspendUser={onSuspendUser}
                                        onViewFullSize={onViewFullSize}
                                    />
                                </motion.div>
                            )
                )}
            </AnimatePresence>
        </motion.div>
    );
}
