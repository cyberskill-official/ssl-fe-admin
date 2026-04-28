import { AnimatePresence, motion } from 'motion/react';

import type { T_ModerationMedia } from '#shared/graphql';

import { MediaCard } from './media-card';

interface MediaListProps {
    items: T_ModerationMedia[];
    viewMode: 'grid' | 'list';
    status: 'pending' | 'approved' | 'rejected';
    mutationLoading: boolean;
    onApprove?: (item: T_ModerationMedia) => void;
    onReject?: (item: T_ModerationMedia) => void;
    onRejectApproved?: (item: T_ModerationMedia) => void;
    onOpenNotes?: (item: T_ModerationMedia) => void;
    onSendMessage?: (userId: string, username: string) => void;
    onSuspendUser?: (user: { id: string; name: string }) => void;
    onViewFullSize?: (url: string) => void;
}

export function MediaList({
    items,
    viewMode,
    status,
    mutationLoading,
    onApprove,
    onReject,
    onRejectApproved,
    onOpenNotes,
    onSendMessage,
    onSuspendUser,
    onViewFullSize,
}: MediaListProps) {
    const borderColor = status === 'approved'
        ? 'border-green-200 dark:border-green-700'
        : status === 'rejected'
            ? 'border-red-200 dark:border-red-700'
            : 'border-gray-200 dark:border-gray-700';

    return (
        <div
            className={
                viewMode === 'grid'
                    ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
                    : 'flex flex-col gap-6'
            }
        >
            <AnimatePresence>
                {items.map((item, index) => (
                    <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ delay: index * 0.1 }}
                        className={
                            viewMode === 'grid'
                                ? `bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 border ${borderColor} hover:scale-105`
                                : `flex flex-row items-center bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl shadow-lg border ${borderColor} px-4 py-4 gap-6 hover:shadow-xl transition-all duration-300`
                        }
                    >
                        <MediaCard
                            item={item}
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
                ))}
            </AnimatePresence>
        </div>
    );
}
