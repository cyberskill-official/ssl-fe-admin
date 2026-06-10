/* eslint-disable react-dom/no-unsafe-iframe-sandbox */
import { Edit, Image, Play, Trash2, Video } from 'lucide-react';
import { motion } from 'motion/react';
import * as React from 'react';
import { useState } from 'react';

import type { T_Catalogue } from '#shared/graphql';

import { Badge, Button, Dialog, DialogContent, DialogHeader, DialogTitle } from '#shared/component';

function isEmbedUrl(url?: string | null) {
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
}

function getMediaExtension(urlStr?: string | null) {
    if (!urlStr)
        return '';
    try {
        const url = new URL(urlStr);
        const pathname = url.pathname;
        const filename = pathname.split('/').pop() || '';
        const lastDot = filename.lastIndexOf('.');
        if (lastDot === -1)
            return '';
        return filename.slice(lastDot + 1).toLowerCase();
    }
    catch {
        const cleanUrl = (urlStr.split('?')[0] ?? '').split('#')[0] ?? '';
        const filename = cleanUrl.split('/').pop() ?? '';
        const lastDot = filename.lastIndexOf('.');
        if (lastDot === -1)
            return '';
        return filename.slice(lastDot + 1).toLowerCase();
    }
}

function isImageUrl(url?: string | null) {
    if (!url)
        return false;
    const ext = getMediaExtension(url);
    return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic', 'heif'].includes(ext);
}

function isVideoUrl(url?: string | null) {
    if (!url)
        return false;
    const ext = getMediaExtension(url);
    return ['mp4', 'avi', 'mov', 'wmv', 'webm', 'ogg', 'mkv', '3gp'].includes(ext);
}

interface I_CatalogueCardProps {
    catalogue: T_Catalogue;
    onEdit?: (catalogue: T_Catalogue) => void;
    onDelete?: (catalogue: T_Catalogue) => void;
    t: (key: string, params?: Record<string, unknown>) => string;
}

const catalogueTypeIcons = {
    BOOTYCALL: <Image className="h-4 w-4" />,
    PARTY: <Video className="h-4 w-4" />,
    TRAVEL: <Play className="h-4 w-4" />,
};

const catalogueTypeGradients = {
    BOOTYCALL: 'from-pink-400 via-red-400 to-pink-600',
    PARTY: 'from-purple-400 via-violet-400 to-purple-600',
    TRAVEL: 'from-blue-400 via-cyan-400 to-blue-600',
};

