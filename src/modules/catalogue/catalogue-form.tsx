import { Loader2, Save, X } from 'lucide-react';
import { motion } from 'motion/react';
import * as React from 'react';
import { useCallback, useImperativeHandle, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useForm } from 'react-hook-form';

import type { Input_CreateCatalogue, Input_UpdateCatalogue, T_Catalogue } from '#shared/graphql';

import { Button, Drawer, DrawerContent, DrawerHeader, DrawerTitle, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '#shared/component';
import { E_CatalogueType, E_TagType, E_UploadEntity, E_UploadType } from '#shared/graphql';
import { useKeyboardShortcuts } from '#shared/hooks';
import { useTranslate } from '#shared/i18n';
import { E_FormMode } from '#shared/typescript';

import type { I_CatalogueFormRef } from './catalogue.type';

import { useGetTagOptions } from '../tag/tag.hook';
import { useUpload } from '../upload/upload.hook';

const IMAGE_FILE_RE = /\.(?:jpg|jpeg|png|gif|webp)$/i;
const VIDEO_FILE_RE = /\.(?:mp4|avi|mov|wmv|webm|ogg)$/i;

export function CatalogueForm({ ref, onCreateSubmit, onUpdateSubmit, creating, updating }: {
    onCreateSubmit: (data: Input_CreateCatalogue) => void;
    onUpdateSubmit: (id: string, data: Input_UpdateCatalogue) => void;
    creating?: boolean;
    updating?: boolean;
    ref?: React.RefObject<I_CatalogueFormRef | null>;
}) {
    const { t } = useTranslate('catalogue');
    const [isOpen, setIsOpen] = useState(false);
    const [mode, setMode] = useState<E_FormMode>(E_FormMode.Create);
    const [currentCatalogue, setCurrentCatalogue] = useState<T_Catalogue>();
    const [uploadedUrl, setUploadedUrl] = useState<string>('');
    React.useEffect(() => {
        if (mode === E_FormMode.Update && currentCatalogue?.url) {
            // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect
            setUploadedUrl(currentCatalogue.url);
        }
    }, [mode, currentCatalogue]);
    const [uploading, setUploading] = useState(false);
    const { upload } = useUpload();

    const { tags, loading: tagsLoading } = useGetTagOptions(
        { isDel: false, type: E_TagType.CATALOGUE },
        {
            pagination: false,
            sort: { name: 1 },
            projection: { id: 1, name: 1, type: 1 },
            lean: true,
        },
    );

    const FORM_DEFAULT_VALUES: Input_CreateCatalogue = {
        type: E_CatalogueType.BOOTYCALL,
        tagId: '',
        url: '',
        isDel: false,
    };

    const {
        handleSubmit,
        reset,
        watch,
        setValue,
        formState: { errors },
    } = useForm({
        defaultValues: FORM_DEFAULT_VALUES,
        mode: 'onChange',
    });

    const selectedType = watch('type');

    useImperativeHandle(ref, () => ({
        open: (catalogue?: T_Catalogue) => {
            setCurrentCatalogue(catalogue);
            setMode(catalogue && catalogue.id ? E_FormMode.Update : E_FormMode.Create);
            setIsOpen(true);
            if (catalogue?.url) {
                setUploadedUrl(catalogue.url);
            }
            else {
                setUploadedUrl('');
            }
            reset(catalogue
                ? {
                        type: catalogue.type || E_CatalogueType.BOOTYCALL,
                        tagId: catalogue.tagId || '',
                        url: catalogue.url || '',
                        isDel: catalogue.isDel || false,
                    }
                : FORM_DEFAULT_VALUES);
        },
        close: () => {
            setIsOpen(false);
            setCurrentCatalogue(undefined);
            setUploadedUrl('');
            reset(FORM_DEFAULT_VALUES);
        },
    }));

    const _handleCancel = useCallback(() => {
        setIsOpen(false);
        setCurrentCatalogue(undefined);
    }, []);

    const handleFileUpload = async (file: File) => {
        setUploading(true);
        try {
            const isVideo = file.type.startsWith('video/');
            const uploadType = isVideo ? E_UploadType.VIDEO : E_UploadType.IMAGE;
            const url = await upload({
                file,
                type: uploadType,
                entity: E_UploadEntity.USER,
            });
            setUploadedUrl(url);
            setValue('url', url);
            return url;
        }
        finally {
            setUploading(false);
        }
    };

    const fileDropzone = useDropzone({
        accept: {
            'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'],
            'video/*': ['.mp4', '.avi', '.mov', '.wmv', '.webm', '.ogg'],
        },
        maxFiles: 1,
        onDrop: async (acceptedFiles) => {
            const file = acceptedFiles[0];
            if (file) {
                await handleFileUpload(file);
            }
        },
    });

    const _handleSubmit = (data: Input_CreateCatalogue) => {
        if (!uploadedUrl) {
            return;
        }

        const formData: Input_CreateCatalogue = {
            ...data,
            url: uploadedUrl,
        };

        if (mode === E_FormMode.Update && currentCatalogue?.id) {
            onUpdateSubmit(currentCatalogue.id, formData);
        }
        else {
            onCreateSubmit(formData);
        }
        ref?.current?.close();
    };

    const _handleKeyboardSubmit = useCallback(() => {
        const form = document.querySelector('form');
        if (form) {
            const submitButton = form.querySelector('button[type="submit"]') as HTMLButtonElement;
            if (submitButton && !submitButton.disabled) {
                submitButton.click();
            }
        }
    }, []);

    useKeyboardShortcuts({
        isActive: isOpen,
        onEscape: _handleCancel,
        onEnter: _handleKeyboardSubmit,
        requireCtrlOrMeta: true,
    });

    return (
        <Drawer open={isOpen} onOpenChange={_handleCancel} direction="right">
            <DrawerContent className="max-w-md max-h-screen flex flex-col">
                <DrawerHeader className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/50 dark:to-blue-950/50 border-b border-purple-100 dark:border-purple-800 flex-shrink-0">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg">
                                <span className="h-6 w-6 text-white font-bold">C</span>
                            </div>
                            <div>
                                <DrawerTitle className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                                    {mode === E_FormMode.Create ? t('add-catalogue') : t('edit-catalogue')}
                                </DrawerTitle>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                    {mode === E_FormMode.Create ? t('add-catalogue-description') : t('edit-catalogue-description')}
                                </p>
                            </div>
                        </div>
                        <Button variant="ghost" size="sm" onClick={_handleCancel} className="h-8 w-8 p-0 hover:bg-white/50 dark:hover:bg-gray-800/50">
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </DrawerHeader>
                <div className="flex-1 overflow-y-auto">
                    <form onSubmit={handleSubmit(_handleSubmit)} className="p-6 flex flex-col gap-6">
                        {/* Type Field */}
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-purple-600 dark:text-purple-400">
                                    {t('type')}
                                </label>
                                <Select
                                    value={selectedType}
                                    onValueChange={value => setValue('type', value as E_CatalogueType)}
                                >
                                    <SelectTrigger className="h-12 text-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={E_CatalogueType.BOOTYCALL}>Bootycall</SelectItem>
                                        <SelectItem value={E_CatalogueType.PARTY}>Party</SelectItem>
                                        <SelectItem value={E_CatalogueType.TRAVEL}>Travel </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </motion.div>

                        {/* Tag ID Field */}
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-purple-600 dark:text-purple-400">
                                    {t('tag-id')}
                                </label>
                                <Select
                                    value={watch('tagId')}
                                    onValueChange={value => setValue('tagId', value, { shouldValidate: true })}
                                >
                                    <SelectTrigger className="h-12 text-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                                        <SelectValue placeholder={tagsLoading ? t('loading-tags') : t('select-tag')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {tagsLoading
                                            ? (
                                                    <SelectItem value="loading" disabled>
                                                        <div className="flex items-center gap-2">
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                            {t('loading-tags')}
                                                        </div>
                                                    </SelectItem>
                                                )
                                            : tags.length === 0
                                                ? (
                                                        <SelectItem value="no-tags" disabled>
                                                            {t('no-tags-available')}
                                                        </SelectItem>
                                                    )
                                                : (
                                                        tags.map(tag => (
                                                            <SelectItem key={tag.id} value={tag.id || 'unknown'}>
                                                                {tag.name}
                                                            </SelectItem>
                                                        ))
                                                    )}
                                    </SelectContent>
                                </Select>
                                {errors.tagId && (
                                    <p className="text-sm text-red-500">{errors.tagId.message}</p>
                                )}
                            </div>
                        </motion.div>

                        {/* File Upload Field */}
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                                {t('upload-file')}
                            </label>
                            <div {...fileDropzone.getRootProps()} className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-800 cursor-pointer mb-2">
                                <input {...fileDropzone.getInputProps()} />
                                <span className="text-gray-500 dark:text-gray-400">
                                    {uploading ? t('uploading') : t('drag-drop-file')}
                                </span>
                            </div>
                            {(() => {
                                const previewUrl = uploadedUrl;
                                if (!previewUrl)
                                    return null;
                                const isImage = IMAGE_FILE_RE.test(previewUrl);
                                const isVideo = VIDEO_FILE_RE.test(previewUrl);
                                if (isImage) {
                                    return (
                                        <div className="mt-2">
                                            <img src={previewUrl} alt="Preview" className="h-20 w-20 object-cover rounded border" />
                                        </div>
                                    );
                                }
                                if (isVideo || (!isImage && !isVideo && !uploading)) {
                                    return (
                                        <div className="mt-2">
                                            <video src={previewUrl} className="h-20 w-20 object-cover rounded border" controls />
                                        </div>
                                    );
                                }
                                return (
                                    <div className="mt-2">
                                        <a href={previewUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-gray-500">
                                            {t('unknown-file-type')}
                                        </a>
                                    </div>
                                );
                            })()}
                        </motion.div>

                        {/* Action Buttons */}
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                            <Button type="button" variant="outline" onClick={_handleCancel} disabled={creating || updating} className="h-11 px-6 border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500">
                                {t('cancel')}
                            </Button>
                            <Button type="submit" disabled={creating || updating || !uploadedUrl} className="h-11 px-6 bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg hover:shadow-xl transition-all duration-200">
                                {creating || updating
                                    ? (
                                            <>
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                {t('saving')}
                                            </>
                                        )
                                    : (
                                            <>
                                                <Save className="h-4 w-4 mr-2" />
                                                {t('save')}
                                            </>
                                        )}
                            </Button>
                        </motion.div>
                    </form>
                </div>
            </DrawerContent>
        </Drawer>
    );
}
