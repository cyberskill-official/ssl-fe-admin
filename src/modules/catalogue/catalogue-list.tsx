/* eslint-disable react-dom/no-unsafe-iframe-sandbox */
import type { ColumnDef } from '@tanstack/react-table';

import {
    Edit,
    Grid3X3,
    Image,
    List,
    Play,
    Plus,
    Trash2,
    Video,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';

import type { F_CatalogueListItemFragment } from '#shared/graphql';

import { Badge, Button, Dialog, DialogContent, DialogHeader, DialogTitle, Pagination, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '#shared/component';
import { DataTable } from '#shared/component/data-table';
import { E_CatalogueType, E_TagType } from '#shared/graphql';
import { useTranslate } from '#shared/i18n';

import type { I_CatalogueListProps } from './catalogue.type';

import { useGetTagOptions } from '../tag/tag.hook';
import { CatalogueCard } from './catalogue-card';

const UNDERSCORE_RE = /_/g;
const WORD_BOUNDARY_RE = /\b\w/g;
const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;

function getTagTypeFallback(type?: string | null) {
    return type
        ? type.toLowerCase().replace(UNDERSCORE_RE, ' ').replace(WORD_BOUNDARY_RE, char => char.toUpperCase())
        : '';
}

function getSafeTranslation(value: unknown, fallback: string) {
    return typeof value === 'string' && value !== '[object Object]' ? value : fallback;
}

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

export function CatalogueList({
    catalogues,
    loading,
    onEditCatalogue,
    onCreateCatalogue,
    onDeleteCatalogue,
    totalDocs = 0,
    page = 1,
    pageSize = 10,
    onPageChange,
    onPageSizeChange,
    search = '',
    onSearchChange,
    selectedType = 'ALL',
    onTypeChange,
    totalPages = 1,
    hasNextPage = false,
    hasPrevPage = false,
    viewMode = 'grid',
    onViewModeChange,
}: I_CatalogueListProps) {
    const { t } = useTranslate('catalogue');
    const { t: tTag } = useTranslate('tag');
    const [selectedMedia, setSelectedMedia] = useState<F_CatalogueListItemFragment | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const { tags } = useGetTagOptions(
        { isDel: false, type: E_TagType.CATALOGUE },
        {
            pagination: false,
            sort: { name: 1 },
            projection: { id: 1, name: 1, type: 1 },
            lean: true,
        },
    );

    const catalogueTypeOptions = [
        { value: 'ALL', label: t('all-types'), icon: <Image className="h-4 w-4" /> },
        { value: 'BOOTYCALL', label: 'Bootycall', icon: <Image className="h-4 w-4" /> },
        { value: 'PARTY', label: 'Party', icon: <Video className="h-4 w-4" /> },
        { value: 'TRAVEL', label: 'Travel', icon: <Play className="h-4 w-4" /> },
    ];

    const tagOptions = [
        { value: 'ALL', label: t('all-tags') },
        ...tags.map(tag => ({
            value: tag.id || '',
            label: tag.name ?? '',
        })),
    ];

    const handleMediaClick = (catalogue: F_CatalogueListItemFragment) => {
        setSelectedMedia(catalogue);
        setIsModalOpen(true);
    };

    const columns: ColumnDef<F_CatalogueListItemFragment>[] = [
        {
            accessorKey: 'type',
            header: t('type'),
            cell: ({ row }) => {
                const type = row.getValue('type') as E_CatalogueType | null;
                return (
                    <div className="flex items-center gap-2">
                        <div className={`p-1 rounded bg-gradient-to-br ${type ? (catalogueTypeGradients[type] || 'from-gray-400 to-gray-600') : 'from-gray-400 to-gray-600'}`}>
                            {type ? (catalogueTypeIcons[type] || <Image className="h-3 w-3 text-white" />) : <Image className="h-3 w-3 text-white" />}
                        </div>
                        <span className="text-sm font-medium">{t(type?.toLowerCase() || 'unknown')}</span>
                    </div>
                );
            },
        },
        {
            accessorKey: 'tag',
            header: t('tag'),
            cell: ({ row }) => {
                const tag = row.original.tag;
                const typeKey = tag?.type?.toLowerCase().replace(UNDERSCORE_RE, '-');
                const translatedType = typeKey ? tTag(typeKey) : undefined;
                const typeLabel = getSafeTranslation(translatedType, getTagTypeFallback(tag?.type));
                return (
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{tag?.name ?? 'Untagged'}</span>
                        {typeLabel && (
                            <Badge variant="outline" className="text-xs">
                                {typeLabel}
                            </Badge>
                        )}
                    </div>
                );
            },
        },
        {
            accessorKey: 'url',
            header: t('media'),
            cell: ({ row }) => {
                const catalogue = row.original;
                const url = catalogue?.url;

                if (!catalogue || !url) {
                    return (
                        <div className="w-16 h-12 bg-gray-100 dark:bg-gray-800 rounded border flex items-center justify-center">
                            <span className="text-xs text-gray-400">No Media</span>
                        </div>
                    );
                }

                return (
                    <div
                        className="cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => handleMediaClick(catalogue)}
                    >
                        {catalogue.type === E_CatalogueType.BOOTYCALL && (
                            <img
                                src={url}
                                alt={catalogue.tag?.name || 'Catalogue image'}
                                className="w-16 h-12 object-cover rounded border"
                            />
                        )}
                        {catalogue.type === E_CatalogueType.PARTY && (
                            isEmbedUrl(url)
                                ? (
                                        <div className="w-16 h-12 bg-purple-100 dark:bg-purple-800 rounded border flex items-center justify-center">
                                            <Video className="h-6 w-6 text-purple-500" />
                                        </div>
                                    )
                                : (
                                        <video
                                            src={url}
                                            className="w-16 h-12 object-cover rounded border"
                                            controls
                                        />
                                    )
                        )}
                        {catalogue.type === E_CatalogueType.TRAVEL && (
                            <div className="w-16 h-12 bg-blue-100 dark:bg-blue-800 rounded border flex items-center justify-center">
                                <Play className="h-6 w-6 text-blue-500" />
                            </div>
                        )}
                    </div>
                );
            },
        },
        {
            accessorKey: 'createdAt',
            header: t('created-at'),
            cell: ({ row }) => {
                const val = row.getValue('createdAt');
                return <span className="text-sm text-gray-600 dark:text-gray-400">{val ? new Date(val as string).toLocaleString() : '-'}</span>;
            },
        },
        {
            accessorKey: 'updatedAt',
            header: t('updated-at'),
            cell: ({ row }) => {
                const val = row.getValue('updatedAt');
                return <span className="text-sm text-gray-600 dark:text-gray-400">{val ? new Date(val as string).toLocaleString() : '-'}</span>;
            },
        },
        {
            id: 'actions',
            header: t('actions'),
            cell: ({ row }) => {
                const catalogue = row.original;
                return (
                    <div className="flex items-center gap-2">
                        <Button
                            onClick={() => onEditCatalogue?.(catalogue)}
                            size="sm"
                            variant="outline"
                            className="h-8 w-8 p-0"
                        >
                            <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                            onClick={() => onDeleteCatalogue?.(catalogue)}
                            size="sm"
                            variant="outline"
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                        >
                            <Trash2 className="h-3 w-3" />
                        </Button>
                    </div>
                );
            },
        },
    ];

    const filteredCatalogues = catalogues;

    return (
        <>
            <div className="space-y-6">
                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-4">
                    <Select value={selectedType} onValueChange={onTypeChange}>
                        <SelectTrigger className="w-full sm:w-48">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {catalogueTypeOptions.map(option => (
                                <SelectItem key={option.value} value={option.value}>
                                    <div className="flex items-center gap-2">
                                        {option.icon}
                                        {option.label}
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <div className="flex-1">
                        <Select value={search} onValueChange={onSearchChange}>
                            <SelectTrigger className="h-12 text-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                                <SelectValue placeholder={t('select-tag')} />
                            </SelectTrigger>
                            <SelectContent>
                                {tagOptions.map(option => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant={viewMode === 'grid' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => onViewModeChange?.('grid')}
                            className="h-10 w-10 p-0"
                        >
                            <Grid3X3 className="h-4 w-4" />
                        </Button>
                        <Button
                            variant={viewMode === 'table' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => onViewModeChange?.('table')}
                            className="h-10 w-10 p-0"
                        >
                            <List className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Content */}
                {loading
                    ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
                            </div>
                        )
                    : viewMode === 'grid'
                        ? (
                                <>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                        <AnimatePresence>
                                            {filteredCatalogues.map((catalogue, index) => (
                                                <motion.div
                                                    key={catalogue.id}
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -20 }}
                                                    transition={{ duration: 0.3, delay: index * 0.1 }}
                                                >
                                                    <CatalogueCard
                                                        catalogue={catalogue}
                                                        onEdit={onEditCatalogue}
                                                        onDelete={onDeleteCatalogue}
                                                        t={t as (key: string, params?: Record<string, unknown>) => string}
                                                    />
                                                </motion.div>
                                            ))}
                                        </AnimatePresence>
                                    </div>
                                    {filteredCatalogues.length === 0 && (
                                        <div className="text-center py-12">
                                            <Image className="mx-auto h-12 w-12 text-gray-400" />
                                            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">{t('no-catalogues')}</h3>
                                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t('no-catalogues-description')}</p>
                                        </div>
                                    )}
                                </>
                            )
                        : (
                                <DataTable
                                    columns={columns}
                                    data={filteredCatalogues}
                                    showPagination={false}
                                    showToolbar={false}
                                />
                            )}
                {/* Pagination */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/90 dark:bg-gray-800/95 backdrop-blur-xl rounded-2xl border border-white/30 dark:border-gray-600/50 shadow-xl"
                >
                    {totalDocs > 0
                        ? (
                                <Pagination
                                    total={totalDocs}
                                    page={page}
                                    limit={pageSize}
                                    onPageChange={onPageChange}
                                    onLimitChange={onPageSizeChange}
                                    hasNextPage={hasNextPage}
                                    hasPrevPage={hasPrevPage}
                                    totalPages={totalPages}
                                    pageSizeOptions={PAGE_SIZE_OPTIONS}
                                    className="border-0 bg-transparent"
                                />
                            )
                        : (
                                <div className="flex items-center justify-between p-4">
                                    <div className="text-sm text-gray-700 dark:text-gray-300">
                                        Showing
                                        {' '}
                                        {filteredCatalogues.length}
                                        {' '}
                                        catalogues
                                    </div>
                                    <div className="text-sm text-gray-500">
                                        Pagination data not available
                                    </div>
                                </div>
                            )}
                </motion.div>
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
                            onClick={onCreateCatalogue}
                            className="h-14 w-14 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-2xl hover:shadow-3xl transition-all duration-300"
                        >
                            <Plus className="h-6 w-6" />
                        </Button>
                    </motion.div>
                </motion.div>
            </div>

            {/* Media Preview Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-hidden">
                    <DialogHeader>
                        <DialogTitle className="text-center">
                            {selectedMedia?.tag?.name ?? t('untagged')}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col gap-4 justify-center items-center w-full">
                        {/* Show image if url is image */}
                        {selectedMedia?.url && isImageUrl(selectedMedia.url) && (
                            <img
                                src={selectedMedia.url}
                                alt={selectedMedia.tag?.name || 'Catalogue image'}
                                className="max-w-full max-h-[70vh] object-contain rounded-lg"
                            />
                        )}
                        {/* Show video if url is video */}
                        {selectedMedia?.url && isVideoUrl(selectedMedia.url) && (
                            <video
                                src={selectedMedia.url}
                                controls
                                autoPlay
                                className="max-w-full max-h-[70vh] object-contain rounded-lg"
                            />
                        )}
                        {/* Show iframe if url is embed stream */}
                        {selectedMedia?.url && isEmbedUrl(selectedMedia.url) && (
                            <iframe
                                src={selectedMedia.url}
                                title={selectedMedia.tag?.name || 'Catalogue video'}
                                frameBorder="0"
                                allowFullScreen
                                sandbox="allow-forms allow-scripts allow-pointer-lock allow-same-origin allow-top-navigation"
                                allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
                                className="w-full aspect-video max-h-[70vh] rounded-lg"
                            />
                        )}
                        {/* Fallback if no media */}
                        {!selectedMedia?.url && (
                            <div className="w-full h-64 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center text-gray-400">
                                {t('no-media')}
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
