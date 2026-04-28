import { toast } from '@cyberskill/shared/react/toast';
import { AlertCircle, Calendar, CheckCircle, Moon, Repeat, Sparkles, Sun, Users } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useMemo, useState } from 'react';

import { Badge, Button, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Switch, Tooltip, TooltipContent, TooltipTrigger } from '#shared/component';
import { useTheme } from '#shared/component/theme-context';
import { useTranslate } from '#shared/i18n';
import { formatExactTimeDifference } from '#shared/util';

import type { I_PromoCodeFormData, I_PromoCodeFormProps, I_PromoPreviewProps } from './promo-code.type';

import { E_PromoCodeBenefit } from './promo-code.type';

function PromoPreview({ formData, calculatedExpiryDate, t }: I_PromoPreviewProps) {
    const isLifetime = formData.benefit === 'LIFETIME';
    const isActive = !!formData.isActive;
    const expiresAt = calculatedExpiryDate ? new Date(calculatedExpiryDate).toLocaleString() : t('never-expires');
    const usageLimit = formData.isLimit ? formData.usageLimit : null;
    const globalUsageLimit = formData.isLimit ? formData.globalUsageLimit : null;

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const benefitLabels: Record<string, string> = {
        [E_PromoCodeBenefit.ONE_MONTH]: '1 month',
        [E_PromoCodeBenefit.TWO_MONTHS]: '2 months',
        [E_PromoCodeBenefit.THREE_MONTHS]: '3 months',
        [E_PromoCodeBenefit.SIX_MONTHS]: '6 months',
        [E_PromoCodeBenefit.TWELVE_MONTHS]: '12 months',
        [E_PromoCodeBenefit.LIFETIME]: 'Lifetime',
    };

    const exactDuration = useMemo(() => {
        if (isLifetime || !calculatedExpiryDate) {
            return t('lifetime-benefit');
        }

        if (formData.benefit && benefitLabels[formData.benefit]) {
            return benefitLabels[formData.benefit];
        }

        const now = new Date();
        return formatExactTimeDifference(now, calculatedExpiryDate);
    }, [isLifetime, calculatedExpiryDate, formData.benefit, benefitLabels, t]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.4 }}
            className="rounded-2xl glassmorphism border-2 border-purple-200 dark:border-purple-700 p-6 mb-6 shadow-xl bg-white/60 dark:bg-gray-900/60 backdrop-blur-md"
        >
            <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-purple-500 animate-bounce" />
                <span className="font-bold text-lg text-purple-700 dark:text-purple-300 font-mono tracking-wide line-break-anywhere">
                    {formData.code || 'PREVIEWCODE'}
                </span>
                <Badge className="ml-2 bg-gradient-to-r from-purple-400 to-pink-400 text-white text-xs px-2 py-1">
                    {exactDuration}
                </Badge>
            </div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
                <Badge
                    className={
                        isActive
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 transition-colors hover:bg-green-800 hover:text-white text-xs px-2 py-1'
                            : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300 transition-colors hover:bg-gray-500 hover:text-white text-xs px-2 py-1'
                    }
                >
                    {isActive ? t('active') : t('inactive')}
                </Badge>
                <span className="inline-flex items-center gap-2 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded px-2 py-1 animate-fade-in">
                    <Calendar className="w-4 h-4 animate-pulse" />
                    {isLifetime ? t('never-expires') : expiresAt}
                </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 text-xs bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded px-2 py-1 animate-fade-in">
                    <Users className="w-4 h-4 animate-bounce" />
                    {t('usage-limit')}
                    :&nbsp;
                    {usageLimit !== null && usageLimit !== undefined && usageLimit > 0 ? usageLimit : '-'}
                </span>
                <span className="inline-flex items-center gap-2 text-xs bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded px-2 py-1 animate-fade-in">
                    <Users className="w-4 h-4 animate-bounce" />
                    {t('global-usage-limit')}
                    :&nbsp;
                    {globalUsageLimit ?? '-'}
                </span>
            </div>
        </motion.div>
    );
}

