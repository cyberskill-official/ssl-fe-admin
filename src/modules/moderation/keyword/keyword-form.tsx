import { AlertCircle, Loader2, Save, Shield, X } from 'lucide-react';
import { motion } from 'motion/react';
import { useCallback, useImperativeHandle, useState } from 'react';
import { useForm } from 'react-hook-form';

import type { Input_CreateKeyword, Input_UpdateKeyword, T_Keyword } from '#shared/graphql';

import { Button, Drawer, DrawerContent, DrawerHeader, DrawerTitle, FloatLabel, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Switch } from '#shared/component';
import { E_KeywordCategory } from '#shared/graphql';
import { useKeyboardShortcuts } from '#shared/hooks';
import { useTranslate } from '#shared/i18n';
import { E_FormMode } from '#shared/typescript';

import type { I_KeywordFormData, I_KeywordFormProps, I_KeywordFormRef } from './keyword.type';

const categoryIcons = {
    [E_KeywordCategory.INAPPROPRIATE]: <AlertCircle className="h-5 w-5" />,
    [E_KeywordCategory.SPAM]: <AlertCircle className="h-5 w-5" />,
    [E_KeywordCategory.OFFENSIVE]: <AlertCircle className="h-5 w-5" />,
    [E_KeywordCategory.CUSTOM]: <Shield className="h-5 w-5" />,
};

const categoryColors = {
    [E_KeywordCategory.INAPPROPRIATE]: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800',
    [E_KeywordCategory.SPAM]: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800',
    [E_KeywordCategory.OFFENSIVE]: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800',
    [E_KeywordCategory.CUSTOM]: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800',
};

