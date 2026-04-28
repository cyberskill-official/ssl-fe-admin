import {
    Cigarette,
    Coffee,
    Eye,
    Flame,
    Heart,
    Loader2,
    MapPin,
    Palette,
    Ruler,
    Save,
    Shield,
    Palette as SkinToneIcon,
    Sparkles,
    Star,
    Tag as TagIcon,
    Target,
    Users,
    X,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useCallback, useImperativeHandle, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';

import type { Input_CreateTag, Input_UpdateTag, T_Tag } from '#shared/graphql';

import { Button, Drawer, DrawerContent, DrawerHeader, DrawerTitle, FloatLabel, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '#shared/component';
import { E_TagType } from '#shared/graphql';
import { useKeyboardShortcuts } from '#shared/hooks';
import { useTranslate } from '#shared/i18n';
import { E_FormMode } from '#shared/typescript';

import type { I_TagFormData, I_TagFormProps, I_TagFormRef } from './tag.type';

const tagTypeIcons = {
    BODY_TYPE: <Users className="h-5 w-5" />,
    CATALOGUE: <TagIcon className="h-5 w-5" />,
    EYE_COLOR: <Eye className="h-5 w-5" />,
    HAIR_COLOR: <Palette className="h-5 w-5" />,
    HEIGHT: <Ruler className="h-5 w-5" />,
    LOOKING_FOR: <Target className="h-5 w-5" />,
    PREFERRED_DRINKS: <Coffee className="h-5 w-5" />,
    PROFILE_PURPOSE: <Star className="h-5 w-5" />,
    RELATIONSHIP_STATUS: <Heart className="h-5 w-5" />,
    RULES_OF_ENGAGEMENT: <Shield className="h-5 w-5" />,
    SEXUAL_ORIENTATION: <Flame className="h-5 w-5" />,
    SEXUAL_PREFERENCES: <Sparkles className="h-5 w-5" />,
    ETHNICITY: <SkinToneIcon className="h-5 w-5" />,
    SMOKING_HABITS: <Cigarette className="h-5 w-5" />,
    WILLINGNESS_TO_GO: <MapPin className="h-5 w-5" />,
};

const tagTypeColors = {
    BODY_TYPE: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800',
    CATALOGUE: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800',
    EYE_COLOR: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800',
    HAIR_COLOR: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800',
    HEIGHT: 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-300 dark:border-indigo-800',
    LOOKING_FOR: 'bg-pink-100 text-pink-800 border-pink-200 dark:bg-pink-900/20 dark:text-pink-300 dark:border-pink-800',
    PREFERRED_DRINKS: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800',
    PROFILE_PURPOSE: 'bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-900/20 dark:text-teal-300 dark:border-teal-800',
    RELATIONSHIP_STATUS: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800',
    RULES_OF_ENGAGEMENT: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800',
    SEXUAL_ORIENTATION: 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900/20 dark:text-rose-300 dark:border-rose-800',
    SEXUAL_PREFERENCES: 'bg-violet-100 text-violet-800 border-violet-200 dark:bg-violet-900/20 dark:text-violet-300 dark:border-violet-800',
    ETHNICITY: 'bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-900/20 dark:text-cyan-300 dark:border-cyan-800',
    SMOKING_HABITS: 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-900/20 dark:text-slate-300 dark:border-slate-800',
    WILLINGNESS_TO_GO: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800',
};

export function TagForm({ ref, onCreateSubmit, onUpdateSubmit, creating, updating }: Omit<I_TagFormProps, 'tag' | 'mode' | 'onSubmit'> & {
    onCreateSubmit: (data: Input_CreateTag) => void;
    onUpdateSubmit: (id: string, data: Input_UpdateTag) => void;
    creating?: boolean;
    updating?: boolean;
} & { ref?: React.RefObject<I_TagFormRef | null> }) {
    const { t } = useTranslate('tag');
    const [isOpen, setIsOpen] = useState(false);
    const [mode, setMode] = useState<E_FormMode>(E_FormMode.Create);
    const [currentTag, setCurrentTag] = useState<T_Tag>();
    const FORM_DEFAULT_VALUES = {
        name: '',
        type: E_TagType.BODY_TYPE,
    };
    const {
        register,
        handleSubmit,
        reset,
        watch,
        setValue,
        trigger,
        formState: { errors },
    } = useForm<I_TagFormData>({
        defaultValues: FORM_DEFAULT_VALUES,
    });

    useImperativeHandle(ref, () => ({
        open: (tag?: T_Tag) => {
            setCurrentTag(tag);
            setMode(tag ? E_FormMode.Update : E_FormMode.Create);
            setIsOpen(true);

            reset(tag
                ? {
                        name: tag.name ?? '',
                        type: tag.type ?? E_TagType.BODY_TYPE,
                    }
                : FORM_DEFAULT_VALUES);
        },
        close: () => {
            setIsOpen(false);
            setCurrentTag(undefined);
            reset(FORM_DEFAULT_VALUES);
        },
    }));

    const _handleCancel = useCallback(() => {
        setIsOpen(false);
        setCurrentTag(undefined);
    }, []);

    const _handleSubmit = (data: I_TagFormData) => {
        const formData = {
            name: data.name,
            type: data.type,
        };

        if (mode === E_FormMode.Update && currentTag?.id) {
            onUpdateSubmit(currentTag.id, formData);
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

    const tagTypeOptions = useMemo(() => [
        { value: E_TagType.BODY_TYPE, label: t('body-type'), icon: tagTypeIcons.BODY_TYPE, color: tagTypeColors.BODY_TYPE },
        { value: E_TagType.CATALOGUE, label: t('catalogue'), icon: tagTypeIcons.CATALOGUE, color: tagTypeColors.CATALOGUE },
        { value: E_TagType.EYE_COLOR, label: t('eye-color'), icon: tagTypeIcons.EYE_COLOR, color: tagTypeColors.EYE_COLOR },
        { value: E_TagType.HAIR_COLOR, label: t('hair-color'), icon: tagTypeIcons.HAIR_COLOR, color: tagTypeColors.HAIR_COLOR },
        { value: E_TagType.HEIGHT, label: t('height'), icon: tagTypeIcons.HEIGHT, color: tagTypeColors.HEIGHT },
        { value: E_TagType.LOOKING_FOR, label: t('looking-for'), icon: tagTypeIcons.LOOKING_FOR, color: tagTypeColors.LOOKING_FOR },
        { value: E_TagType.PREFERRED_DRINKS, label: t('preferred-drinks'), icon: tagTypeIcons.PREFERRED_DRINKS, color: tagTypeColors.PREFERRED_DRINKS },
        { value: E_TagType.PROFILE_PURPOSE, label: t('profile-purpose'), icon: tagTypeIcons.PROFILE_PURPOSE, color: tagTypeColors.PROFILE_PURPOSE },
        { value: E_TagType.RELATIONSHIP_STATUS, label: t('relationship-status'), icon: tagTypeIcons.RELATIONSHIP_STATUS, color: tagTypeColors.RELATIONSHIP_STATUS },
        { value: E_TagType.RULES_OF_ENGAGEMENT, label: t('rules-of-engagement'), icon: tagTypeIcons.RULES_OF_ENGAGEMENT, color: tagTypeColors.RULES_OF_ENGAGEMENT },
        { value: E_TagType.SEXUAL_ORIENTATION, label: t('sexual-orientation'), icon: tagTypeIcons.SEXUAL_ORIENTATION, color: tagTypeColors.SEXUAL_ORIENTATION },
        { value: E_TagType.SEXUAL_PREFERENCES, label: t('sexual-preferences'), icon: tagTypeIcons.SEXUAL_PREFERENCES, color: tagTypeColors.SEXUAL_PREFERENCES },
        { value: E_TagType.ETHNICITY, label: 'Ethnicity', icon: tagTypeIcons.ETHNICITY, color: tagTypeColors.ETHNICITY },
        { value: E_TagType.SMOKING_HABITS, label: t('smoking-habits'), icon: tagTypeIcons.SMOKING_HABITS, color: tagTypeColors.SMOKING_HABITS },
        { value: E_TagType.WILLINGNESS_TO_GO, label: t('willingness-to-go'), icon: tagTypeIcons.WILLINGNESS_TO_GO, color: tagTypeColors.WILLINGNESS_TO_GO },
    ], [t]);

    const selectedType = watch('type');

    return (
        <Drawer open={isOpen} onOpenChange={_handleCancel} direction="right">
            <DrawerContent className="max-w-md">
                <DrawerHeader className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/50 dark:to-blue-950/50 border-b border-purple-100 dark:border-purple-800">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg">
                                <TagIcon className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <DrawerTitle className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                                    {mode === E_FormMode.Create ? t('create-tag') : t('edit-tag')}
                                </DrawerTitle>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                    {mode === E_FormMode.Create ? t('create-tag-description') : t('edit-tag-description')}
                                </p>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={_handleCancel}
                            className="h-8 w-8 p-0 hover:bg-white/50 dark:hover:bg-gray-800/50"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </DrawerHeader>

                <form onSubmit={handleSubmit(_handleSubmit)} className="p-6 flex flex-col gap-6">
                    {/* Tag Name Field */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        <FloatLabel
                            label={t('tag-name')}
                            error={errors.name?.message}
                        >
                            <Input
                                {...register('name', {
                                    required: t('tag-name-required'),
                                    minLength: {
                                        value: 2,
                                        message: t('tag-name-min-length'),
                                    },
                                    maxLength: {
                                        value: 50,
                                        message: t('tag-name-max-length'),
                                    },
                                })}
                                className={`h-12 text-lg ${errors.name ? 'border-red-500 focus:border-red-500 focus:ring-red-500 dark:border-red-400 dark:focus:border-red-400 dark:focus:ring-red-400' : 'border-gray-300 dark:border-gray-600 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-purple-500 dark:focus:ring-purple-400'} bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100`}
                                aria-invalid={!!errors.name}
                                aria-required="true"
                                placeholder="Enter tag name..."
                            />
                        </FloatLabel>
                    </motion.div>

                    {/* Tag Type Field */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <FloatLabel
                            label={t('tag-type')}
                            error={errors.type?.message}
                        >
                            <Select
                                {...register('type')}
                                value={selectedType}
                                onValueChange={(value) => {
                                    setValue('type', value as E_TagType);
                                    trigger('type');
                                }}
                            >
                                <SelectTrigger
                                    className={`h-12 text-lg ${errors.type ? 'border-red-500 focus:border-red-500 focus:ring-red-500 dark:border-red-400 dark:focus:border-red-400 dark:focus:ring-red-400' : 'border-gray-300 dark:border-gray-600 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-purple-500 dark:focus:ring-purple-400'} bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100`}
                                    aria-invalid={!!errors.type}
                                >
                                    <SelectValue placeholder=" " />
                                </SelectTrigger>
                                <SelectContent className="max-h-96 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                                    {tagTypeOptions.map(option => (
                                        <SelectItem
                                            key={option.value}
                                            value={option.value}
                                            className="flex items-center gap-3 py-3 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700"
                                        >
                                            <div className={`p-1 rounded ${option.color}`}>
                                                {option.icon}
                                            </div>
                                            <span>{option.label}</span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </FloatLabel>
                    </motion.div>

                    {/* Action Buttons */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700"
                    >
                        <Button
                            type="button"
                            variant="outline"
                            onClick={_handleCancel}
                            disabled={creating || updating}
                            className="h-11 px-6 border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
                        >
                            {t('cancel')}
                        </Button>
                        <Button
                            type="submit"
                            disabled={creating || updating}
                            className="h-11 px-6 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                        >
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
            </DrawerContent>
        </Drawer>
    );
}
