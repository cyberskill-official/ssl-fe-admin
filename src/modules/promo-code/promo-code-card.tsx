import { Calendar, Copy, Edit, MoreHorizontal, Sparkles, Trash2, Users, Zap } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';

import { Badge, Button, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, Switch, Tooltip, TooltipContent, TooltipTrigger } from '#shared/component';
import { formatExactTimeDifference } from '#shared/util';

import type { I_PromoCodeCardProps } from './promo-code.type';

export function PromoCodeCard({ promoCode, onEdit, onDelete, onToggleStatus, updatingStatusId, t }: I_PromoCodeCardProps) {
    const [copied, setCopied] = useState(false);

    const isActive = promoCode.isActive || false;
    const isExpired = promoCode.expiresAt ? new Date(promoCode.expiresAt) < new Date() : false;
    const isExpiringSoon = promoCode.expiresAt
        ? {
                date: new Date(promoCode.expiresAt),
                daysLeft: Math.ceil((new Date(promoCode.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
            }
        : null;

    const _getCardStatus = () => {
        if (isExpired)
            return { color: 'from-red-500 to-red-600', status: 'expired' };
        if (!isActive)
            return { color: 'from-gray-500 to-gray-600', status: 'inactive' };
        if (isExpiringSoon && isExpiringSoon.daysLeft <= 7)
            return { color: 'from-orange-500 to-orange-600', status: 'expiring-soon' };
        return { color: 'from-green-500 to-green-600', status: 'active' };
    };

    const { color, status } = _getCardStatus();

    const _handleCopyCode = async () => {
        try {
            await navigator.clipboard.writeText(promoCode.code || '');
            setCopied(true);
            setTimeout(setCopied, 2000, false);
        }
        catch (err) {
            console.error('Failed to copy code:', err);
        }
    };

    const _getExpiryDisplay = () => {
        if (!promoCode.expiresAt) {
            return { text: t('never-expires'), badge: t('lifetime-benefit') };
        }

        const exactDuration = formatExactTimeDifference(promoCode.createdAt, promoCode.expiresAt);
        const expiryDate = new Date(promoCode.expiresAt).toLocaleDateString();

        if (isExpiringSoon && isExpiringSoon.daysLeft <= 7) {
            return {
                text: `${isExpiringSoon.daysLeft} ${t('days-left')}`,
                badge: exactDuration,
                urgent: true,
            };
        }

        return { text: expiryDate, badge: exactDuration };
    };

    const expiryDisplay = _getExpiryDisplay();

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            className="relative group rounded-2xl overflow-hidden transition-all duration-300 transform hover:scale-105 hover:shadow-2xl shadow-lg"
        >
            {/* Status indicator bar */}
            <div className={`h-1 bg-gradient-to-r ${color}`} />

            {/* Main card content */}
            <div className="bg-white dark:bg-gray-800 p-6">
                {/* Header with code and actions */}
                <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="w-4 h-4 text-purple-500" />
                            <span className="font-mono font-bold text-lg text-gray-900 dark:text-gray-100 truncate">
                                {promoCode.code}
                            </span>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={_handleCopyCode}
                                        className="h-6 w-6 p-0"
                                    >
                                        <Copy className={`w-3 h-3 ${copied ? 'text-green-500' : 'text-gray-400'}`} />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <span>{copied ? t('copied') : t('copy-code')}</span>
                                </TooltipContent>
                            </Tooltip>
                        </div>

                        {/* Status badges */}
                        <div className="flex flex-wrap items-center gap-2">
                            <Badge
                                className={
                                    status === 'active'
                                        ? 'bg-emerald-500 text-white border border-emerald-600 shadow'
                                        : status === 'inactive'
                                            ? 'bg-gray-400 text-white border border-gray-500 shadow'
                                            : status === 'expired'
                                                ? 'bg-red-500 text-white border border-red-600 shadow'
                                                : 'bg-orange-400 text-white border border-orange-500 shadow'
                                }
                            >
                                {status === 'active' && <Zap className="w-3 h-3 mr-1" />}
                                {t(status)}
                            </Badge>

                            {expiryDisplay.urgent && (
                                <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 animate-pulse">
                                    {t('urgent')}
                                </Badge>
                            )}
                        </div>
                    </div>

                    {/* Actions dropdown */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="w-4 h-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onEdit(promoCode)}>
                                <Edit className="w-4 h-4 mr-2" />
                                {t('edit')}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => onDelete(promoCode)}
                                className="text-red-600 dark:text-red-400"
                            >
                                <Trash2 className="w-4 h-4 mr-2" />
                                {t('delete')}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* Details grid */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <Calendar className="w-4 h-4" />
                            <span>{t('expires')}</span>
                        </div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                            {expiryDisplay.text}
                        </p>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <Users className="w-4 h-4" />
                            <span>{t('usage')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-900 dark:text-gray-100">
                                {promoCode.usageLimit || 0}
                            </p>
                            {promoCode.globalUsageLimit && promoCode.globalUsageLimit > 0 && (
                                <span className="text-xs text-gray-500">
                                    /
                                    {' '}
                                    {promoCode.globalUsageLimit}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Usage progress bar */}
                {promoCode.isLimit && promoCode.globalUsageLimit && promoCode.globalUsageLimit > 0 && (
                    <div className="mb-4">
                        <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                            <span>{t('usage-progress')}</span>
                            <span>
                                {Math.round(((promoCode.usageLimit || 0) / promoCode.globalUsageLimit) * 100)}
                                %
                            </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                                className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                                style={{
                                    width: `${Math.min(((promoCode.usageLimit || 0) / promoCode.globalUsageLimit) * 100, 100)}%`,
                                }}
                            />
                        </div>
                    </div>
                )}

                {/* Footer with toggle and creation date */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2">
                        <Switch
                            checked={isActive}
                            onCheckedChange={() => onToggleStatus(promoCode.id!, isActive)}
                            disabled={updatingStatusId === promoCode.id}
                        />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                            {isActive ? t('active') : t('inactive')}
                        </span>
                    </div>

                    <span className="text-xs text-gray-500 dark:text-gray-400">
                        {t('created')}
                        :
                        {new Date(promoCode.createdAt).toLocaleDateString()}
                    </span>
                </div>
            </div>
        </motion.div>
    );
}
