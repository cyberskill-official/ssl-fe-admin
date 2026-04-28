import { Calendar, Globe, Mail, User, Users } from 'lucide-react';
import { motion } from 'motion/react';

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '#shared/component';
import { LexicalPreview } from '#shared/component/editor/preview';
import { E_UserGroup } from '#shared/graphql';

import type { I_EmailCampaignFormData } from './email-campaign.type';

interface I_EmailCampaignPreviewProps {
    formData: I_EmailCampaignFormData;
    t: (key: string, params?: Record<string, any>) => string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function EmailCampaignPreview({
    formData,
    t,
    open,
    onOpenChange,
}: I_EmailCampaignPreviewProps) {
    const getTargetLabel = (target: E_UserGroup) => {
        switch (target) {
            case E_UserGroup.ALL_SUBSCRIBERS:
                return t('all-subscribers');
            case E_UserGroup.PAID_MEMBERS:
                return t('paid-members-only');
            case E_UserGroup.FREE_MEMBERS:
                return t('free-members-only');
            case E_UserGroup.CUSTOM_RECIPIENTS:
                return t('custom-list');
            default:
                return target;
        }
    };

    const formatScheduledDateTime = () => {
        if (!formData.scheduledDate || !formData.scheduledTime) {
            return null;
        }

        const date = new Date(formData.scheduledDate);
        const [hours, minutes] = formData.scheduledTime.split(':');
        if (hours && minutes) {
            date.setHours(Number.parseInt(hours, 10), Number.parseInt(minutes, 10));
        }

        return date.toLocaleString('vi-VN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Mail className="size-5 text-purple-500" />
                        {t('preview-campaign')}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Campaign Info Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="rounded-xl border bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 p-4"
                    >
                        <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                            <Globe className="size-5 text-purple-500" />
                            {t('campaign-details')}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="font-medium text-gray-600 dark:text-gray-300">
                                    {t('campaign-name')}
                                    :
                                </span>
                                <p className="mt-1 font-semibold">{formData.name || t('untitled-campaign')}</p>
                            </div>
                            <div>
                                <span className="font-medium text-gray-600 dark:text-gray-300 flex items-center gap-1">
                                    <Users className="size-4" />
                                    {t('target-audience')}
                                    :
                                </span>
                                <p className="mt-1 font-semibold">{getTargetLabel(formData.target)}</p>
                            </div>
                            {formData.isScheduled && (
                                <div className="md:col-span-2">
                                    <span className="font-medium text-gray-600 dark:text-gray-300 flex items-center gap-1">
                                        <Calendar className="size-4" />
                                        {t('scheduled-for')}
                                        :
                                    </span>
                                    <p className="mt-1 font-semibold text-orange-600 dark:text-orange-400">
                                        {formatScheduledDateTime() || t('invalid-schedule')}
                                    </p>
                                </div>
                            )}
                        </div>
                    </motion.div>

                    {/* Email Preview Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.1 }}
                        className="rounded-xl border bg-white dark:bg-gray-800 shadow-lg overflow-hidden"
                    >
                        <div className="bg-gradient-to-r from-purple-500 to-blue-500 p-4 text-white">
                            <h3 className="font-semibold text-lg flex items-center gap-2">
                                <Mail className="size-5" />
                                {t('email-preview')}
                            </h3>
                        </div>

                        {/* Email Header */}
                        <div className="p-4 border-b bg-gray-50 dark:bg-gray-700">
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <User className="size-4 text-gray-500" />
                                    <span className="text-sm font-medium">
                                        {t('from')}
                                        :
                                    </span>
                                    <span className="text-sm">
                                        {formData.senderName || t('no-sender-name')}
                                        {' '}
                                        &lt;
                                        {formData.senderEmail || t('no-sender-email')}
                                        &gt;
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Mail className="size-4 text-gray-500" />
                                    <span className="text-sm font-medium">
                                        {t('subject')}
                                        :
                                    </span>
                                    <span className="text-sm font-semibold">
                                        {formData.subject || t('no-subject')}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Email Content */}
                        <div className="p-0">
                            <div className="p-4 bg-gray-50 dark:bg-gray-800 border-b">
                                <h4 className="font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                    <Mail className="size-4" />
                                    {t('email-content')}
                                </h4>
                            </div>
                            <div className="min-h-[200px]">
                                {formData.content
                                    ? (
                                            <LexicalPreview
                                                content={formData.content}
                                                className="p-6 prose prose-gray dark:prose-invert max-w-none"
                                            />
                                        )
                                    : (
                                            <div className="p-6 text-center text-gray-400 dark:text-gray-500">
                                                <Mail className="size-12 mx-auto mb-2 opacity-50" />
                                                <p>{t('no-content-to-preview')}</p>
                                            </div>
                                        )}
                            </div>
                        </div>
                    </motion.div>

                    {/* Warning if missing content */}
                    {(!formData.name || !formData.subject || !formData.senderName || !formData.senderEmail || !formData.content) && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: 0.2 }}
                            className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-900/20 p-4"
                        >
                            <h4 className="font-medium text-amber-800 dark:text-amber-300 mb-2">
                                {t('incomplete-campaign')}
                            </h4>
                            <ul className="text-sm text-amber-700 dark:text-amber-400 list-disc list-inside space-y-1">
                                {!formData.name && <li>{t('missing-campaign-name')}</li>}
                                {!formData.subject && <li>{t('missing-subject')}</li>}
                                {!formData.senderName && <li>{t('missing-sender-name')}</li>}
                                {!formData.senderEmail && <li>{t('missing-sender-email')}</li>}
                                {!formData.content && <li>{t('missing-content')}</li>}
                            </ul>
                        </motion.div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
