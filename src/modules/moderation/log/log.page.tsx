import type { DateRange } from 'react-day-picker';

import { AlertTriangle, Ban, Calendar, CheckCircle, ChevronLeft, ChevronRight, Clock, Download, ExternalLink, Eye, Filter, Search, Shield, User, UserCheck, XCircle } from 'lucide-react';
import { AnimatePresence } from 'motion/react';
import { useEffect, useState } from 'react';

import { Button, DatePicker, Input } from '#shared/component';
import { E_MessageType, E_ModerationLogAction, E_ModerationMediaType } from '#shared/graphql';
import { useTranslate } from '#shared/i18n';
import { usePortal } from '#shared/portal';

import { useGetModerationLogs } from './moderation-log.hook';

const UNDERSCORE_RE = /_/g;

export default function LogPage() {
    const { t } = useTranslate('moderation');
    const { setHeader } = usePortal();
    const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
    const [selectedAdmin, setSelectedAdmin] = useState('');
    const [selectedAction, setSelectedAction] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(1);
    const [limit] = useState(20);
    const [showMediaModal, setShowMediaModal] = useState(false);
    const [selectedMediaUrl, setSelectedMediaUrl] = useState<string>('');
    const [selectedMediaIsVideo, setSelectedMediaIsVideo] = useState(false);

    // Use real GraphQL hook
    const { logs: _logs, loading: _loading, totalDocs, totalPages, refetch } = useGetModerationLogs(
        {
            action: selectedAction ? (selectedAction as E_ModerationLogAction) : undefined,
        },
        {
            page,
            limit,
        },
        true,
    );

    useEffect(() => {
        setHeader({
            title: t('log.title'),
            description: t('log.description'),
            icon: Shield,
        });
        return () => setHeader(null);
    }, [setHeader, t]);

    useEffect(() => {
        refetch();
    }, [page, selectedAction, refetch]);

    const _allAdmins = new Set(_logs.map(log => log?.user?.username).filter(Boolean));

    // Calculate statistics
    const totalLogs = totalDocs || _logs.length;
    const actionCounts = _logs.reduce((acc, log) => {
        if (log?.action) {
            acc[log.action] = (acc[log.action] || 0) + 1;
        }
        return acc;
    }, {} as Record<string, number>);

    const getActionConfig = (action?: E_ModerationLogAction) => {
        switch (action) {
            case E_ModerationLogAction.DELETE:
                return {
                    icon: XCircle,
                    color: 'from-red-500 to-pink-500',
                    bgColor: 'from-red-100 to-pink-100 dark:from-red-900/50 dark:to-pink-900/50',
                    textColor: 'text-red-700 dark:text-red-300',
                    borderColor: 'border-red-200 dark:border-red-700',
                };
            case E_ModerationLogAction.SUSPEND:
                return {
                    icon: Ban,
                    color: 'from-orange-500 to-red-500',
                    bgColor: 'from-orange-100 to-red-100 dark:from-orange-900/50 dark:to-red-900/50',
                    textColor: 'text-orange-700 dark:text-orange-300',
                    borderColor: 'border-orange-200 dark:border-orange-700',
                };
            case E_ModerationLogAction.APPROVE:
                return {
                    icon: CheckCircle,
                    color: 'from-emerald-500 to-teal-500',
                    bgColor: 'from-emerald-100 to-teal-100 dark:from-emerald-900/50 dark:to-teal-900/50',
                    textColor: 'text-emerald-700 dark:text-emerald-300',
                    borderColor: 'border-emerald-200 dark:border-emerald-700',
                };
            case E_ModerationLogAction.WARN:
                return {
                    icon: AlertTriangle,
                    color: 'from-amber-500 to-orange-500',
                    bgColor: 'from-amber-100 to-orange-100 dark:from-amber-900/50 dark:to-orange-900/50',
                    textColor: 'text-amber-700 dark:text-amber-300',
                    borderColor: 'border-amber-200 dark:border-amber-700',
                };
            case E_ModerationLogAction.DEACTIVATE:
                return {
                    icon: Shield,
                    color: 'from-slate-500 to-gray-500',
                    bgColor: 'from-slate-100 to-gray-100 dark:from-slate-900/50 dark:to-gray-900/50',
                    textColor: 'text-slate-700 dark:text-slate-300',
                    borderColor: 'border-slate-200 dark:border-slate-700',
                };
            case E_ModerationLogAction.CLOSE:
                return {
                    icon: Eye,
                    color: 'from-blue-500 to-cyan-500',
                    bgColor: 'from-blue-100 to-cyan-100 dark:from-blue-900/50 dark:to-cyan-900/50',
                    textColor: 'text-blue-700 dark:text-blue-300',
                    borderColor: 'border-blue-200 dark:border-blue-700',
                };
            case E_ModerationLogAction.UN_SUSPEND:
                return {
                    icon: CheckCircle,
                    color: 'from-emerald-500 to-teal-500',
                    bgColor: 'from-emerald-100 to-teal-100 dark:from-emerald-900/50 dark:to-teal-900/50',
                    textColor: 'text-emerald-700 dark:text-emerald-300',
                    borderColor: 'border-emerald-200 dark:border-emerald-700',
                };
            default:
                return {
                    icon: Shield,
                    color: 'from-gray-500 to-slate-500',
                    bgColor: 'from-gray-100 to-slate-100 dark:from-gray-900/50 dark:to-slate-900/50',
                    textColor: 'text-gray-700 dark:text-gray-300',
                    borderColor: 'border-gray-200 dark:border-gray-700',
                };
        }
    };

    const _formatDate = (date: string) => new Date(date).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });

    const _handleExport = () => {
        // Simulate export functionality
        console.warn('Exporting logs...');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-6 py-6">
            {/* Header Section */}
            <div className="flex items-center justify-end mb-8">
                <Button
                    variant="ghost"
                    onClick={_handleExport}
                    className="flex items-center whitespace-nowrap px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                >
                    <Download className="w-5 h-5 mr-2" />
                    {t('log.export')}
                </Button>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/50 dark:to-pink-900/50 rounded-xl p-4 border border-purple-200 dark:border-purple-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-semibold text-purple-700 dark:text-purple-300">{t('log.stats.total-logs')}</p>
                            <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">{totalLogs}</p>
                        </div>
                        <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
                            <Shield className="w-5 h-5 text-white" />
                        </div>
                    </div>
                </div>
                {Object.entries(actionCounts).slice(0, 5).map(([action, count]) => {
                    const config = getActionConfig(action as E_ModerationLogAction);
                    const Icon = config.icon;
                    return (
                        <div key={action} className={`bg-gradient-to-r ${config.bgColor} rounded-xl p-4 border ${config.borderColor}`}>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className={`text-sm font-semibold ${config.textColor}`}>{t(`actions.${action?.toLowerCase().replace(UNDERSCORE_RE, '-')}`)}</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{count}</p>
                                </div>
                                <div className={`p-2 bg-gradient-to-r ${config.color} rounded-lg`}>
                                    <Icon className="w-5 h-5 text-white" />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Filters Section */}
            <div className="bg-gradient-to-r from-gray-50 to-purple-50 dark:from-slate-700 dark:to-slate-600 rounded-xl border border-gray-200 dark:border-slate-600 p-6">
                <div className="flex items-center space-x-2 mb-4">
                    <Filter className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{t('log.filters.title')}</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div className="lg:col-span-2 relative">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
                            <Input
                                type="text"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                placeholder={t('log.filters.search-placeholder')}
                                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 dark:border-slate-600 rounded-xl focus:border-purple-500 dark:focus:border-purple-400 focus:ring-purple-100 dark:focus:ring-purple-900/50 bg-white/80 dark:bg-slate-700/80 backdrop-blur-sm"
                            />
                        </div>
                    </div>

                    <select
                        value={selectedAdmin}
                        onChange={e => setSelectedAdmin(e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 dark:border-slate-600 rounded-xl focus:border-purple-500 dark:focus:border-purple-400 focus:ring-purple-100 dark:focus:ring-purple-900/50 bg-white/80 dark:bg-slate-700/80 backdrop-blur-sm text-gray-900 dark:text-gray-100"
                    >
                        <option value="">{t('log.filters.all-admins')}</option>
                        {Array.from(_allAdmins, admin => (
                            <option key={admin} value={admin || ''}>{admin}</option>
                        ))}
                    </select>

                    <select
                        value={selectedAction}
                        onChange={e => setSelectedAction(e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 dark:border-slate-600 rounded-xl focus:border-purple-500 dark:focus:border-purple-400 focus:ring-purple-100 dark:focus:ring-purple-900/50 bg-white/80 dark:bg-slate-700/80 backdrop-blur-sm text-gray-900 dark:text-gray-100"
                    >
                        <option value="">{t('log.filters.all-actions')}</option>
                        {Object.values(E_ModerationLogAction).map(action => (
                            <option key={action} value={action}>{t(`actions.${action?.toLowerCase().replace(UNDERSCORE_RE, '-')}`)}</option>
                        ))}
                    </select>

                    <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 pointer-events-none">
                            <Calendar className="w-4 h-4" />
                        </div>
                        <DatePicker
                            label={t('log.filters.select-date-range')}
                            mode="range"
                            value={dateRange}
                            onChange={(update) => {
                                setDateRange(update as DateRange | undefined);
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* Logs Table */}
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gradient-to-r from-gray-50 to-purple-50 dark:from-slate-700 dark:to-slate-600">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                                <div className="flex items-center space-x-2">
                                    <Clock className="w-4 h-4" />
                                    <span>{t('log.table.timestamp')}</span>
                                </div>
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                                <div className="flex items-center space-x-2">
                                    <User className="w-4 h-4" />
                                    <span>{t('log.table.admin')}</span>
                                </div>
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                                <div className="flex items-center space-x-2">
                                    <UserCheck className="w-4 h-4" />
                                    <span>{t('log.table.target-user')}</span>
                                </div>
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                                <div className="flex items-center space-x-2">
                                    <Shield className="w-4 h-4" />
                                    <span>{t('log.table.action')}</span>
                                </div>
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                                <div className="flex items-center space-x-2">
                                    <Eye className="w-4 h-4" />
                                    <span>{t('log.table.target-content')}</span>
                                </div>
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                                <div className="flex items-center space-x-2">
                                    <AlertTriangle className="w-4 h-4" />
                                    <span>{t('log.table.comment')}</span>
                                </div>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white/60 dark:bg-slate-800/60 divide-y divide-gray-200 dark:divide-slate-600">
                        {_logs.map((log, index) => {
                            const config = getActionConfig(log.action as E_ModerationLogAction);
                            const Icon = config.icon;
                            const messageContent = log.message?.content;
                            const targetContent = log.moderationMedia?.type || log.type || messageContent?.type;
                            const isVideoType = targetContent === E_ModerationMediaType.VIDEO
                                || messageContent?.type === E_MessageType.VIDEO;
                            const mediaUrl = log.moderationMedia?.url
                                || ((messageContent?.type === E_MessageType.IMAGE || messageContent?.type === E_MessageType.VIDEO)
                                    ? messageContent?.value
                                    : undefined);
                            const isMediaType = targetContent === E_ModerationMediaType.IMAGE
                                || targetContent === E_ModerationMediaType.VIDEO
                                || messageContent?.type === E_MessageType.IMAGE
                                || messageContent?.type === E_MessageType.VIDEO;
                            const targetUser = log.targetUser;

                            return (
                                <tr
                                    key={log.id || `log-${index}`}
                                    className="hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 dark:hover:from-purple-900/20 dark:hover:to-pink-900/20 transition-all duration-300 transform hover:scale-[1.01]"
                                    style={{ animationDelay: `${index * 100}ms` }}
                                >
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center space-x-2">
                                            <div className="p-2 bg-gradient-to-r from-gray-100 to-slate-100 dark:from-slate-700 dark:to-slate-600 rounded-lg">
                                                <Clock className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                                            </div>
                                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                {_formatDate(log.createdAt)}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center space-x-2">
                                            <div className="p-2 bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-900/50 dark:to-cyan-900/50 rounded-lg">
                                                <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                            </div>
                                            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                                {log.user?.username || '-'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center space-x-2">
                                            <div className="p-2 bg-gradient-to-r from-indigo-100 to-violet-100 dark:from-indigo-900/50 dark:to-violet-900/50 rounded-lg">
                                                <UserCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                            </div>
                                            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                                {targetUser?.username || targetUser?.email || '-'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center space-x-2">
                                            <div className={`p-2 bg-gradient-to-r ${config.bgColor} rounded-lg border ${config.borderColor}`}>
                                                <Icon className={`w-4 h-4 ${config.textColor}`} />
                                            </div>
                                            <span className={`px-3 py-1 text-xs font-bold rounded-full bg-gradient-to-r ${config.bgColor} ${config.textColor} border ${config.borderColor}`}>
                                                {t(`actions.${log.action?.toLowerCase().replace(UNDERSCORE_RE, '-')}`)}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center space-x-2">
                                            <div className="p-2 bg-gradient-to-r from-emerald-100 to-teal-100 dark:from-emerald-900/50 dark:to-teal-900/50 rounded-lg">
                                                <Eye className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                            </div>
                                            <span className="text-sm text-gray-900 dark:text-gray-100 font-mono">
                                                {targetContent || '-'}
                                            </span>
                                            {mediaUrl && isMediaType
                                                ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setSelectedMediaUrl(mediaUrl);
                                                                setSelectedMediaIsVideo(isVideoType);
                                                                setShowMediaModal(true);
                                                            }}
                                                            className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-white/80 px-2 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700/60 dark:bg-emerald-900/20 dark:text-emerald-200 dark:hover:bg-emerald-900/40"
                                                        >
                                                            <ExternalLink className="h-3.5 w-3.5" />
                                                            {t('log.table.open-media')}
                                                        </button>
                                                    )
                                                : null}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center space-x-2">
                                            <div className="p-2 bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/50 dark:to-orange-900/50 rounded-lg">
                                                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                                            </div>
                                            <span className="text-sm text-gray-600 dark:text-gray-300 max-w-xs truncate">
                                                {log.reason || '-'}
                                            </span>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-purple-50 dark:from-slate-700 dark:to-slate-600 border-t border-gray-200 dark:border-slate-600 flex items-center justify-between">
                <div className="text-sm text-gray-600 dark:text-gray-300 font-medium">
                    {t('log.pagination.showing', { count: _logs.length, total: totalDocs || _logs.length })}
                </div>
                <div className="flex items-center space-x-2">
                    <Button
                        variant="ghost"
                        disabled={page <= 1}
                        onClick={() => setPage(prev => Math.max(1, prev - 1))}
                        className="p-2 text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/50 rounded-xl transition-all duration-200 disabled:opacity-50"
                        aria-label="Previous page"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </Button>
                    {Array.from({ length: totalPages || 1 }, (_, i) => i + 1).map(p => (
                        <Button
                            key={p}
                            variant="ghost"
                            onClick={() => setPage(p)}
                            className={p === page
                                ? 'px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold shadow-lg'
                                : 'px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-purple-900/50 rounded-xl transition-all duration-200'}
                        >
                            {p}
                        </Button>
                    ))}
                    <Button
                        variant="ghost"
                        disabled={page >= (totalPages || 1)}
                        onClick={() => setPage(prev => Math.min(totalPages || 1, prev + 1))}
                        className="p-2 text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/50 rounded-xl transition-all duration-200 disabled:opacity-50"
                        aria-label="Next page"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </Button>
                </div>
            </div>

            {/* Modals */}
            <AnimatePresence>
                {showMediaModal
                    ? (
                            <div
                                className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                                onClick={() => setShowMediaModal(false)}
                            >
                                <div
                                    className="relative w-full max-w-5xl"
                                    onClick={e => e.stopPropagation()}
                                >
                                    <Button
                                        variant="ghost"
                                        onClick={() => setShowMediaModal(false)}
                                        className="absolute -top-12 right-0 text-white bg-black/50 hover:bg-black/70 rounded-full z-10"
                                    >
                                        <XCircle className="w-6 h-6" />
                                    </Button>
                                    {selectedMediaIsVideo
                                        ? (
                                                <iframe
                                                    src={selectedMediaUrl}
                                                    className="w-full h-[70vh] rounded-lg bg-black"
                                                    sandbox="allow-scripts allow-presentation"
                                                    allow="autoplay; fullscreen; picture-in-picture"
                                                    allowFullScreen
                                                    title="Video preview"
                                                />
                                            )
                                        : (
                                                <img
                                                    src={selectedMediaUrl}
                                                    alt="Full size view"
                                                    className="max-w-full max-h-[80vh] object-contain rounded-lg"
                                                />
                                            )}
                                </div>
                            </div>
                        )
                    : null}
            </AnimatePresence>
        </div>
    );
}