export function PromoCodeForm({ promoCode, mode, onSubmit, onCancel, loading }: I_PromoCodeFormProps) {
    const { t } = useTranslate('promoCodes');
    const { theme, toggleTheme } = useTheme();
    const calculateBenefitFromDates = (createdAt: string, expiresAt?: string) => {
        if (!expiresAt || new Date(expiresAt).getFullYear() > 3000) {
            return E_PromoCodeBenefit.LIFETIME;
        }
        const created = new Date(createdAt);
        const expires = new Date(expiresAt);
        const daysDiff = Math.ceil((expires.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));

        if (daysDiff <= 35) {
            return E_PromoCodeBenefit.ONE_MONTH;
        }
        if (daysDiff <= 65) {
            return E_PromoCodeBenefit.TWO_MONTHS;
        }
        if (daysDiff <= 95) {
            return E_PromoCodeBenefit.THREE_MONTHS;
        }
        if (daysDiff <= 185) {
            return E_PromoCodeBenefit.SIX_MONTHS;
        }
        if (daysDiff <= 370) {
            return E_PromoCodeBenefit.TWELVE_MONTHS;
        }

        return formatExactTimeDifference(createdAt, expiresAt);
    };

    const [formData, setFormData] = useState<I_PromoCodeFormData>(() => {
        const calculatedBenefit = mode === 'update' && promoCode ? calculateBenefitFromDates(promoCode.createdAt, promoCode.expiresAt) : '';
        const isCustomBenefit = Boolean(calculatedBenefit && !Object.values(E_PromoCodeBenefit).includes(calculatedBenefit as E_PromoCodeBenefit));

        return {
            code: mode === 'update' && promoCode ? promoCode.code || '' : '',
            benefit: calculatedBenefit,
            isActive: mode === 'update' && promoCode ? promoCode.isActive || false : true,
            isLimit: mode === 'update' && promoCode ? promoCode.isLimit || false : false,
            usageLimit: mode === 'update' && promoCode ? promoCode.usageLimit || 0 : 0,
            globalUsageLimit: mode === 'update' && promoCode ? promoCode.globalUsageLimit || 0 : 0,
            useCustomExpiry: isCustomBenefit,
            customExpiryDate: mode === 'update' && promoCode && promoCode.expiresAt ? new Date(promoCode.expiresAt).toISOString().slice(0, 16) : '',
        };
    });

    useEffect(() => {
        if (mode === 'update' && promoCode) {
            const calculatedBenefit = calculateBenefitFromDates(promoCode.createdAt, promoCode.expiresAt);
            const isCustomBenefit = Boolean(calculatedBenefit && !Object.values(E_PromoCodeBenefit).includes(calculatedBenefit as E_PromoCodeBenefit));

            // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect
            setFormData({
                code: promoCode.code || '',
                benefit: calculatedBenefit,
                isActive: promoCode.isActive || false,
                isLimit: promoCode.isLimit || false,
                usageLimit: promoCode.usageLimit || 0,
                globalUsageLimit: promoCode.globalUsageLimit || 0,
                customExpiryDate: promoCode.expiresAt ? new Date(promoCode.expiresAt).toISOString().slice(0, 16) : '',
                useCustomExpiry: isCustomBenefit,
            });
        }
    }, [promoCode, mode]);

    const benefitOptions = [
        { label: '1 month', value: E_PromoCodeBenefit.ONE_MONTH },
        { label: '2 months', value: E_PromoCodeBenefit.TWO_MONTHS },
        { label: '3 months', value: E_PromoCodeBenefit.THREE_MONTHS },
        { label: '6 months', value: E_PromoCodeBenefit.SIX_MONTHS },
        { label: '12 months', value: E_PromoCodeBenefit.TWELVE_MONTHS },
        { label: 'Lifetime', value: E_PromoCodeBenefit.LIFETIME },
        { label: 'Custom', value: 'CUSTOM' },
    ];

    const _calculatedExpiryDate = useMemo(() => {
        if (formData.benefit === 'CUSTOM') {
            return formData.customExpiryDate ? new Date(formData.customExpiryDate).toISOString() : null;
        }
        if (!formData.benefit) {
            return null;
        }

        const now = new Date();
        const expiryDate = new Date(now);
        switch (formData.benefit) {
            case E_PromoCodeBenefit.ONE_MONTH:
                expiryDate.setMonth(expiryDate.getMonth() + 1);
                break;
            case E_PromoCodeBenefit.TWO_MONTHS:
                expiryDate.setMonth(expiryDate.getMonth() + 2);
                break;
            case E_PromoCodeBenefit.THREE_MONTHS:
                expiryDate.setMonth(expiryDate.getMonth() + 3);
                break;
            case E_PromoCodeBenefit.SIX_MONTHS:
                expiryDate.setMonth(expiryDate.getMonth() + 6);
                break;
            case E_PromoCodeBenefit.TWELVE_MONTHS:
                expiryDate.setMonth(expiryDate.getMonth() + 12);
                break;
            case E_PromoCodeBenefit.LIFETIME:
                expiryDate.setFullYear(3000);
                break;
            default:
                expiryDate.setFullYear(3000);
        }
        expiryDate.setHours(12, 0, 0, 0);

        return expiryDate.toISOString();
    }, [formData.benefit, formData.customExpiryDate]);

    const _handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (formData.isLimit && formData.globalUsageLimit <= 0) {
            toast.error(t('error.global-usage-limit-required'));
            return;
        }

        if (formData.isLimit && formData.globalUsageLimit > 0 && formData.usageLimit > formData.globalUsageLimit) {
            toast.error(t('error.usage-limit-exceeds-global'));
            return;
        }

        const submitData = {
            code: formData.code.toUpperCase(),
            isActive: formData.isActive,
            isLimit: formData.isLimit,
            usageLimit: formData.isLimit ? formData.usageLimit : undefined,
            globalUsageLimit: formData.isLimit && formData.globalUsageLimit !== null && formData.globalUsageLimit !== undefined ? formData.globalUsageLimit : undefined,
            expiresAt: _calculatedExpiryDate,
        };
        onSubmit(submitData);
    };

    const _handleChange = (field: keyof I_PromoCodeFormData, value: string | boolean | number) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const cardVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: 30 },
    };

    return (
        <form
            onSubmit={(e) => {
                _handleSubmit(e);
            }}
            className="space-y-4 p-1 sm:p-2"
        >
            <div className="flex justify-end mb-1">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <button
                            type="button"
                            onClick={toggleTheme}
                            className="rounded-full p-1.5 hover:bg-purple-100 dark:hover:bg-purple-800 transition-colors border border-purple-200 dark:border-purple-700 bg-white dark:bg-gray-800"
                            aria-label="Toggle theme"
                        >
                            {theme === 'dark' ? <Sun className="w-5 h-5 text-yellow-400 animate-spin" /> : <Moon className="w-5 h-5 text-blue-500 animate-spin" />}
                        </button>
                    </TooltipTrigger>
                    <TooltipContent><span>{theme === 'dark' ? t('switch-to-light') : t('switch-to-dark')}</span></TooltipContent>
                </Tooltip>
            </div>
            <AnimatePresence>
                <PromoPreview formData={formData} calculatedExpiryDate={_calculatedExpiryDate} t={t} />
            </AnimatePresence>
            <AnimatePresence>
                <motion.div
                    variants={cardVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    transition={{ duration: 0.4 }}
                    className="rounded-2xl border bg-gradient-to-br from-white/80 to-purple-50 dark:from-gray-900/80 dark:to-purple-900/40 shadow-xl p-4 mb-2 glassmorphism"
                >
                    <Label htmlFor="code" className="mb-1 text-sm text-gray-700 dark:text-gray-200">{t('code')}</Label>
                    <Input
                        id="code"
                        value={formData.code}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => _handleChange('code', e.target.value)}
                        required
                    />
                    <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <AlertCircle className="w-4 h-4 text-purple-400" />
                            </TooltipTrigger>
                            <TooltipContent><span>{t('code-hint')}</span></TooltipContent>
                        </Tooltip>
                        {t('code-hint')}
                    </p>
                </motion.div>
            </AnimatePresence>
            <AnimatePresence>
                <motion.div
                    variants={cardVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    transition={{ duration: 0.4, delay: 0.1 }}
                    className="rounded-2xl border bg-gradient-to-br from-white/80 to-blue-50 dark:from-gray-900/80 dark:to-blue-900/40 shadow-xl p-4 mb-2 glassmorphism grid grid-cols-1 md:grid-cols-2 gap-4 items-start"
                >
                    <div>
                        <div className="flex flex-col md:flex-row md:items-center gap-2">
                            <div className="flex flex-col">
                                <Label htmlFor="customExpiryDate" className="mb-1 text-sm text-gray-700 dark:text-gray-200">{t('benefit')}</Label>
                                <Select value={formData.benefit} onValueChange={value => _handleChange('benefit', value)}>
                                    <SelectTrigger className="mb-0.5 md:mb-0 md:mr-2 min-w-[140px]">
                                        <SelectValue placeholder={t('select-benefit')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {benefitOptions.map(({ value, label }) => (
                                            <SelectItem key={value} value={value}>{label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex flex-col">
                                <Label htmlFor="customExpiryDate" className="mb-1 text-sm text-gray-700 dark:text-gray-200">{t('custom-expiry-date-short')}</Label>
                                <Input
                                    id="customExpiryDate"
                                    type="datetime-local"
                                    value={formData.customExpiryDate}
                                    onChange={e => _handleChange('customExpiryDate', e.target.value)}
                                    required={formData.benefit === 'CUSTOM'}
                                    disabled={formData.benefit !== 'CUSTOM'}
                                    className={`min-w-[180px]${formData.benefit !== 'CUSTOM' ? ' bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500' : ''}`}
                                    style={{ minHeight: 44 }}
                                />
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <AlertCircle className="w-4 h-4 text-blue-400" />
                                </TooltipTrigger>
                                <TooltipContent><span>{t('benefit-hint')}</span></TooltipContent>
                            </Tooltip>
                            {t('benefit-hint')}
                        </p>
                    </div>
                </motion.div>
            </AnimatePresence>
            <AnimatePresence>
                <motion.div
                    variants={cardVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    transition={{ duration: 0.4, delay: 0.2 }}
                    className="rounded-2xl border bg-gradient-to-br from-white/80 to-green-50 dark:from-gray-900/80 dark:to-green-900/40 shadow-xl p-4 mb-2 glassmorphism space-y-3"
                >
                    <h3 className="text-base font-semibold mb-2 text-gray-800 dark:text-gray-100 flex items-center gap-2">
                        <Users className="w-4 h-4 text-primary animate-pulse" />
                        {t('status-and-duration')}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                        <div className="flex items-center gap-2">
                            <Switch
                                id="isActive"
                                checked={formData.isActive}
                                onCheckedChange={checked => _handleChange('isActive', checked)}
                            />
                            <Label htmlFor="isActive" className="flex items-center gap-2">
                                <Sun className="w-4 h-4 text-yellow-500 dark:hidden animate-spin-slow" />
                                <Moon className="w-4 h-4 text-blue-500 hidden dark:inline animate-spin-slow" />
                                {t('active')}
                            </Label>
                        </div>
                        <div className="flex items-center gap-2">
                            <Switch
                                id="isLimit"
                                checked={formData.isLimit}
                                onCheckedChange={checked => _handleChange('isLimit', checked)}
                            />
                            <Label htmlFor="isLimit" className="flex items-center gap-2">
                                <Users className="w-4 h-4 text-primary animate-pulse" />
                                {t('has-usage-limit')}
                            </Label>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 gap-4 mt-2">
                        <div className="opacity-50 pointer-events-none">
                            <Label htmlFor="usageLimit" className="mb-1 flex items-center gap-2">
                                {t('usage-limit-per-user')}
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <AlertCircle className="w-4 h-4 text-blue-400" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <span>{t('usage-limit-per-user-disabled-hint')}</span>
                                    </TooltipContent>
                                </Tooltip>
                            </Label>
                            <Input
                                id="usageLimit"
                                type="number"
                                value={1}
                                className="mb-0.5 min-w-[180px] bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500"
                                disabled={true}
                                readOnly={true}
                            />
                            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 text-blue-400" />
                                {t('usage-limit-per-user-locked')}
                            </p>
                        </div>
                        <div>
                            <Label htmlFor="globalUsageLimit" className="mb-1 inline-block">{t('global-usage-limit')}</Label>
                            <Input
                                id="globalUsageLimit"
                                type="number"
                                value={formData.globalUsageLimit}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => _handleChange('globalUsageLimit', Number.parseInt(e.target.value) || 0)}
                                min={formData.isLimit ? 1 : 0}
                                className={`mb-0.5 min-w-[180px]${!formData.isLimit ? ' bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500' : ''}`}
                                required={formData.isLimit}
                                disabled={!formData.isLimit}
                            />
                            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <AlertCircle className="w-4 h-4 text-green-400" />
                                    </TooltipTrigger>
                                    <TooltipContent><span>{t('global-usage-limit-hint')}</span></TooltipContent>
                                </Tooltip>
                                {t('global-usage-limit-hint')}
                            </p>
                        </div>
                    </div>
                </motion.div>
            </AnimatePresence>
            <div className="flex justify-end gap-2 mt-2">
                <Button type="button" variant="outline" onClick={onCancel}>
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {t('cancel')}
                </Button>
                <Button type="submit" disabled={loading || !formData.code || !formData.benefit} className="font-semibold">
                    {loading
                        ? (
                                <span className="flex items-center gap-2">
                                    <Repeat className="w-4 h-4 animate-spin" />
                                    {mode === 'update' ? t('updating') : t('creating')}
                                </span>
                            )
                        : (
                                <span className="flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4" />
                                    {mode === 'update' ? t('update-promo-code') : t('create-promo-code')}
                                </span>
                            )}
                </Button>
            </div>
        </form>
    );
}
