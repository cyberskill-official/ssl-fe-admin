import { toast } from '@cyberskill/shared/react/toast';
import { AlertCircle, Clock, Eye, Moon, Repeat, Send, Sun, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';

import {
    Button,
    Editor,
    Input,
    Label,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    Switch,
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '#shared/component';
import { useTheme } from '#shared/component/theme-context';
import { E_UserGroup } from '#shared/graphql';
import { useTranslate } from '#shared/i18n';

import type {
    I_EmailCampaignFormData,
    I_EmailCampaignFormProps,
} from './email-campaign.type';

import { EmailCampaignPreview } from './email-campaign-preview';
import {
    extractTimeFromDate,
    formatDateForInput,
} from './email-campaign.utils';

export function EmailCampaignForm({
    emailCampaign,
    mode,
    onSubmit,
    onCancel,
    loading,
}: I_EmailCampaignFormProps) {
    const { t } = useTranslate('email-campaign');
    const { theme, toggleTheme } = useTheme();

    const isCampaignSent = Boolean(
        mode === 'update' && emailCampaign && emailCampaign.isSent,
    );

    const [showPreview, setShowPreview] = useState(false);

    const [formData, setFormData] = useState<I_EmailCampaignFormData>(() => ({
        name: mode === 'update' && emailCampaign ? emailCampaign.name || '' : '',
        subject:
      mode === 'update' && emailCampaign ? emailCampaign.subject || '' : '',
        senderName:
      mode === 'update' && emailCampaign ? emailCampaign.senderName || '' : '',
        senderEmail:
      mode === 'update' && emailCampaign ? emailCampaign.senderEmail || '' : '',
        content:
      mode === 'update' && emailCampaign ? emailCampaign.content || '' : '',
        target:
      mode === 'update' && emailCampaign
          ? emailCampaign.target || E_UserGroup.ALL_SUBSCRIBERS
          : E_UserGroup.ALL_SUBSCRIBERS,
        isScheduled:
      mode === 'update' && emailCampaign
          ? emailCampaign.isScheduled || false
          : false,
        scheduledDate:
      mode === 'update' && emailCampaign && emailCampaign.scheduledDate
          ? emailCampaign.scheduledDate instanceof Date
              ? emailCampaign.scheduledDate
              : new Date(emailCampaign.scheduledDate)
          : undefined,
        scheduledTime:
      mode === 'update' && emailCampaign && emailCampaign.scheduledDate
          ? extractTimeFromDate(emailCampaign.scheduledDate)
          : '',
    }));

    useEffect(() => {
        if (mode === 'update' && emailCampaign) {
            // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect
            setFormData({
                name: emailCampaign.name || '',
                subject: emailCampaign.subject || '',
                senderName: emailCampaign.senderName || '',
                senderEmail: emailCampaign.senderEmail || '',
                content: emailCampaign.content || '',
                target: emailCampaign.target || E_UserGroup.ALL_SUBSCRIBERS,
                isScheduled: emailCampaign.isScheduled || false,
                scheduledDate: emailCampaign.scheduledDate
                    ? emailCampaign.scheduledDate instanceof Date
                        ? emailCampaign.scheduledDate
                        : new Date(emailCampaign.scheduledDate)
                    : undefined,
                scheduledTime: emailCampaign.scheduledDate
                    ? extractTimeFromDate(emailCampaign.scheduledDate)
                    : '',
            });
        }
    }, [emailCampaign, mode]);

    const targetOptions = [
        { label: t('all-subscribers'), value: E_UserGroup.ALL_SUBSCRIBERS },
        { label: t('paid-members-only'), value: E_UserGroup.PAID_MEMBERS },
        { label: t('free-members-only'), value: E_UserGroup.FREE_MEMBERS },
        { label: t('custom-list'), value: E_UserGroup.CUSTOM_RECIPIENTS },
    ];

    const isScheduledDateValid = () => {
        if (!formData.isScheduled)
            return true;

        if (!formData.scheduledDate || !formData.scheduledTime)
            return false;

        const timeParts = formData.scheduledTime.split(':');
        if (timeParts.length !== 2)
            return false;

        const hours = Number.parseInt(timeParts[0] || '0', 10);
        const minutes = Number.parseInt(timeParts[1] || '0', 10);

        if (
            Number.isNaN(hours)
            || Number.isNaN(minutes)
            || hours < 0
            || hours > 23
            || minutes < 0
            || minutes > 59
        ) {
            return false;
        }

        const scheduledDateTime = new Date(formData.scheduledDate);
        scheduledDateTime.setHours(hours, minutes, 0, 0);

        return scheduledDateTime > new Date();
    };

    const _handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            toast.error(t('error.name-required'));
            return;
        }

        if (!formData.subject.trim()) {
            toast.error(t('error.subject-required'));
            return;
        }

        if (!formData.senderName.trim()) {
            toast.error(t('error.sender-name-required'));
            return;
        }

        if (!formData.senderEmail.trim()) {
            toast.error(t('error.sender-email-required'));
            return;
        }

        let finalScheduledDate: Date | undefined;
        if (formData.isScheduled) {
            if (!formData.scheduledDate) {
                toast.error(t('error.scheduled-date-required'));
                return;
            }

            if (!formData.scheduledTime) {
                toast.error(t('error.scheduled-time-required'));
                return;
            }

            const timeParts = formData.scheduledTime.split(':');
            if (timeParts.length !== 2) {
                toast.error(t('error.invalid-time-format'));
                return;
            }

            const hours = Number.parseInt(timeParts[0] || '0', 10);
            const minutes = Number.parseInt(timeParts[1] || '0', 10);

            if (
                Number.isNaN(hours)
                || Number.isNaN(minutes)
                || hours < 0
                || hours > 23
                || minutes < 0
                || minutes > 59
            ) {
                toast.error(t('error.invalid-time-format'));
                return;
            }

            finalScheduledDate = new Date(formData.scheduledDate);
            finalScheduledDate.setHours(hours, minutes, 0, 0);

            const now = new Date();
            if (finalScheduledDate <= now) {
                toast.error(t('error.scheduled-date-future'));
                return;
            }
        }

        const submitData = {
            name: formData.name.trim(),
            subject: formData.subject.trim(),
            senderName: formData.senderName.trim(),
            senderEmail: formData.senderEmail.trim(),
            content: formData.content,
            target: formData.target,
            isScheduled: formData.isScheduled,
            scheduledDate: finalScheduledDate,
            scheduledTime: formData.scheduledTime,
        };
        onSubmit(submitData);
    };

    const _handleChange = (
        field: keyof I_EmailCampaignFormData,
        value: string | boolean | E_UserGroup | Date | undefined,
    ) => {
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
                            {theme === 'dark'
                                ? (
                                        <Sun className="w-5 h-5 text-yellow-400 animate-spin" />
                                    )
                                : (
                                        <Moon className="w-5 h-5 text-blue-500 animate-spin" />
                                    )}
                        </button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <span>
                            {theme === 'dark' ? t('switch-to-light') : t('switch-to-dark')}
                        </span>
                    </TooltipContent>
                </Tooltip>
            </div>

            {/* Warning banner for sent campaigns */}
            {isCampaignSent && (
                <AnimatePresence>
                    <motion.div
                        variants={cardVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        transition={{ duration: 0.4 }}
                        className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50/80 to-orange-50/80 dark:from-amber-900/40 dark:to-orange-900/40 shadow-xl p-4 mb-4"
                    >
                        <div className="flex items-center gap-3">
                            <AlertCircle className="size-6 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                            <div>
                                <h3 className="font-semibold text-amber-800 dark:text-amber-200">
                                    {t('campaign-already-sent')}
                                </h3>
                                <p className="text-sm text-amber-700 dark:text-amber-300">
                                    {t('campaign-readonly-description')}
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </AnimatePresence>
            )}

            <AnimatePresence>
                <motion.div
                    variants={cardVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    transition={{ duration: 0.4 }}
                    className="rounded-2xl border bg-gradient-to-br from-white/80 to-purple-50 dark:from-gray-900/80 dark:to-purple-900/40 shadow-xl p-4 mb-2 glassmorphism"
                >
                    <Label
                        htmlFor="name"
                        className="mb-1 text-sm text-gray-700 dark:text-gray-200"
                    >
                        {t('campaign-name')}
                    </Label>
                    <Input
                        id="name"
                        value={formData.name}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            _handleChange('name', e.target.value)}
                        required
                        placeholder={t('enter-campaign-name')}
                        disabled={isCampaignSent}
                    />
                    <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <AlertCircle className="size-4 text-purple-400" />
                            </TooltipTrigger>
                            <TooltipContent>
                                <span>{t('campaign-name-hint')}</span>
                            </TooltipContent>
                        </Tooltip>
                        {t('campaign-name-hint')}
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
                    className="rounded-2xl border bg-gradient-to-br from-white/80 to-blue-50 dark:from-gray-900/80 dark:to-blue-900/40 shadow-xl p-4 mb-2 glassmorphism"
                >
                    <Label
                        htmlFor="subject"
                        className="mb-1 text-sm text-gray-700 dark:text-gray-200"
                    >
                        {t('email-subject')}
                    </Label>
                    <Input
                        id="subject"
                        value={formData.subject}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            _handleChange('subject', e.target.value)}
                        required
                        placeholder={t('enter-email-subject')}
                        disabled={isCampaignSent}
                    />
                    <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <AlertCircle className="size-4 text-blue-400" />
                            </TooltipTrigger>
                            <TooltipContent>
                                <span>{t('email-subject-hint')}</span>
                            </TooltipContent>
                        </Tooltip>
                        {t('email-subject-hint')}
                    </p>
                </motion.div>
            </AnimatePresence>
            <AnimatePresence>
                <motion.div
                    variants={cardVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    transition={{ duration: 0.4, delay: 0.2 }}
                    className="rounded-2xl border bg-gradient-to-br from-white/80 to-green-50 dark:from-gray-900/80 dark:to-green-900/40 shadow-xl p-4 mb-2 glassmorphism grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                    <div>
                        <Label
                            htmlFor="senderName"
                            className="mb-1 text-sm text-gray-700 dark:text-gray-200"
                        >
                            {t('sender-name')}
                        </Label>
                        <Input
                            id="senderName"
                            value={formData.senderName}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                _handleChange('senderName', e.target.value)}
                            required
                            placeholder={t('enter-sender-name')}
                            disabled={isCampaignSent}
                        />
                    </div>
                    <div>
                        <Label
                            htmlFor="senderEmail"
                            className="mb-1 text-sm text-gray-700 dark:text-gray-200"
                        >
                            {t('sender-email')}
                        </Label>
                        <Input
                            id="senderEmail"
                            type="email"
                            value={formData.senderEmail}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                _handleChange('senderEmail', e.target.value)}
                            required
                            placeholder={t('enter-sender-email')}
                            disabled={isCampaignSent}
                        />
                    </div>
                </motion.div>
            </AnimatePresence>
            <AnimatePresence>
                <motion.div
                    variants={cardVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    transition={{ duration: 0.4, delay: 0.3 }}
                    className="rounded-2xl border bg-gradient-to-br from-white/80 to-yellow-50 dark:from-gray-900/80 dark:to-yellow-900/40 shadow-xl p-4 mb-2 glassmorphism"
                >
                    <Label
                        htmlFor="content"
                        className="mb-1 text-sm text-gray-700 dark:text-gray-200"
                    >
                        {t('email-content')}
                    </Label>
                    <Editor
                        value={formData.content}
                        onChange={
                            isCampaignSent
                                ? () => {}
                                : content => _handleChange('content', content)
                        }
                        showToolbar={!isCampaignSent}
                        className={`min-h-[400px] outline-none p-2 ${
                            isCampaignSent ? 'opacity-60 pointer-events-none' : ''
                        }`}
                        contentClassName={`min-h-[400px] outline-none p-2 ${
                            isCampaignSent ? 'opacity-60' : ''
                        }`}
                        autoFocus={false}
                    />
                    <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <AlertCircle className="size-4 text-yellow-400" />
                            </TooltipTrigger>
                            <TooltipContent>
                                <span>{t('email-content-hint')}</span>
                            </TooltipContent>
                        </Tooltip>
                        {t('email-content-hint')}
                    </p>
                </motion.div>
            </AnimatePresence>
            <AnimatePresence>
                <motion.div
                    variants={cardVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    transition={{ duration: 0.4, delay: 0.4 }}
                    className="rounded-2xl border bg-gradient-to-br from-white/80 to-pink-50 dark:from-gray-900/80 dark:to-pink-900/40 shadow-xl p-4 mb-2 glassmorphism"
                >
                    <Label
                        htmlFor="target"
                        className="mb-1 text-sm text-gray-700 dark:text-gray-200"
                    >
                        {t('target-audience')}
                    </Label>
                    <Select
                        value={formData.target}
                        onValueChange={value =>
                            _handleChange('target', value as E_UserGroup)}
                        disabled={isCampaignSent}
                    >
                        <SelectTrigger className="mb-0.5">
                            <SelectValue placeholder={t('select-target-audience')} />
                        </SelectTrigger>
                        <SelectContent>
                            {targetOptions.map(({ value, label }) => (
                                <SelectItem key={value} value={value}>
                                    {label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <AlertCircle className="size-4 text-pink-400" />
                            </TooltipTrigger>
                            <TooltipContent>
                                <span>{t('target-audience-hint')}</span>
                            </TooltipContent>
                        </Tooltip>
                        {t('target-audience-hint')}
                    </p>
                </motion.div>
            </AnimatePresence>
            <AnimatePresence>
                <motion.div
                    variants={cardVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    transition={{ duration: 0.4, delay: 0.5 }}
                    className="rounded-2xl border bg-gradient-to-br from-white/80 to-indigo-50 dark:from-gray-900/80 dark:to-indigo-900/40 shadow-xl p-4 mb-2 glassmorphism space-y-3"
                >
                    <h3 className="text-base font-semibold mb-2 text-gray-800 dark:text-gray-100 flex items-center gap-2">
                        <Clock className="size-4 text-primary animate-pulse" />
                        {t('scheduling')}
                    </h3>
                    <div className="flex items-center gap-2">
                        <Switch
                            id="isScheduled"
                            checked={formData.isScheduled}
                            onCheckedChange={checked =>
                                _handleChange('isScheduled', checked)}
                            disabled={isCampaignSent}
                        />
                        <Label htmlFor="isScheduled" className="flex items-center gap-2">
                            <Clock className="size-4 text-indigo-500 animate-pulse" />
                            {t('schedule-for-later')}
                        </Label>
                    </div>
                    {formData.isScheduled && (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                                <div>
                                    <Label
                                        htmlFor="scheduledDate"
                                        className="mb-1 text-sm text-gray-700 dark:text-gray-200"
                                    >
                                        {t('date')}
                                    </Label>
                                    <Input
                                        id="scheduledDate"
                                        type="date"
                                        value={formatDateForInput(formData.scheduledDate)}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                            _handleChange(
                                                'scheduledDate',
                                                e.target.value ? new Date(e.target.value) : undefined,
                                            )}
                                        required={formData.isScheduled}
                                        disabled={isCampaignSent}
                                        className={
                                            !isScheduledDateValid()
                                            && formData.scheduledDate
                                            && formData.scheduledTime
                                                ? 'border-red-300 dark:border-red-600'
                                                : ''
                                        }
                                    />
                                </div>
                                <div>
                                    <Label
                                        htmlFor="scheduledTime"
                                        className="mb-1 text-sm text-gray-700 dark:text-gray-200"
                                    >
                                        {t('time')}
                                    </Label>
                                    <Input
                                        id="scheduledTime"
                                        type="time"
                                        value={formData.scheduledTime}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                            _handleChange('scheduledTime', e.target.value)}
                                        required={formData.isScheduled}
                                        disabled={isCampaignSent}
                                        className={
                                            !isScheduledDateValid()
                                            && formData.scheduledDate
                                            && formData.scheduledTime
                                                ? 'border-red-300 dark:border-red-600'
                                                : ''
                                        }
                                    />
                                </div>
                            </div>
                            {!isScheduledDateValid()
                                && formData.scheduledDate
                                && formData.scheduledTime && (
                                <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
                                    <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
                                        <AlertCircle className="size-4" />
                                        {t('error.scheduled-date-future')}
                                    </p>
                                </div>
                            )}
                        </>
                    )}
                    <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <AlertCircle className="size-4 text-indigo-400" />
                            </TooltipTrigger>
                            <TooltipContent>
                                <span>{t('scheduling-hint')}</span>
                            </TooltipContent>
                        </Tooltip>
                        {t('scheduling-hint')}
                    </p>
                </motion.div>
            </AnimatePresence>
            <div className="flex justify-between gap-2 mt-2">
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowPreview(true)}
                    disabled={isCampaignSent}
                    className="flex items-center gap-2"
                >
                    <Eye className="size-4" />
                    {t('preview')}
                </Button>
                <div className="flex gap-2">
                    <Button type="button" variant="outline" onClick={onCancel}>
                        <X className="size-4 mr-1" />
                        {t('cancel')}
                    </Button>
                    <Button
                        type="submit"
                        disabled={
                            loading
                            || !formData.name.trim()
                            || !formData.subject.trim()
                            || !formData.senderName.trim()
                            || !formData.senderEmail.trim()
                            || !isScheduledDateValid()
                            || isCampaignSent
                        }
                        className="font-semibold"
                    >
                        {isCampaignSent
                            ? (
                                    <span className="flex items-center gap-2">
                                        <AlertCircle className="size-4" />
                                        {t('campaign-sent')}
                                    </span>
                                )
                            : loading
                                ? (
                                        <span className="flex items-center gap-2">
                                            <Repeat className="size-4 animate-spin" />
                                            {mode === 'update' ? t('updating') : t('creating')}
                                        </span>
                                    )
                                : (
                                        <span className="flex items-center gap-2">
                                            {formData.isScheduled
                                                ? (
                                                        <Clock className="size-4" />
                                                    )
                                                : (
                                                        <Send className="size-4" />
                                                    )}
                                            {mode === 'update'
                                                ? t('update-campaign')
                                                : formData.isScheduled
                                                    ? t('schedule-campaign')
                                                    : t('send-campaign')}
                                        </span>
                                    )}
                    </Button>
                </div>
            </div>

            {/* Email Preview Dialog */}
            <EmailCampaignPreview
                formData={formData}
                t={t}
                open={showPreview}
                onOpenChange={setShowPreview}
            />
        </form>
    );
}