export function KeywordForm({ ref, onCreateSubmit, onUpdateSubmit, creating, updating }: Omit<I_KeywordFormProps, 'keyword' | 'mode' | 'onSubmit'> & {
    onCreateSubmit: (data: Input_CreateKeyword) => void;
    onUpdateSubmit: (id: string, data: Input_UpdateKeyword) => void;
    creating?: boolean;
    updating?: boolean;
} & { ref?: React.RefObject<I_KeywordFormRef | null> }) {
    const { t } = useTranslate('moderation');
    const [isOpen, setIsOpen] = useState(false);
    const [mode, setMode] = useState<E_FormMode>(E_FormMode.Create);
    const [currentKeyword, setCurrentKeyword] = useState<T_Keyword>();

    const FORM_DEFAULT_VALUES = {
        word: '',
        category: E_KeywordCategory.CUSTOM,
        isActive: true,
    };

    const {
        register,
        handleSubmit,
        reset,
        watch,
        setValue,
        trigger,
        formState: { errors },
    } = useForm<I_KeywordFormData>({
        defaultValues: FORM_DEFAULT_VALUES,
    });

    useImperativeHandle(ref, () => ({
        open: (keyword?: T_Keyword) => {
            setCurrentKeyword(keyword);
            setMode(keyword ? E_FormMode.Update : E_FormMode.Create);
            setIsOpen(true);

            reset(keyword
                ? {
                        word: keyword.word ?? '',
                        category: keyword.category ?? E_KeywordCategory.CUSTOM,
                        isActive: keyword.isActive ?? true,
                    }
                : FORM_DEFAULT_VALUES);
        },
        close: () => {
            setIsOpen(false);
            setCurrentKeyword(undefined);
            reset(FORM_DEFAULT_VALUES);
        },
    }));

    const _handleCancel = useCallback(() => {
        setIsOpen(false);
        setCurrentKeyword(undefined);
    }, []);

    const _handleSubmit = (data: I_KeywordFormData) => {
        const formData = {
            word: data.word.toLowerCase().trim(),
            category: data.category,
            isActive: data.isActive,
        };

        if (mode === E_FormMode.Update && currentKeyword?.id) {
            onUpdateSubmit(currentKeyword.id, formData);
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

    const categoryOptions = [
        { value: E_KeywordCategory.INAPPROPRIATE, label: t('keyword.category-inappropriate'), icon: categoryIcons[E_KeywordCategory.INAPPROPRIATE], color: categoryColors[E_KeywordCategory.INAPPROPRIATE] },
        { value: E_KeywordCategory.SPAM, label: t('keyword.category-spam'), icon: categoryIcons[E_KeywordCategory.SPAM], color: categoryColors[E_KeywordCategory.SPAM] },
        { value: E_KeywordCategory.OFFENSIVE, label: t('keyword.category-offensive'), icon: categoryIcons[E_KeywordCategory.OFFENSIVE], color: categoryColors[E_KeywordCategory.OFFENSIVE] },
        { value: E_KeywordCategory.CUSTOM, label: t('keyword.category-custom'), icon: categoryIcons[E_KeywordCategory.CUSTOM], color: categoryColors[E_KeywordCategory.CUSTOM] },
    ];

    const selectedCategory = watch('category');
    const selectedIsActive = watch('isActive');

    return (
        <Drawer open={isOpen} onOpenChange={_handleCancel} direction="right">
            <DrawerContent className="max-w-md">
                <DrawerHeader className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/50 dark:to-blue-950/50 border-b border-purple-100 dark:border-purple-800">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg">
                                <Shield className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <DrawerTitle className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                                    {mode === E_FormMode.Create ? t('keyword.add-keyword') : t('keyword.edit-keyword')}
                                </DrawerTitle>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                    {mode === E_FormMode.Create ? t('keyword.add-keyword-description') : t('keyword.edit-keyword-description')}
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
                    {/* Keyword Word Field */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        <FloatLabel
                            label={t('keyword.keyword-label')}
                            error={errors.word?.message}
                        >
                            <Input
                                {...register('word', {
                                    required: t('keyword.keyword-required'),
                                    minLength: {
                                        value: 2,
                                        message: t('keyword.keyword-min-length'),
                                    },
                                    maxLength: {
                                        value: 50,
                                        message: t('keyword.keyword-max-length'),
                                    },
                                })}
                                className={`h-12 text-lg font-mono ${errors.word ? 'border-red-500 focus:border-red-500 focus:ring-red-500 dark:border-red-400 dark:focus:border-red-400 dark:focus:ring-red-400' : 'border-gray-300 dark:border-gray-600 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-purple-500 dark:focus:ring-purple-400'} bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100`}
                                aria-invalid={!!errors.word}
                                aria-required="true"
                                placeholder="Enter keyword..."
                            />
                        </FloatLabel>
                        <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1">
                            <AlertCircle className="w-3 h-3" />
                            {t('keyword.keyword-hint')}
                        </p>
                    </motion.div>

                    {/* Category Field */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <FloatLabel
                            label={t('keyword.category-label')}
                            error={errors.category?.message}
                        >
                            <Select
                                {...register('category')}
                                value={selectedCategory}
                                onValueChange={(value) => {
                                    setValue('category', value as E_KeywordCategory);
                                    trigger('category');
                                }}
                            >
                                <SelectTrigger
                                    className={`h-12 text-lg ${errors.category ? 'border-red-500 focus:border-red-500 focus:ring-red-500 dark:border-red-400 dark:focus:border-red-400 dark:focus:ring-red-400' : 'border-gray-300 dark:border-gray-600 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-purple-500 dark:focus:ring-purple-400'} bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100`}
                                    aria-invalid={!!errors.category}
                                >
                                    <SelectValue placeholder=" " />
                                </SelectTrigger>
                                <SelectContent className="max-h-96 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                                    {categoryOptions.map(option => (
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
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {t('keyword.category-hint')}
                        </p>
                    </motion.div>

                    {/* Status Toggle */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        <FloatLabel
                            label={t('keyword.status')}
                        >
                            <div className="flex items-center justify-between p-4 rounded-lg border bg-gray-50 dark:bg-gray-800 h-12">
                                <div className="flex items-center gap-3">
                                    <Switch
                                        {...register('isActive')}
                                        checked={selectedIsActive}
                                        onCheckedChange={(checked) => {
                                            setValue('isActive', checked);
                                            trigger('isActive');
                                        }}
                                    />
                                    <div>
                                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                            {selectedIsActive ? t('keyword.status-active') : t('keyword.status-inactive')}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            {selectedIsActive
                                                ? t('keyword.status-active-description')
                                                : t('keyword.status-inactive-description')}
                                        </p>
                                    </div>
                                </div>
                            </div>
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
                            {t('keyword.cancel')}
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
                                            {t('keyword.saving')}
                                        </>
                                    )
                                : (
                                        <>
                                            <Save className="h-4 w-4 mr-2" />
                                            {t('keyword.save')}
                                        </>
                                    )}
                        </Button>
                    </motion.div>
                </form>
            </DrawerContent>
        </Drawer>
    );
}
