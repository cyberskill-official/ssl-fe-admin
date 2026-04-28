import { AlertCircle, Check, CheckCircle2, Clock, Star, Trash2, UserX, X, ZoomIn } from 'lucide-react';
import * as React from 'react';

import { Badge, Button, Dialog, DialogContent, DialogTitle } from '#shared/component';
import { useTranslate } from '#shared/i18n';
import { cn } from '#shared/util';

import type { I_ProfileCardProps } from '../age-verification.type';

const WORD_SPLIT_RE = /[\s_-]/;

export type { I_ProfileCardProps };

function getInitials(name: string) {
    return name
        .split(WORD_SPLIT_RE)
        .filter(Boolean)
        .map(n => n[0]?.toUpperCase())
        .join('')
        .slice(0, 2);
}

function Avatar({ name }: { name: string }) {
    const colors = [
        'bg-gradient-to-br from-blue-400 to-purple-500',
        'bg-gradient-to-br from-pink-400 to-red-500',
        'bg-gradient-to-br from-green-400 to-teal-500',
        'bg-gradient-to-br from-yellow-400 to-orange-500',
        'bg-gradient-to-br from-indigo-400 to-blue-600',
    ];
    const hash = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const color = colors[hash % colors.length];
    return (
        <div className={cn(
            'w-12 h-12 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-md border-2 border-white dark:border-slate-700',
            color,
        )}
        >
            {getInitials(name)}
        </div>
    );
}

