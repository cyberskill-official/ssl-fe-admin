/* eslint-disable react-dom/no-unsafe-iframe-sandbox */
import { Check, ExternalLink, FileText, MessageSquare, Trash2, User, UserX, ZoomIn } from 'lucide-react';

import type { T_ModerationMedia } from '#shared/graphql';

import { Badge, Button } from '#shared/component';
import { E_ModerationMediaType } from '#shared/graphql';
import { useTranslate } from '#shared/i18n';

interface MediaCardProps {
    item: T_ModerationMedia;
    viewMode: 'grid' | 'list';
    status: 'pending' | 'approved' | 'rejected';
    onApprove?: (item: T_ModerationMedia) => void;
    onReject?: (item: T_ModerationMedia) => void;
    onRejectApproved?: (item: T_ModerationMedia) => void;
    onOpenNotes?: (item: T_ModerationMedia) => void;
    onSendMessage?: (userId: string, username: string) => void;
    onSuspendUser?: (user: { id: string; name: string }) => void;
    onViewFullSize?: (url: string) => void;
    mutationLoading?: boolean;
}

export function MediaCard({
    item,
    viewMode,
    status,
    onApprove,
    onReject,
    onRejectApproved,
    onOpenNotes,
    onSendMessage,
    onSuspendUser,
    onViewFullSize,
    mutationLoading = false,
}: MediaCardProps) {
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

    const renderMedia = (size: 'full' | 'thumbnail' = 'full') => {
        const aspectRatioClass = item.type === E_ModerationMediaType.VIDEO ? 'aspect-video' : 'aspect-square';
        const containerClass = size === 'full' ? aspectRatioClass : 'w-24 h-24 rounded-xl overflow-hidden';

        return (
            <div className={`${containerClass} relative`}>
                {item.type === E_ModerationMediaType.VIDEO
                    ? (
                            isEmbedUrl(item.url)
                                ? (
                                        <div className="w-full h-full">
                                            <iframe
                                                src={item.url ?? undefined}
                                                title={item.uploadedBy?.username ?? 'video'}
                                                frameBorder="0"
                                                allowFullScreen
                                                sandbox="allow-forms allow-scripts allow-pointer-lock allow-same-origin allow-top-navigation"
                                                allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
                                                className="w-full h-full"
                                            />
                                            <div className="absolute top-2 right-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => window.open(item.url ?? undefined, '_blank', 'noopener,noreferrer')}
                                                    title="Open in new tab"
                                                >
                                                    <ExternalLink className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    )
                                : (
                                        <video
                                            src={item.url || undefined}
                                            controls
                                            loop
                                            muted
                                            playsInline
                                            className="w-full h-full object-cover"
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
                            <>
                                <img
                                    src={item.url ?? undefined}
                                    alt={t('upload-alt', { username: item.uploadedBy?.username })}
                                    className={`w-full h-full object-cover ${size === 'full' ? 'cursor-pointer' : ''}`}
                                    onClick={() => size === 'full' && item.url && onViewFullSize?.(item.url)}
                                />
                                {size === 'full' && (
                                    <Button
                                        onClick={() => item.url && onViewFullSize?.(item.url)}
                                        variant="ghost"
                                        className="absolute top-2 left-2 bg-black/50 hover:bg-black/70 text-white rounded-lg p-2"
                                        title="View full size"
                                    >
                                        <ZoomIn className="w-4 h-4" />
                                    </Button>
                                )}
                            </>
                        )}
                {status === 'approved' && (
                    <Badge className="absolute top-2 left-2 bg-green-500 text-white">
                        Approved
                    </Badge>
                )}
                {item.uploadedBy?.flagCount && item.uploadedBy.flagCount > 0 && (
                    <Badge className="absolute top-2 right-2 bg-red-500 text-white">
                        {item.uploadedBy.flagCount}
                        {' '}
                        {t('flags')}
                    </Badge>
                )}
            </div>
        );
    };

    const renderUserInfo = (compact: boolean = false) => (
        <div className={`flex items-center gap-2 ${compact ? '' : 'mb-2'}`}>
            <div className={`${compact ? 'w-10 h-10' : 'w-8 h-8'} bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center`}>
                <User className={`${compact ? 'w-5 h-5' : 'w-4 h-4'} text-white`} />
            </div>
            <div className={compact ? '' : 'flex-1'}>
                <div className="font-semibold text-gray-800 dark:text-gray-100">
                    {status === 'pending'
                        ? (
                                <a
                                    href={`https://development.secretswingerlust.com/profile/${item.uploadedBy?.username}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:underline flex items-center gap-1"
                                >
                                    {item.uploadedBy?.username}
                                    <ExternalLink className="w-3 h-3" />
                                </a>
                            )
                        : (
                                item.uploadedBy?.username
                            )}
                </div>
                <div className="text-xs text-gray-500">
                    {new Date(item.createdAt).toLocaleDateString()}
                </div>
            </div>
        </div>
    );

    const renderBadges = () => (
        <div className="flex items-center gap-2 mb-2">
            <Badge className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-xs px-2 py-0.5">
                {item.type === E_ModerationMediaType.VIDEO ? 'Video' : 'Image'}
            </Badge>
            {item.uploadedBy?.flagCount !== undefined && (
                <Badge className="bg-red-100 text-red-700 text-xs px-2 py-0.5">
                    {item.uploadedBy.flagCount}
                    {' '}
                    {t('flags')}
                </Badge>
            )}
        </div>
    );

    const renderPendingActions = () => (
        <>
            <div className="flex gap-2 mt-2">
                <Button
                    onClick={() => onApprove?.(item)}
                    disabled={mutationLoading}
                    className="flex-1 bg-gradient-to-r from-green-400 to-emerald-500 hover:from-green-500 hover:to-emerald-600 text-white rounded-lg py-2 transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Check className="w-4 h-4 mr-2" />
                    {mutationLoading ? 'Approving...' : 'Approve'}
                </Button>
            </div>
            <div className="flex gap-2 mt-2">
                <Button
                    variant="ghost"
                    onClick={() => onOpenNotes?.(item)}
                    className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/20 relative flex-1"
                    title={t('notes-count', { count: item.notes?.length || 0 })}
                >
                    <FileText className="w-4 h-4 mr-1" />
                    Notes
                    {item.notes && item.notes.length > 0 && (
                        <Badge className="absolute -top-2 -right-2 bg-purple-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                            {item.notes.length}
                        </Badge>
                    )}
                </Button>
                <Button
                    variant="ghost"
                    onClick={() => {
                        if (item.uploadedBy?.id && item.uploadedBy?.username) {
                            onSendMessage?.(item.uploadedBy.id, item.uploadedBy.username);
                        }
                    }}
                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 flex-1"
                    title="Send warning message"
                >
                    <MessageSquare className="w-4 h-4 mr-1" />
                    Message
                </Button>
            </div>
            <div className="flex gap-2 mt-2">
                <Button
                    variant="ghost"
                    onClick={() => onReject?.(item)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 flex-1"
                >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Reject
                </Button>
            </div>
        </>
    );

    const renderApprovedActions = () => (
        <>
            <div className="flex gap-2 mt-2">
                <Button
                    variant="ghost"
                    onClick={() => onOpenNotes?.(item)}
                    className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/20 relative flex-1"
                    title={t('notes-count', { count: item.notes?.length || 0 })}
                >
                    <FileText className="w-4 h-4 mr-2" />
                    Notes
                    {item.notes && item.notes.length > 0 && (
                        <Badge className="absolute -top-2 -right-2 bg-purple-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                            {item.notes.length}
                        </Badge>
                    )}
                </Button>
                <Button
                    variant="ghost"
                    onClick={() => onRejectApproved?.(item)}
                    disabled={mutationLoading}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 flex-1"
                    title="Reject - This was approved by mistake"
                >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Reject
                </Button>
            </div>
            <div className="flex gap-2 mt-2">
                <Button
                    variant="ghost"
                    onClick={() => {
                        if (item.uploadedBy?.id && item.uploadedBy?.username) {
                            onSendMessage?.(item.uploadedBy.id, item.uploadedBy.username);
                        }
                    }}
                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 flex-1"
                    title="Send warning message"
                >
                    <MessageSquare className="w-4 h-4 mr-1" />
                    Message
                </Button>
                <Button
                    variant="ghost"
                    onClick={() => {
                        if (item.uploadedBy) {
                            onSuspendUser?.({ id: item.uploadedBy.id ?? '', name: item.uploadedBy.username ?? '' });
                        }
                    }}
                    className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 dark:hover:bg-orange-900/20 flex-1"
                >
                    <UserX className="w-4 h-4" />
                    Suspend
                </Button>
            </div>
        </>
    );

    if (viewMode === 'grid') {
        return (
            <>
                {renderMedia('full')}
                <div className="p-4 flex flex-col gap-3">
                    {renderUserInfo()}
                    {renderBadges()}
                    {status === 'pending' && renderPendingActions()}
                    {status === 'approved' && renderApprovedActions()}
                </div>
            </>
        );
    }

    // List view
    return (
        <>
            {renderMedia('thumbnail')}
            <div className="flex flex-col justify-center flex-1 min-w-0">
                {renderUserInfo(true)}
                {renderBadges()}
            </div>
            <div className={`flex ${status === 'pending' ? 'flex-col' : 'gap-2'} items-${status === 'pending' ? 'end' : 'center'} ml-6`}>
                {status === 'pending' && (
                    <Button
                        onClick={() => onApprove?.(item)}
                        disabled={mutationLoading}
                        className="bg-gradient-to-r from-green-400 to-emerald-500 hover:from-green-500 hover:to-emerald-600 text-white rounded-lg px-6 py-2 transition-all duration-200 hover:scale-105 w-32 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Check className="w-4 h-4 mr-2" />
                        {mutationLoading ? 'Approving...' : 'Approve'}
                    </Button>
                )}
                <div className="flex gap-2 mt-2">
                    <Button
                        variant="ghost"
                        onClick={() => onOpenNotes?.(item)}
                        className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/20 relative"
                        title={t('notes-count', { count: item.notes?.length || 0 })}
                    >
                        <FileText className="w-4 h-4" />
                        {item.notes && item.notes.length > 0 && (
                            <Badge className="absolute -top-2 -right-2 bg-purple-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                                {item.notes.length}
                            </Badge>
                        )}
                    </Button>
                    <Button
                        variant="ghost"
                        onClick={() => status === 'pending' ? onReject?.(item) : onRejectApproved?.(item)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                        <Trash2 className="w-4 h-4" />
                    </Button>
                    {status === 'approved' && (
                        <>
                            <Button
                                variant="ghost"
                                onClick={() => {
                                    if (item.uploadedBy?.id && item.uploadedBy?.username) {
                                        onSendMessage?.(item.uploadedBy.id, item.uploadedBy.username);
                                    }
                                }}
                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                title="Send warning message"
                            >
                                <MessageSquare className="w-4 h-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                onClick={() => {
                                    if (item.uploadedBy) {
                                        onSuspendUser?.({ id: item.uploadedBy.id ?? '', name: item.uploadedBy.username ?? '' });
                                    }
                                }}
                                className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 dark:hover:bg-orange-900/20"
                            >
                                <UserX className="w-4 h-4" />
                            </Button>
                        </>
                    )}
                </div>
            </div>
        </>
    );
}
