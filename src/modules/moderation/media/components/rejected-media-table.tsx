/* eslint-disable react-dom/no-unsafe-iframe-sandbox */
import { ExternalLink, FileText, Trash2, Undo, UserX } from 'lucide-react';
import { motion } from 'motion/react';

import type { T_ModerationMedia } from '#shared/graphql';

import { Badge, Button } from '#shared/component';
import { E_ModerationMediaType } from '#shared/graphql';
import { useTranslate } from '#shared/i18n';

interface RejectedMediaTableProps {
    items: T_ModerationMedia[];
    mutationLoading: boolean;
    updatingUser: boolean;
    onAcceptMistake: (item: T_ModerationMedia) => void;
    onOpenNotes: (item: T_ModerationMedia) => void;
    onSuspendUser: (userId: string) => void;
    onPermanentDelete: (itemId: string) => void;
    onViewFullSize: (url: string) => void;
}

export function RejectedMediaTable({
    items,
    mutationLoading,
    updatingUser,
    onAcceptMistake,
    onOpenNotes,
    onSuspendUser,
    onPermanentDelete,
    onViewFullSize,
}: RejectedMediaTableProps) {
    const { t } = useTranslate('media');

    const isEmbedUrl = (url?: string | null) => {
        if (!url)
            return false;
        const u = url.toLowerCase();
        return (
            u.includes('iframe.mediadelivery.net')
            || u.includes('mediadelivery.net')
            || u.includes('youtube.com')
            || u.includes('youtu.be')
            || u.includes('vimeo.com')
            || u.includes('/embed/')
        );
    };

    return (
        <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                                Content
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                                Uploader
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                                IP Address
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                                Upload Date
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                                Removal Date
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                                Reason
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                                Notes
                            </th>
                            <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {items.map(item => (
                            <motion.tr
                                key={item.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                            >
                                <td className="px-6 py-4">
                                    <div className="flex items-center">
                                        <div className="h-32 w-48 flex-shrink-0 rounded-lg overflow-hidden">
                                            {item.type === E_ModerationMediaType.VIDEO
                                                ? (
                                                        isEmbedUrl(item.url)
                                                            ? (
                                                                    <div className="relative h-full w-full">
                                                                        <iframe
                                                                            src={item.url ?? undefined}
                                                                            title={item.uploadedBy?.username ?? 'video'}
                                                                            frameBorder="0"
                                                                            allowFullScreen
                                                                            sandbox="allow-forms allow-scripts allow-pointer-lock allow-same-origin allow-top-navigation"
                                                                            allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
                                                                            className="h-full w-full object-cover"
                                                                        />
                                                                    </div>
                                                                )
                                                            : (
                                                                    <video
                                                                        src={item.url || undefined}
                                                                        controls
                                                                        loop
                                                                        muted
                                                                        playsInline
                                                                        className="h-full w-full object-cover"
                                                                        onMouseEnter={e => (e.target as HTMLVideoElement).play()}
                                                                        onMouseLeave={(e) => {
                                                                            const video = e.target as HTMLVideoElement;
                                                                            video.pause();
                                                                            video.currentTime = 0;
                                                                        }}
                                                                    />
                                                                )
                                                    )
                                                : (
                                                        <img
                                                            src={item.url ?? undefined}
                                                            alt="Image thumbnail"
                                                            className="h-full w-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                                                            onClick={() => item.url && onViewFullSize(item.url)}
                                                        />
                                                    )}
                                        </div>
                                        <div className="ml-4">
                                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                {item.type === E_ModerationMediaType.VIDEO ? 'Video' : 'Image'}
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="text-sm text-gray-900 dark:text-gray-100">
                                        <a
                                            href={`https://development.secretswingerlust.com/profile/${item.uploadedBy?.username}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:underline flex items-center gap-1"
                                        >
                                            {item.uploadedBy?.username}
                                            <ExternalLink className="w-3 h-3" />
                                        </a>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="text-sm text-gray-500 font-mono">
                                        {item.ipAddress || 'N/A'}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="text-sm text-gray-500">
                                        {new Date(item.createdAt).toLocaleDateString()}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="text-sm text-gray-500">
                                        {new Date(item.updatedAt).toLocaleDateString()}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="text-sm text-gray-500 max-w-xs truncate">{item.reason}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="relative inline-block">
                                        <Button
                                            variant="ghost"
                                            onClick={() => onOpenNotes(item)}
                                            className="text-purple-600 hover:text-purple-700"
                                            title={t('notes-count', { count: item.notes?.length || 0 })}
                                        >
                                            <FileText className="w-4 h-4" />
                                        </Button>
                                        {item.notes && item.notes.length > 0 && (
                                            <Badge className="absolute -top-2 -right-2 bg-purple-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                                                {item.notes.length}
                                            </Badge>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right space-x-2">
                                    <Button
                                        variant="ghost"
                                        onClick={() => onAcceptMistake(item)}
                                        disabled={mutationLoading}
                                        className="text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"
                                        title="Accept - This was removed by mistake"
                                    >
                                        <Undo className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        disabled={updatingUser}
                                        onClick={() => {
                                            if (item.uploadedBy?.id) {
                                                onSuspendUser(item.uploadedBy.id);
                                            }
                                        }}
                                        className="text-orange-600 hover:text-orange-700"
                                    >
                                        {updatingUser
                                            ? (
                                                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                                                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                    </svg>
                                                )
                                            : (
                                                    <UserX className="w-4 h-4" />
                                                )}
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        onClick={() => onPermanentDelete(item.id!)}
                                        className="text-red-600 hover:text-red-700"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </td>
                            </motion.tr>
                        ))}
                    </tbody>
                </table>

                {items.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                        {t('no-removed-content')}
                    </div>
                )}
            </div>
        </div>
    );
}
