import { Bell, Mail, UserCheck } from 'lucide-react';
import { useState } from 'react';

import { Input } from '#shared/component';
import { useTranslate } from '#shared/i18n';
import { cn } from '#shared/util';

import type { I_AdminNotification } from './admin-notifications.type';

const notificationIcons = {
    successfulPayments: Mail,
    failedPayments: Bell,
    newMembers: UserCheck,
};

export function AdminNotificationsSection() {
    const { t } = useTranslate('settings');
    const [adminNotifications, setAdminNotifications] = useState<I_AdminNotification>({
        successfulPayments: true,
        failedPayments: true,
        newMembers: true,
    });

    const _toggleNotification = (key: keyof I_AdminNotification) => {
        setAdminNotifications((prev: I_AdminNotification) => ({
            ...prev,
            [key]: !prev[key],
        }));
    };

    return (
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 dark:border-slate-700/20 relative">
            <div className="flex items-center justify-between p-8 border-b border-white/20 dark:border-slate-700/20 bg-gradient-to-r from-white/80 to-purple-50/80 dark:from-slate-800/80 dark:to-slate-700/80">
                <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gradient-to-r from-orange-600 to-red-600 rounded-xl">
                        <Bell className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-orange-800 to-red-800 dark:from-white dark:via-orange-200 dark:to-red-200 bg-clip-text text-transparent">
                        {t('admin-notifications.title')}
                    </h3>
                </div>
            </div>
            <div className="p-8">
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                    {t('admin-notifications.description')}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {Object.entries(adminNotifications).map(([key, enabled]) => {
                        const Icon = notificationIcons[key as keyof typeof notificationIcons] || Bell;
                        return (
                            <div
                                key={key}
                                className={cn(
                                    'rounded-xl p-5 flex flex-col gap-2 shadow border border-gray-200 dark:border-slate-600 bg-white/60 dark:bg-slate-700/60 hover:shadow-lg transition-all duration-300',
                                    enabled ? 'ring-2 ring-purple-400 dark:ring-purple-500' : '',
                                )}
                            >
                                <div className="flex items-center gap-3 mb-2">
                                    <Icon className={cn('w-6 h-6', enabled ? 'text-purple-600 dark:text-purple-400' : 'text-gray-400 dark:text-gray-500')} />
                                    <span className="font-semibold text-gray-900 dark:text-gray-100 capitalize flex-1">
                                        {t(`admin-notifications.${key}.title`)}
                                    </span>
                                    <label className="relative inline-flex h-6 w-11 items-center rounded-full cursor-pointer">
                                        <Input
                                            type="checkbox"
                                            checked={enabled}
                                            onChange={() => _toggleNotification(key as keyof I_AdminNotification)}
                                            className="sr-only"
                                        />
                                        <span
                                            className={cn(
                                                'block h-6 w-11 bg-gray-200 dark:bg-slate-600 rounded-full transition-colors duration-200',
                                                enabled && 'bg-purple-600 dark:bg-purple-500',
                                            )}
                                        />
                                        <span
                                            className={cn(
                                                'absolute left-1 h-4 w-4 bg-white dark:bg-slate-200 rounded-full transition-transform duration-200',
                                                enabled && 'translate-x-5',
                                            )}
                                        />
                                    </label>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {t(`admin-notifications.${key}.description`)}
                                </p>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
