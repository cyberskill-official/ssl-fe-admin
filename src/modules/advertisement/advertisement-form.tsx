import { Loader2, Save, X } from 'lucide-react';
import { motion } from 'motion/react';
import * as React from 'react';
import { useCallback, useImperativeHandle, useMemo, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useForm } from 'react-hook-form';

import type { Input_CreateAdvertisement, Input_UpdateAdvertisement, T_Advertisement } from '#shared/graphql';

import { Button, DatePicker, Drawer, DrawerContent, DrawerHeader, DrawerTitle, FloatLabel, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Switch, Textarea } from '#shared/component';
import { E_AdvertisementPlacementType, E_AdvertisementSlot, E_BlogType, E_DestinationType, E_UploadEntity, E_UploadType } from '#shared/graphql';
import { useKeyboardShortcuts } from '#shared/hooks';
import { useTranslate } from '#shared/i18n';
import { E_FormMode } from '#shared/typescript';

import type { I_AdvertisementFormRef } from './advertisement.type';

import { useGetBlogs } from '../blog/blog.hook';
import { useGetDestinations } from '../destination/destination.hook';
import { useUpload } from '../upload/upload.hook';

function parseYYYYMMDDToLocalDate(dateStr: string | null | undefined): Date | undefined {
    if (!dateStr)
        return undefined;

    if (dateStr.includes('T') || dateStr.includes(':')) {
        const parsed = new Date(dateStr);
        return Number.isNaN(parsed.getTime()) ? undefined : parsed;
    }

    const parts = dateStr.split('-').map(Number);
    if (parts.length < 3) {
        const parsed = new Date(dateStr);
        return Number.isNaN(parsed.getTime()) ? undefined : parsed;
    }

    const year = parts[0];
    const month = parts[1];
    const day = parts[2];

    if (year === undefined || month === undefined || day === undefined || Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day)) {
        return undefined;
    }

    return new Date(year, month - 1, day);
}

function parseYYYYMMDDToUTCDate(dateStr: string | null | undefined): Date | undefined {
    if (!dateStr)
        return undefined;

    if (dateStr.includes('T') || dateStr.includes(':')) {
        const parsed = new Date(dateStr);
        return Number.isNaN(parsed.getTime()) ? undefined : parsed;
    }

    const parts = dateStr.split('-').map(Number);
    if (parts.length < 3) {
        const parsed = new Date(dateStr);
        return Number.isNaN(parsed.getTime()) ? undefined : parsed;
    }

    const year = parts[0];
    const month = parts[1];
    const day = parts[2];

    if (year === undefined || month === undefined || day === undefined || Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day)) {
        return undefined;
    }

    return new Date(Date.UTC(year, month - 1, day));
}