const CatalogueCard: React.FC<I_CatalogueCardProps> = ({ catalogue, onEdit, onDelete, t }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleMediaClick = () => {
        setIsModalOpen(true);
    };

    const hasUrl = !!catalogue.url;
    const isImage = isImageUrl(catalogue.url);
    const isVideo = isVideoUrl(catalogue.url);
    const isEmbed = isEmbedUrl(catalogue.url);

    return (
        <>
            <motion.div
                whileHover={{
                    scale: 1.02,
                    y: -4,
                    transition: { duration: 0.2 },
                }}
                className={`group relative bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-xl border border-white/30 dark:border-gray-600/50 shadow-lg hover:shadow-xl transition-all duration-300 ${catalogue.type ? (catalogueTypeGradients[catalogue.type as keyof typeof catalogueTypeGradients] || 'shadow-gray-500/30') : 'shadow-gray-500/30'}`}
            >
                {/* Card Content */}
                <div className="p-4">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-3">
                        <div className={`p-2 rounded-lg bg-gradient-to-br ${catalogue.type ? (catalogueTypeGradients[catalogue.type as keyof typeof catalogueTypeGradients] || 'from-gray-400 to-gray-600') : 'from-gray-400 to-gray-600'}`}>
                            {catalogue.type ? (catalogueTypeIcons[catalogue.type as keyof typeof catalogueTypeIcons] || <Image className="h-4 w-4 text-white" />) : <Image className="h-4 w-4 text-white" />}
                        </div>
                        <Badge variant="outline" className="text-xs border-gray-300 dark:border-gray-500 text-gray-700 dark:text-gray-200 bg-white/50 dark:bg-gray-700/50">
                            {catalogue.tag?.name || t('untagged')}
                        </Badge>
                    </div>

                    {/* Media Preview */}
                    <div className="mb-3 relative">
                        {hasUrl
                            ? (
                                    isImage
                                        ? (
                                                <div
                                                    className="cursor-pointer hover:opacity-80 transition-opacity"
                                                    onClick={handleMediaClick}
                                                >
                                                    <img
                                                        src={catalogue.url || undefined}
                                                        alt={catalogue.tag?.name || 'Catalogue image'}
                                                        className="w-full h-32 object-cover rounded-lg border border-gray-200 dark:border-gray-600"
                                                    />
                                                </div>
                                            )
                                        : isVideo
                                            ? (
                                                    <div
                                                        className="cursor-pointer hover:opacity-80 transition-opacity"
                                                        onClick={handleMediaClick}
                                                    >
                                                        <video
                                                            src={catalogue.url || undefined}
                                                            controls
                                                            className="w-full h-32 object-cover rounded-lg border border-gray-200 dark:border-gray-600 bg-black"
                                                        />
                                                    </div>
                                                )
                                            : isEmbed
                                                ? (
                                                        <div
                                                            className="cursor-pointer hover:opacity-80 transition-opacity w-full h-32 relative"
                                                            onClick={handleMediaClick}
                                                        >
                                                            <iframe
                                                                src={catalogue.url || undefined}
                                                                title={catalogue.tag?.name || 'Catalogue video'}
                                                                frameBorder="0"
                                                                scrolling="no"
                                                                className="w-full h-full rounded-lg border border-gray-200 dark:border-gray-600 pointer-events-none bg-black"
                                                            />
                                                            <div className="absolute inset-0 flex items-center justify-center bg-black/10 hover:bg-black/30 transition-colors rounded-lg">
                                                                <Play className="h-10 w-10 text-white drop-shadow-md" />
                                                            </div>
                                                        </div>
                                                    )
                                                : (
                                                        <div className="w-full h-32 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center text-gray-400">
                                                            Unknown file type
                                                        </div>
                                                    )
                                )
                            : (
                                    <div className="w-full h-32 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center text-gray-400">
                                        {t('no-media')}
                                    </div>
                                )}
                    </div>

                    <div className="mb-3">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 text-sm leading-tight">
                            {catalogue.tag?.name || t('untagged')}
                        </h3>
                    </div>

                    {/* Created Info */}
                    <div className="text-xs text-gray-600 dark:text-gray-300 mb-3 space-y-1">
                        <div>
                            {t('created-at')}
                            :
                            {' '}
                            {catalogue.createdAt ? new Date(catalogue.createdAt).toLocaleString() : '-'}
                        </div>
                        <div>
                            {t('updated-at')}
                            :
                            {' '}
                            {catalogue.updatedAt ? new Date(catalogue.updatedAt).toLocaleString() : '-'}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                        <Button
                            onClick={() => onEdit?.(catalogue)}
                            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                        >
                            <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                            onClick={() => onDelete?.(catalogue)}
                            className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white"
                        >
                            <Trash2 className="h-3 w-3" />
                        </Button>
                    </div>
                </div>

                {/* Bottom Gradient Border */}
                <div className={`h-1 bg-gradient-to-r ${catalogue.type ? (catalogueTypeGradients[catalogue.type as keyof typeof catalogueTypeGradients] || 'from-gray-400 to-gray-600') : 'from-gray-400 to-gray-600'} rounded-b-xl`} />
            </motion.div>

            {/* Media Preview Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-hidden">
                    <DialogHeader>
                        <DialogTitle className="text-center">
                            {catalogue.tag?.name || t('untagged')}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col gap-4 justify-center items-center w-full">
                        {/* Show image if url is image */}
                        {catalogue.url && isImage && (
                            <img
                                src={catalogue.url}
                                alt={catalogue.tag?.name || 'Catalogue image'}
                                className="max-w-full max-h-[70vh] object-contain rounded-lg"
                            />
                        )}
                        {/* Show video if url is video */}
                        {catalogue.url && isVideo && (
                            <video
                                src={catalogue.url}
                                controls
                                autoPlay
                                className="max-w-full max-h-[70vh] object-contain rounded-lg"
                            />
                        )}
                        {/* Show iframe if url is embed stream */}
                        {catalogue.url && isEmbed && (
                            <iframe
                                src={catalogue.url}
                                title={catalogue.tag?.name || 'Catalogue video'}
                                frameBorder="0"
                                allowFullScreen
                                sandbox="allow-forms allow-scripts allow-pointer-lock allow-same-origin allow-top-navigation"
                                allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
                                className="w-full aspect-video max-h-[70vh] rounded-lg"
                            />
                        )}
                        {/* Fallback if no media */}
                        {!catalogue.url && (
                            <div className="w-full h-64 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center text-gray-400">
                                {t('no-media')}
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
};

export { CatalogueCard };