function PriorityBadge({ priority }: { priority?: string }) {
    const priorityConfig = {
        high: { color: 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 border-red-200 dark:border-red-700', icon: AlertCircle },
        medium: { color: 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-700', icon: Clock },
        low: { color: 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700', icon: CheckCircle2 },
    };
    const config = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.medium;
    const Icon = config.icon;
    return (
        <Badge className={cn('flex items-center gap-1', config.color)}>
            <Icon className="w-3 h-3" />
            {priority?.toUpperCase() || 'MEDIUM'}
        </Badge>
    );
}

function FallbackImage({ label }: { label: string }) {
    return (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground bg-gray-100 dark:bg-slate-600">
            <svg width="40" height="40" fill="none" viewBox="0 0 24 24">
                <rect width="24" height="24" rx="6" fill="#e5e7eb" className="dark:fill-slate-500" />
                <path d="M8 17l2.5-3.5a1 1 0 0 1 1.6 0L15 17m-7 0h8a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2z" stroke="#9ca3af" className="dark:stroke-slate-400" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="9" cy="10" r="1" fill="#9ca3af" className="dark:fill-slate-400" />
            </svg>
            <span className="text-xs mt-1">
                {label}
                {' '}
                not available
            </span>
        </div>
    );
}

export function ProfileCard({
    name,
    age,
    documentType,
    idImage,
    selfieImage,
    submittedAt,
    priority,
    status,
    reason,
    onApprove,
    /* onMessage, */
    onReject,
    loading = false,
}: I_ProfileCardProps) {
    const { t } = useTranslate('moderation');
    const [date = '', time = ''] = submittedAt.split(' ');
    const [idImgError, setIdImgError] = React.useState(false);
    const [selfieImgError, setSelfieImgError] = React.useState(false);
    const [compareOpen, setCompareOpen] = React.useState(false);
    const [zoomedImage, setZoomedImage] = React.useState<{ url: string; label: string } | null>(null);

    return (
        <div className="group relative bg-white/80 dark:bg-slate-800/80 glass p-6 rounded-2xl border border-border dark:border-slate-700 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden animate-fade-in-up hover:ring-2 hover:ring-primary/30 dark:hover:ring-primary/20 hover:-translate-y-1">
            {/* Header */}
            <div className="flex items-center gap-3 mb-2">
                <Avatar name={name} />
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-nowrap">
                        <span className="font-bold text-lg text-foreground flex-1 min-w-0 truncate max-w-[180px]">{name}</span>
                        <div className="flex items-center gap-2">
                            {status === 'REJECTED' && (
                                <Badge className="bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 border-red-200 dark:border-red-700">
                                    Rejected
                                </Badge>
                            )}
                            <span className="flex-shrink-0 ml-2"><PriorityBadge priority={priority} /></span>
                        </div>
                    </div>
                    {status === 'REJECTED' && reason && (
                        <div className="mt-1 text-sm text-red-600 dark:text-red-300 truncate">
                            <strong>Reason:</strong>
                            {' '}
                            {reason}
                        </div>
                    )}
                    <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground mt-1">
                        <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                        Age:
                        {' '}
                        <span className="font-semibold text-foreground">
                            {age}
                            {' '}
                            years
                        </span>
                        <span className="w-2 h-2 bg-purple-500 rounded-full flex-shrink-0 ml-3" />
                        <span className="truncate">{documentType}</span>
                        <span className="mx-2 text-gray-300 dark:text-gray-600">•</span>
                        <span className="text-xs text-muted-foreground">
                            Submitted:
                            {date}
                            {' '}
                            {time}
                        </span>
                    </div>
                </div>
            </div>
            <div className="border-b border-dashed border-border dark:border-slate-600 mb-4" />
            {/* Verification Documents */}
            <div className="bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-700/50 dark:to-slate-600/50 border-2 border-dashed border-primary/20 dark:border-primary/30 rounded-xl p-5 mb-6">
                <div className="text-center mb-4">
                    <div className="flex items-center justify-center gap-2 mb-2">
                        <Star className="w-4 h-4 text-primary" />
                        <h4 className="text-sm font-bold text-foreground">Verification Documents</h4>
                        <Star className="w-4 h-4 text-primary" />
                    </div>
                    <p className="text-xs text-muted-foreground">Compare ID document and selfie for identity verification</p>
                </div>
                <div className="flex flex-row gap-6 items-center justify-center mb-4">
                    <div className="flex-1 flex flex-col items-center">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full" />
                            <p className="text-xs font-semibold text-foreground">{documentType}</p>
                        </div>
                        <div className="relative w-full max-w-[180px] aspect-[4/3] border border-border dark:border-slate-600 rounded-xl bg-gray-100 dark:bg-slate-600 flex items-center justify-center overflow-hidden">
                            {(!idImgError)
                                ? (
                                        <img
                                            src={idImage}
                                            alt="ID Document"
                                            className="object-cover w-full h-full"
                                            onError={() => setIdImgError(true)}
                                        />
                                    )
                                : <FallbackImage label="ID" />}
                        </div>
                    </div>
                    <div className="flex flex-col items-center justify-center px-2">
                        <span className="text-lg font-bold text-gray-400 dark:text-gray-500 select-none">VS</span>
                    </div>
                    <div className="flex-1 flex flex-col items-center">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full" />
                            <p className="text-xs font-semibold text-foreground">Selfie Photo</p>
                        </div>
                        <div className="relative w-full max-w-[180px] aspect-square border border-border dark:border-slate-600 rounded-xl bg-gray-100 dark:bg-slate-600 flex items-center justify-center overflow-hidden">
                            {(!selfieImgError)
                                ? (
                                        <img
                                            src={selfieImage}
                                            alt="Selfie"
                                            className="object-cover w-full h-full"
                                            onError={() => setSelfieImgError(true)}
                                        />
                                    )
                                : <FallbackImage label="Selfie" />}
                        </div>
                    </div>
                </div>
                <div className="flex justify-center mb-2">
                    <Button size="sm" variant="outline" onClick={() => setCompareOpen(true)} className="border-gray-200 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700">
                        Compare Full Size
                    </Button>
                </div>
                <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900/50 rounded-lg">
                    <p className="text-xs text-blue-700 dark:text-blue-300 text-center font-medium">
                        🔍 Compare facial features and verify identity match
                    </p>
                </div>
            </div>
            {/* Compare Modal */}
            <Dialog open={compareOpen} onOpenChange={setCompareOpen}>
                <DialogContent className="max-w-[90vw] max-h-[90vh] w-full bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm border border-white/20 dark:border-slate-700/20">
                    <DialogTitle className="text-foreground">Compare Documents - Click images to enlarge</DialogTitle>
                    <div className="flex flex-row gap-6 items-center justify-center py-4 h-[60vh] min-h-[320px]">
                        <div className="flex-1 flex flex-col items-center h-full">
                            <div className="mb-2 text-xs font-semibold text-foreground">{documentType}</div>
                            <div
                                className="relative w-full h-full flex-1 border border-border dark:border-slate-600 rounded-xl bg-gray-100 dark:bg-slate-600 flex items-center justify-center overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all group"
                                onClick={() => !idImgError && setZoomedImage({ url: idImage, label: documentType })}
                                role="button"
                                tabIndex={0}
                            >
                                {(!idImgError)
                                    ? (
                                            <>
                                                <img
                                                    src={idImage}
                                                    alt="ID Document"
                                                    className="object-contain w-full h-full"
                                                />
                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 dark:bg-slate-800/90 rounded-full p-3">
                                                        <ZoomIn className="w-6 h-6 text-primary" />
                                                    </div>
                                                </div>
                                            </>
                                        )
                                    : <FallbackImage label="ID" />}
                            </div>
                        </div>
                        <div className="flex flex-col items-center justify-center px-2 h-full">
                            <span className="text-2xl font-bold text-gray-400 dark:text-gray-500 select-none">VS</span>
                        </div>
                        <div className="flex-1 flex flex-col items-center h-full">
                            <div className="mb-2 text-xs font-semibold text-foreground">Selfie Photo</div>
                            <div
                                className="relative w-full h-full flex-1 border border-border dark:border-slate-600 rounded-xl bg-gray-100 dark:bg-slate-600 flex items-center justify-center overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all group"
                                onClick={() => !selfieImgError && setZoomedImage({ url: selfieImage, label: 'Selfie Photo' })}
                                role="button"
                                tabIndex={0}
                            >
                                {(!selfieImgError)
                                    ? (
                                            <>
                                                <img
                                                    src={selfieImage}
                                                    alt="Selfie"
                                                    className="object-contain w-full h-full"
                                                />
                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 dark:bg-slate-800/90 rounded-full p-3">
                                                        <ZoomIn className="w-6 h-6 text-primary" />
                                                    </div>
                                                </div>
                                            </>
                                        )
                                    : <FallbackImage label="Selfie" />}
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Zoomed Image Modal */}
            <Dialog open={!!zoomedImage} onOpenChange={() => setZoomedImage(null)}>
                <DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-full bg-black/95 dark:bg-black/95 backdrop-blur-sm border-0 p-0 overflow-hidden">
                    <div className="relative w-full h-full flex flex-col">
                        <div className="absolute top-4 right-4 z-50 flex items-center gap-4">
                            <div className="bg-white/90 dark:bg-slate-800/90 px-4 py-2 rounded-lg">
                                <span className="text-sm font-semibold text-foreground">{zoomedImage?.label}</span>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setZoomedImage(null)}
                                className="bg-white/90 dark:bg-slate-800/90 hover:bg-white dark:hover:bg-slate-700 rounded-full"
                                aria-label={t('close')}
                            >
                                <X className="w-5 h-5" />
                            </Button>
                        </div>
                        <div className="flex-1 flex items-center justify-center p-8 overflow-auto">
                            {zoomedImage && (
                                <img
                                    src={zoomedImage.url}
                                    alt={zoomedImage.label}
                                    className="max-w-full max-h-full object-contain"
                                />
                            )}
                        </div>
                        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white/90 dark:bg-slate-800/90 px-4 py-2 rounded-lg">
                            <p className="text-xs text-muted-foreground">Click outside or press ESC to close</p>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Action Buttons - hidden for rejected profiles */}
            {status !== 'REJECTED' && (
                <div className="flex gap-3">
                    <Button
                        variant="default"
                        className="flex items-center justify-center gap-2 flex-1 text-sm font-semibold bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                        onClick={onApprove}
                        disabled={loading}
                    >
                        <Check className="w-4 h-4" />
                        {loading ? 'Processing...' : 'Approve'}
                    </Button>
                    {/*  <Button
                        variant="outline"
                        size="icon"
                        className="hover:bg-blue-50 dark:hover:bg-blue-900/50 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-200 dark:hover:border-blue-700 transition-all duration-300"
                        onClick={onMessage}
                        aria-label={t('message')}
                    >
                        <MessageSquare className="w-4 h-4" />
                    </Button> */}
                    <Button
                        variant="outline"
                        size="icon"
                        className="hover:bg-red-50 dark:hover:bg-red-900/50 hover:text-red-600 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-700 transition-all duration-300"
                        onClick={onReject}
                        disabled={loading}
                        aria-label={status === 'REJECTED' ? t('delete') : t('reject')}
                    >
                        {status === 'REJECTED' ? <Trash2 className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
                    </Button>
                </div>
            )}
        </div>
    );
}