function formatLocalYYYYMMDD(date: Date | null | undefined): string {
    if (!date || Number.isNaN(date.getTime()))
        return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function formatUTCYYYYMMDD(date: Date | null | undefined): string {
    if (!date || Number.isNaN(date.getTime()))
        return '';
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

export function AdvertisementForm({ ref, onCreateSubmit, onUpdateSubmit, creating, updating, existingAdvertisements }: {
    onCreateSubmit: (data: Input_CreateAdvertisement) => void;
    onUpdateSubmit: (id: string, data: Input_UpdateAdvertisement) => void;
    creating?: boolean;
    updating?: boolean;
    existingAdvertisements?: T_Advertisement[];
    ref?: React.RefObject<I_AdvertisementFormRef | null>;
}) {
    const { t } = useTranslate('advertisement');
    const [isOpen, setIsOpen] = useState(false);
    const [mode, setMode] = useState<E_FormMode>(E_FormMode.Create);
    const [currentAdvertisement, setCurrentAdvertisement] = useState<T_Advertisement>();
    const FORM_DEFAULT_VALUES: Input_CreateAdvertisement = {
        name: '',
        description: '',
        targetURL: '',
        isActive: true,
        image: '',
        slot: undefined,
        placementType: E_AdvertisementPlacementType.DASHBOARD,
        placementId: '',
        startDate: undefined,
        endDate: undefined,
    };
    const {
        register,
        handleSubmit,
        reset,
        watch,
        setValue,
        trigger,
        formState: { errors },
    } = useForm({
        defaultValues: FORM_DEFAULT_VALUES,
        mode: 'onChange',
    });
    const [images, setImages] = useState<string[]>([]);
    const [uploading, setUploading] = useState(false);
    const [imageError, setImageError] = useState<string | null>(null);
    const { upload } = useUpload();

    const selectedIsActive = watch('isActive');
    const selectedStartDate = watch('startDate');
    const selectedPlacementType = watch('placementType');

    const { blogs } = useGetBlogs({}, { page: 1, limit: 1000 });
    const { destinations } = useGetDestinations({}, { page: 1, limit: 1000 });

    const filteredBlogs = useMemo(() => {
        if (selectedPlacementType === E_AdvertisementPlacementType.BLOG) {
            return blogs.filter(b => b.type === E_BlogType.BLOG);
        }
        if (selectedPlacementType === E_AdvertisementPlacementType.PODCAST) {
            return blogs.filter(b => b.type === E_BlogType.PODCAST);
        }
        return [];
    }, [blogs, selectedPlacementType]);

    const filteredDestinations = useMemo(() => {
        if (selectedPlacementType === E_AdvertisementPlacementType.CLUB) {
            return destinations.filter(d => d.type === E_DestinationType.CLUB);
        }
        if (selectedPlacementType === E_AdvertisementPlacementType.RESORT) {
            return destinations.filter(d => d.type === E_DestinationType.RESORT);
        }
        return [];
    }, [destinations, selectedPlacementType]);

    const showBlogSelect = selectedPlacementType === E_AdvertisementPlacementType.BLOG || selectedPlacementType === E_AdvertisementPlacementType.PODCAST;
    const showDestinationSelect = selectedPlacementType === E_AdvertisementPlacementType.CLUB || selectedPlacementType === E_AdvertisementPlacementType.RESORT;
    const showSlotSelect = selectedPlacementType === E_AdvertisementPlacementType.DASHBOARD;

    const _validateSlotUniqueness = (slot: E_AdvertisementSlot | undefined | null) => {
        if (selectedPlacementType !== E_AdvertisementPlacementType.DASHBOARD) {
            return true;
        }
        if (!slot) {
            return t('slot-required') || 'Slot is required';
        }

        const isSlotTaken = existingAdvertisements?.some(ad =>
            ad.slot === slot && ad.placementType === E_AdvertisementPlacementType.DASHBOARD && ad.id !== currentAdvertisement?.id,
        );

        if (isSlotTaken) {
            return t('slot-already-taken') || 'This slot is already taken by another advertisement';
        }

        return true;
    };

    const _validateDateRange = (endDate: string | undefined) => {
        if (!endDate || !selectedStartDate) {
            return true;
        }

        const start = parseYYYYMMDDToLocalDate(selectedStartDate);
        const end = parseYYYYMMDDToLocalDate(endDate);

        if (!start || !end) {
            return true;
        }

        return end >= start || t('end-date-before-start') || 'End date cannot be before start date';
    };

    useImperativeHandle(ref, () => ({
        open: (advertisement?: T_Advertisement) => {
            setCurrentAdvertisement(advertisement);
            setMode(advertisement && advertisement.id ? E_FormMode.Update : E_FormMode.Create);
            setIsOpen(true);
            setImages(
                Array.isArray(advertisement?.image)
                    ? advertisement.image
                    : advertisement?.image
                        ? [advertisement.image]
                        : [],
            );
            reset(advertisement
                ? {
                        name: advertisement.name ?? '',
                        description: advertisement.description ?? '',
                        targetURL: advertisement.targetURL ?? '',
                        isActive: advertisement.isActive ?? true,
                        slot: advertisement.slot ?? undefined,
                        placementType: advertisement.placementType ?? E_AdvertisementPlacementType.DASHBOARD,
                        placementId: advertisement.placementId ?? '',
                        startDate: advertisement.startDate ? formatUTCYYYYMMDD(new Date(advertisement.startDate)) : undefined,
                        endDate: advertisement.endDate ? formatUTCYYYYMMDD(new Date(advertisement.endDate)) : undefined,
                    }
                : FORM_DEFAULT_VALUES);
        },
        close: () => {
            setIsOpen(false);
            setCurrentAdvertisement(undefined);
            setImages([]);
            reset(FORM_DEFAULT_VALUES);
        },
    }));

    const _handleCancel = useCallback(() => {
        setIsOpen(false);
        setCurrentAdvertisement(undefined);
    }, []);

    const handleFileUpload = async (file: File) => {
        setUploading(true);
        try {
            const url = await upload({ file, type: E_UploadType.IMAGE, entity: E_UploadEntity.USER });
            return url;
        }
        finally {
            setUploading(false);
        }
    };

    const imagesDropzone = useDropzone({
        accept: { 'image/*': ['.jpeg', '.jpg', '.png'] },
        maxFiles: 10,
        onDrop: async (acceptedFiles) => {
            const newUrls = await Promise.all(acceptedFiles.map(file => handleFileUpload(file)));
            const validUrls = newUrls.filter((url: unknown): url is string => typeof url === 'string' && url !== '');
            setImages(prev => [...prev, ...validUrls].slice(0, 10));
        },
    });

    const handleRemoveImage = (url: string) => {
        setImages(prev => prev.filter(img => img !== url));
    };

    const _handleSubmit = (data: Input_CreateAdvertisement) => {
        const hasImages = images.length > 0 || (mode === E_FormMode.Update && currentAdvertisement?.image);

        if (!hasImages) {
            setImageError(t('advertisement-image-required') || 'Please upload at least one image.');
            return;
        }
        setImageError(null);

        const placementId = data.placementType === E_AdvertisementPlacementType.DASHBOARD
            ? 'DASHBOARD'
            : data.placementId;

        const formData: Input_CreateAdvertisement = {
            ...data,
            image: images[0] || currentAdvertisement?.image || '',
            slot: data.placementType === E_AdvertisementPlacementType.DASHBOARD ? data.slot as E_AdvertisementSlot : undefined,
            placementType: data.placementType as E_AdvertisementPlacementType,
            placementId: placementId || '',
            startDate: data.startDate ? parseYYYYMMDDToUTCDate(data.startDate) : undefined,
            endDate: data.endDate ? parseYYYYMMDDToUTCDate(data.endDate) : undefined,
        };

        if (mode === E_FormMode.Update && currentAdvertisement?.id) {
            onUpdateSubmit(currentAdvertisement.id, formData);
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
                                <span className="h-6 w-6 text-white font-bold">Ad</span>
                            </div>
                            <div>
                                <DrawerTitle className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                                    {mode === E_FormMode.Create ? t('add-new-advertisement') : t('edit-advertisement')}
                                </DrawerTitle>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                    {mode === E_FormMode.Create ? t('add-new-advertisement') : t('edit-advertisement')}
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
                        {/* Placement Type Field */}
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-purple-600 dark:text-purple-400">
                                    {t('placement-type')}
                                </label>
                                <Select
                                    value={watch('placementType') as E_AdvertisementPlacementType | undefined}
                                    onValueChange={(value) => {
                                        setValue('placementType', value as E_AdvertisementPlacementType);
                                        setValue('placementId', '');
                                        setValue('slot', undefined);
                                        trigger('placementType');
                                    }}
                                >
                                    <SelectTrigger className={`h-12 text-lg ${errors.placementType ? 'border-red-500' : 'border-gray-300'} bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100`}>
                                        <SelectValue placeholder={t('select-placement-type')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={E_AdvertisementPlacementType.DASHBOARD}>{t('placement-dashboard')}</SelectItem>
                                        <SelectItem value={E_AdvertisementPlacementType.CLUB}>{t('placement-club')}</SelectItem>
                                        <SelectItem value={E_AdvertisementPlacementType.RESORT}>{t('placement-resort')}</SelectItem>
                                        <SelectItem value={E_AdvertisementPlacementType.BLOG}>{t('placement-blog')}</SelectItem>
                                        <SelectItem value={E_AdvertisementPlacementType.PODCAST}>{t('placement-podcast')}</SelectItem>
                                    </SelectContent>
                                </Select>
                                <input {...register('placementType', { required: t('placement-type-required') || 'Placement type is required' })} type="hidden" />
                                {errors.placementType?.message && (
                                    <p className="text-xs text-red-500 mt-1">{errors.placementType.message}</p>
                                )}
                            </div>
                        </motion.div>
                        {/* Slot Field - only for DASHBOARD */}
                        {showSlotSelect && (
                            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-purple-600 dark:text-purple-400">
                                        {t('slot')}
                                    </label>
                                    <Select
                                        value={watch('slot') as E_AdvertisementSlot | undefined}
                                        onValueChange={(value) => {
                                            setValue('slot', value as E_AdvertisementSlot);
                                            trigger('slot');
                                        }}
                                        required
                                    >
                                        <SelectTrigger className={`h-12 text-lg ${errors.slot ? 'border-red-500' : 'border-gray-300'} bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100`} aria-invalid={!!errors.slot}>
                                            <SelectValue placeholder={t('all-slots')} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value={E_AdvertisementSlot.SLOT_1}>{t('slot-1')}</SelectItem>
                                            <SelectItem value={E_AdvertisementSlot.SLOT_2}>{t('slot-2')}</SelectItem>
                                            <SelectItem value={E_AdvertisementSlot.SLOT_3}>{t('slot-3')}</SelectItem>
                                            <SelectItem value={E_AdvertisementSlot.SLOT_4}>{t('slot-4')}</SelectItem>
                                            <SelectItem value={E_AdvertisementSlot.SLOT_5}>{t('slot-5')}</SelectItem>
                                            <SelectItem value={E_AdvertisementSlot.SLOT_6}>{t('slot-6')}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <input
                                        {...register('slot', {
                                            validate: _validateSlotUniqueness,
                                        })}
                                        type="hidden"
                                    />
                                    {errors.slot?.message && (
                                        <p className="text-xs text-red-500 mt-1">{errors.slot.message}</p>
                                    )}
                                </div>
                            </motion.div>
                        )}
                        {/* Destination Select - for CLUB/RESORT */}
                        {showDestinationSelect && (
                            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-purple-600 dark:text-purple-400">
                                        {selectedPlacementType === E_AdvertisementPlacementType.CLUB ? t('select-club') : t('select-resort')}
                                    </label>
                                    <Select
                                        value={watch('placementId') || undefined}
                                        onValueChange={(value) => {
                                            setValue('placementId', value);
                                            trigger('placementId');
                                        }}
                                    >
                                        <SelectTrigger className={`h-12 text-lg ${errors.placementId ? 'border-red-500' : 'border-gray-300'} bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100`}>
                                            <SelectValue placeholder={selectedPlacementType === E_AdvertisementPlacementType.CLUB ? t('select-club') : t('select-resort')} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {filteredDestinations.map(dest => (
                                                <SelectItem key={dest.id} value={dest.id!}>{dest.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <input {...register('placementId', { required: t('placement-id-required') || 'Please select a destination' })} type="hidden" />
                                    {errors.placementId?.message && (
                                        <p className="text-xs text-red-500 mt-1">{errors.placementId.message}</p>
                                    )}
                                </div>
                            </motion.div>
                        )}
                        {/* Blog Select - for BLOG/PODCAST */}
                        {showBlogSelect && (
                            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-purple-600 dark:text-purple-400">
                                        {selectedPlacementType === E_AdvertisementPlacementType.BLOG ? t('select-blog') : t('select-podcast')}
                                    </label>
                                    <Select
                                        value={watch('placementId') || undefined}
                                        onValueChange={(value) => {
                                            setValue('placementId', value);
                                            trigger('placementId');
                                        }}
                                    >
                                        <SelectTrigger className={`h-12 text-lg ${errors.placementId ? 'border-red-500' : 'border-gray-300'} bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100`}>
                                            <SelectValue placeholder={selectedPlacementType === E_AdvertisementPlacementType.BLOG ? t('select-blog') : t('select-podcast')} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {filteredBlogs.map(blog => (
                                                <SelectItem key={blog.id} value={blog.id!}>{blog.title}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <input {...register('placementId', { required: t('placement-id-required') || 'Please select a blog/podcast' })} type="hidden" />
                                    {errors.placementId?.message && (
                                        <p className="text-xs text-red-500 mt-1">{errors.placementId.message}</p>
                                    )}
                                </div>
                            </motion.div>
                        )}
                        {/* Name Field */}
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
                            <FloatLabel label={t('ad-name')} error={errors.name?.message}>
                                <Input
                                    {...register('name', {
                                        required: t('advertisement-name-required'),
                                    })}
                                    className={`h-12 text-lg ${errors.name ? 'border-red-500' : 'border-gray-300'} bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100`}
                                    aria-invalid={!!errors.name}
                                    aria-required="true"
                                    placeholder="Enter advertisement name..."
                                />
                            </FloatLabel>
                        </motion.div>
                        {/* Description Field */}
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.22 }}>
                            <FloatLabel label={t('description')}>
                                <Textarea
                                    {...register('description')}
                                    className="min-h-[80px] text-base bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300"
                                    placeholder="Enter advertisement description..."
                                />
                            </FloatLabel>
                        </motion.div>
                        {/* Target URL Field */}
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
                            <FloatLabel label={t('target-url')} error={errors.targetURL?.message}>
                                <Input
                                    {...register('targetURL', {
                                        required: t('advertisement-target-url-required'),
                                        minLength: { value: 2, message: t('advertisement-target-url-min-length') },
                                        maxLength: { value: 500, message: t('advertisement-target-url-max-length') },
                                        validate: (value) => {
                                            try {
                                                void new URL(value);
                                                return true;
                                            }
                                            catch {
                                                return t('invalid-url-format') || 'Invalid URL format';
                                            }
                                        },
                                    })}
                                    className={`h-12 text-lg ${errors.targetURL ? 'border-red-500' : 'border-gray-300'} bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100`}
                                    aria-invalid={!!errors.targetURL}
                                    aria-required="true"
                                    placeholder="Enter advertisement target URL..."
                                />
                            </FloatLabel>
                        </motion.div>
                        {/* Images Upload Field */}
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }}>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">{t('advertisement-image')}</label>
                            <div {...imagesDropzone.getRootProps()} className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-800 cursor-pointer mb-2">
                                <input {...imagesDropzone.getInputProps()} />
                                <span className="text-gray-500 dark:text-gray-400">{t('upload-image')}</span>
                            </div>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {images.map((img, idx) => (
                                    <div key={img} className="relative group">
                                        <img src={img} alt={`Ad image ${idx + 1}`} className="h-20 w-20 object-cover rounded border" />
                                        <button type="button" onClick={() => handleRemoveImage(img)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-80 group-hover:opacity-100">
                                            <X size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                            {imageError && (
                                <div className="text-xs text-red-500 mt-1">{imageError}</div>
                            )}
                            {uploading && (
                                <div className="text-xs text-gray-500 mt-1">
                                    {t('uploading')}
                                    ...
                                </div>
                            )}
                        </motion.div>
                        {/* Start Date Field */}
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.18 }}>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-purple-600 dark:text-purple-400">
                                    {t('start-date')}
                                </label>
                                <DatePicker
                                    label=""
                                    value={parseYYYYMMDDToLocalDate(watch('startDate'))}
                                    minDate={new Date()}
                                    onChange={(date) => {
                                        setValue('startDate', date instanceof Date ? formatLocalYYYYMMDD(date) : '');
                                        trigger('startDate');
                                    }}
                                />
                                {typeof errors.startDate?.message === 'string' && (
                                    <p className="text-xs text-red-500">{errors.startDate.message}</p>
                                )}
                            </div>
                        </motion.div>
                        {/* End Date Field */}
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.21 }}>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-purple-600 dark:text-purple-400">
                                    {t('end-date')}
                                </label>
                                <DatePicker
                                    label=""
                                    value={parseYYYYMMDDToLocalDate(watch('endDate'))}
                                    minDate={parseYYYYMMDDToLocalDate(selectedStartDate) ?? new Date()}
                                    onChange={(date) => {
                                        setValue('endDate', date instanceof Date ? formatLocalYYYYMMDD(date) : '');
                                        trigger('endDate');
                                    }}
                                />
                                <input
                                    {...register('endDate', {
                                        validate: _validateDateRange,
                                    })}
                                    type="hidden"
                                />
                                {typeof errors.endDate?.message === 'string' && (
                                    <p className="text-xs text-red-500">{errors.endDate.message}</p>
                                )}
                            </div>
                        </motion.div>
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
                            <FloatLabel label={t('status')}>
                                <div className="flex items-center justify-between p-4 rounded-lg border bg-gray-50 dark:bg-gray-800 h-12">
                                    <div className="flex items-center gap-3">
                                        <Switch
                                            checked={selectedIsActive ?? true}
                                            onCheckedChange={(checked) => {
                                                setValue('isActive', checked);
                                                trigger('isActive');
                                            }}
                                        />
                                        <div>
                                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                {selectedIsActive ? t('active') : t('inactive')}
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                {selectedIsActive
                                                    ? t('advertisement-active-description')
                                                    : t('advertisement-inactive-description')}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </FloatLabel>
                        </motion.div>
                        {/* Action Buttons */}
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                            <Button type="button" variant="outline" onClick={_handleCancel} disabled={creating || updating} className="h-11 px-6 border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500">
                                {t('cancel')}
                            </Button>
                            <Button type="submit" disabled={creating || updating} className="h-11 px-6 bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg hover:shadow-xl transition-all duration-200">
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
