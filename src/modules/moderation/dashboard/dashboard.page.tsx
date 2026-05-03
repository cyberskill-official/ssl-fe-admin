import { PDFDownloadLink } from '@react-pdf/renderer';
import { Activity, AlertTriangle, BrainCircuit, Calendar, Download, Flag, Image, Shield, Target, Trash2, UserCheck, Users, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router';

import { Button } from '#shared/component';
import { useTranslate } from '#shared/i18n';
import { usePortal } from '#shared/portal';
import { cn } from '#shared/util';

import type { I_ModerationAction } from './dashboard.type';

import { useModerationActionStats, useModerationDashboardStats, useMonthlyModerationReport, usePendingAgeVerificationCount, useRecentModerationActivities, useTotalModeratedCount } from './hooks/dashboard.hook';

export default function ModerationDashboard() {
    const { t } = useTranslate('moderation-dashboard');
    const { setHeader } = usePortal();
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState<string | null>(null);

    const { stats, loading: statsLoading } = useModerationDashboardStats();

    const { pendingCount: pendingAgeVerifications, loading: ageVerifyLoading } = usePendingAgeVerificationCount();
    const { totalCount: totalModerated, loading: totalModeratedLoading } = useTotalModeratedCount();
    const { activities: recentActivities, loading: activitiesLoading } = useRecentModerationActivities(4);

    const { report, loading: reportLoading, refetch: refetchReport } = useMonthlyModerationReport(
        selectedMonth,
        selectedYear,
    );

    const { actionStats, loading: statsActionLoading } = useModerationActionStats(
        selectedMonth,
        selectedYear,
    );

    useEffect(() => {
        setHeader({
            title: t('moderation-dashboard'),
            description: t('overview-moderation-activities'),
            icon: Shield,
        });
        return () => setHeader(null);
    }, [setHeader, t]);

    const legacyStats = {
        activeReports: 23,
    };

    const months = [
        t('january'),
        t('february'),
        t('march'),
        t('april'),
        t('may'),
        t('june'),
        t('july'),
        t('august'),
        t('september'),
        t('october'),
        t('november'),
        t('december'),
    ];

    const years = [2023, 2024, 2025];

    const _getActionColor = (action: I_ModerationAction['action']) =>
        cn(
            'px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full transition-all duration-200',
            action === 'approved' && 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
            action === 'rejected' && 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
            action === 'suspended' && 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
            action === 'deleted' && 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
            action === 'warned' && 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
            action === 'age_verified' && 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
            action === 'blocked' && 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
            'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
        );

    const _getContentTypeIcon = (contentType: I_ModerationAction['contentType']) => {
        switch (contentType) {
            case 'image':
                return <Image size={16} className="text-blue-500 dark:text-blue-400" />;
            case 'video':
                return <Image size={16} className="text-purple-500 dark:text-purple-400" />;
            case 'profile':
                return <Users size={16} className="text-emerald-500 dark:text-emerald-400" />;
            case 'age_verification':
                return <UserCheck size={16} className="text-blue-500 dark:text-blue-400" />;
            case 'report':
                return <Flag size={16} className="text-red-500 dark:text-red-400" />;
            default:
                return <Shield size={16} className="text-gray-500 dark:text-gray-400" />;
        }
    };

    const _handleDeleteAction = async () => {
        setShowDeleteConfirmModal(null);
        await refetchReport();
    };

    // Use report data from API
    const filteredActions = report.actions;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white transition-colors duration-300">
            <div className="p-6">
                {/* Live Status Indicator */}
                <div className="flex justify-end mb-6">
                    <div className="flex items-center px-4 py-2 rounded-full shadow-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                        <Activity className="w-5 h-5 mr-2 text-purple-500" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Live
                        </span>
                        <div className="ml-2 w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {/* Pending Content Card */}
                    <div className="group relative overflow-hidden rounded-2xl p-6 transition-all duration-300 hover:scale-105 hover:shadow-2xl bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/50 dark:to-red-900/50 border border-orange-200 dark:border-orange-700/50">
                        <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center">
                                    <div className="p-3 rounded-xl bg-orange-100 dark:bg-orange-500/20">
                                        <Image className="text-orange-600 dark:text-orange-400" size={28} />
                                    </div>
                                    <div className="ml-4">
                                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                            {t('pending-content')}
                                        </h3>
                                    </div>
                                </div>
                                <Link
                                    to="/moderation/media"
                                    className="text-sm font-medium transition-colors duration-200 text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300"
                                >
                                    {t('view-all')}
                                </Link>
                            </div>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium text-orange-600 dark:text-orange-300">
                                        {t('images')}
                                    </span>
                                    <span className="text-3xl font-bold text-gray-900 dark:text-white">
                                        {statsLoading ? '...' : stats.pendingImages}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium text-orange-600 dark:text-orange-300">
                                        {t('videos')}
                                    </span>
                                    <span className="text-3xl font-bold text-gray-900 dark:text-white">
                                        {statsLoading ? '...' : stats.pendingVideos}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Active Reports Card */}
                    <div className="group relative overflow-hidden rounded-2xl p-6 transition-all duration-300 hover:scale-105 hover:shadow-2xl bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/50 dark:to-pink-900/50 border border-red-200 dark:border-red-700/50">
                        <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center">
                                    <div className="p-3 rounded-xl bg-red-100 dark:bg-red-500/20">
                                        <Flag className="text-red-600 dark:text-red-400" size={28} />
                                    </div>
                                    <div className="ml-4">
                                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                            {t('active-reports')}
                                        </h3>
                                    </div>
                                </div>
                                <Link
                                    to="/moderation/report"
                                    className="text-sm font-medium transition-colors duration-200 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                                >
                                    {t('view-all')}
                                </Link>
                            </div>
                            <div className="space-y-4">
                                <div className="flex items-baseline justify-between">
                                    <span className="text-sm font-medium text-red-600 dark:text-red-300">
                                        {t('requiring-attention')}
                                    </span>
                                    <span className="text-3xl font-bold text-gray-900 dark:text-white">
                                        {legacyStats.activeReports}
                                    </span>
                                </div>
                                <div className="text-sm font-medium text-red-600 dark:text-red-300">
                                    {t('high-priority', { count: Math.round(legacyStats.activeReports * 0.4) })}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* AI Performance Card */}
                    <div className="group relative overflow-hidden rounded-2xl p-6 transition-all duration-300 hover:scale-105 hover:shadow-2xl bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/50 dark:to-indigo-900/50 border border-purple-200 dark:border-purple-700/50">
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center">
                                    <div className="p-3 rounded-xl bg-purple-100 dark:bg-purple-500/20">
                                        <BrainCircuit className="text-purple-600 dark:text-purple-400" size={28} />
                                    </div>
                                    <div className="ml-4">
                                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                            {t('ai-performance')}
                                        </h3>
                                    </div>
                                </div>
                                <Link
                                    to="/moderation/ai"
                                    className="text-sm font-medium transition-colors duration-200 text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
                                >
                                    {t('settings')}
                                </Link>
                            </div>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium text-purple-600 dark:text-purple-300">
                                        {t('accuracy')}
                                    </span>
                                    <span className="text-3xl font-bold text-gray-900 dark:text-white">
                                        {statsLoading ? '...' : stats.aiAccuracy}
                                        %
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium text-purple-600 dark:text-purple-300">
                                        {t('keywords')}
                                    </span>
                                    <span className="text-3xl font-bold text-gray-900 dark:text-white">
                                        {statsLoading ? '...' : stats.flaggedKeywords}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Age Verification Card */}
                    <div className="group relative overflow-hidden rounded-2xl p-6 transition-all duration-300 hover:scale-105 hover:shadow-2xl bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/50 dark:to-cyan-900/50 border border-blue-200 dark:border-blue-700/50">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center">
                                    <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-500/20">
                                        <UserCheck className="text-blue-600 dark:text-blue-400" size={28} />
                                    </div>
                                    <div className="ml-4">
                                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                            {t('age-verification')}
                                        </h3>
                                    </div>
                                </div>
                                <Link
                                    to="/moderation/age-verification"
                                    className="text-sm font-medium transition-colors duration-200 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                                >
                                    {t('review')}
                                </Link>
                            </div>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium text-blue-600 dark:text-blue-300">
                                        {t('pending')}
                                    </span>
                                    <span className="text-3xl font-bold text-gray-900 dark:text-white">
                                        {ageVerifyLoading ? '...' : pendingAgeVerifications}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium text-blue-600 dark:text-blue-300">
                                        {t('total-moderated')}
                                    </span>
                                    <span className="text-3xl font-bold text-gray-900 dark:text-white">
                                        {totalModeratedLoading ? '...' : totalModerated.toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recent Activity Section */}
                <div className="rounded-2xl shadow-xl mb-8 overflow-hidden bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                    <div className="p-8">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                {t('recent-activity')}
                            </h2>
                            <div className="flex items-center space-x-2">
                                <Zap className="w-5 h-5 text-yellow-500" />
                                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                                    Real-time updates
                                </span>
                            </div>
                        </div>
                        <div className="space-y-4">
                            {activitiesLoading
                                ? (
                                        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                            {t('loading')}
                                            ...
                                        </div>
                                    )
                                : recentActivities.length === 0
                                    ? (
                                            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                                {t('no-recent-activities')}
                                            </div>
                                        )
                                    : (
                                            recentActivities.map((activity: any, index: number) => (
                                                <div
                                                    key={activity.id}
                                                    className="flex items-start space-x-4 p-6 rounded-xl transition-all duration-200 hover:scale-[1.02] bg-gray-50 hover:bg-gray-100 dark:bg-gray-700/50 dark:hover:bg-gray-700"
                                                    style={{ animationDelay: `${index * 100}ms` }}
                                                >
                                                    <div className={cn(
                                                        'p-3 rounded-full',
                                                        activity.type === 'image' && 'bg-blue-100 dark:bg-blue-500/20',
                                                        activity.type === 'video' && 'bg-purple-100 dark:bg-purple-500/20',
                                                        activity.type === 'user' && 'bg-purple-100 dark:bg-purple-500/20',
                                                        activity.type === 'report' && 'bg-red-100 dark:bg-red-500/20',
                                                        activity.type === 'age_verification' && 'bg-emerald-100 dark:bg-emerald-500/20',
                                                    )}
                                                    >
                                                        {activity.type === 'image' && <Image className="text-blue-500 dark:text-blue-400" size={20} />}
                                                        {activity.type === 'video' && <Image className="text-purple-500 dark:text-purple-400" size={20} />}
                                                        {activity.type === 'user' && <Users className="text-purple-500 dark:text-purple-400" size={20} />}
                                                        {activity.type === 'report' && <Flag className="text-red-500 dark:text-red-400" size={20} />}
                                                        {activity.type === 'age_verification' && <UserCheck className="text-emerald-500 dark:text-emerald-400" size={20} />}
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                                                {activity.username}
                                                                {' - '}
                                                                {activity.action}
                                                            </span>
                                                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                                                {new Date(activity.timestamp).toLocaleTimeString()}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm mt-1 text-gray-500 dark:text-gray-300">
                                                            {activity.reason || t('no-reason-provided')}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                        </div>
                    </div>
                </div>

                {/* Quick Actions Section */}
                <div className="rounded-2xl shadow-xl mb-8 overflow-hidden bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                    <div className="p-8">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                {t('quick-actions')}
                            </h2>
                            <Target className="w-6 h-6 text-purple-500" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {[
                                {
                                    to: '/age-verification',
                                    icon: UserCheck,
                                    title: t('age-verification'),
                                    description: t('review-pending-verifications'),
                                    color: 'purple',
                                },
                                {
                                    to: '/moderation-pictures',
                                    icon: Image,
                                    title: t('content-review'),
                                    description: t('review-pending-content'),
                                    color: 'blue',
                                },
                                {
                                    to: '/moderation-reports',
                                    icon: AlertTriangle,
                                    title: t('reports'),
                                    description: t('handle-user-reports'),
                                    color: 'red',
                                },
                                {
                                    to: '/moderation-ai',
                                    icon: Shield,
                                    title: t('ai-settings'),
                                    description: t('configure-ai-moderation'),
                                    color: 'emerald',
                                },
                            ].map((action, index) => (
                                <Link
                                    key={action.title}
                                    to={action.to}
                                    className="group relative overflow-hidden p-6 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-xl bg-gray-50 hover:bg-gray-100 dark:bg-gray-700/50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600"
                                    style={{ animationDelay: `${index * 100}ms` }}
                                >
                                    <div className="flex items-center">
                                        <div className={cn(
                                            'p-3 rounded-xl mr-4 transition-all duration-300 group-hover:scale-110',
                                            action.color === 'purple' && 'bg-purple-100 dark:bg-purple-500/20',
                                            action.color === 'blue' && 'bg-blue-100 dark:bg-blue-500/20',
                                            action.color === 'red' && 'bg-red-100 dark:bg-red-500/20',
                                            action.color === 'emerald' && 'bg-emerald-100 dark:bg-emerald-500/20',
                                        )}
                                        >
                                            <action.icon
                                                className={cn(
                                                    'transition-colors duration-300',
                                                    action.color === 'purple' && 'text-purple-600 dark:text-purple-400',
                                                    action.color === 'blue' && 'text-blue-600 dark:text-blue-400',
                                                    action.color === 'red' && 'text-red-600 dark:text-red-400',
                                                    action.color === 'emerald' && 'text-emerald-600 dark:text-emerald-400',
                                                )}
                                                size={24}
                                            />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold transition-colors duration-200 text-gray-900 dark:text-white">
                                                {action.title}
                                            </h3>
                                            <p className="text-sm transition-colors duration-200 text-gray-500 dark:text-gray-300">
                                                {action.description}
                                            </p>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Monthly Report Section */}
                <div className="rounded-2xl shadow-xl overflow-hidden bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                    <div className="p-8">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                {t('monthly-moderation-report')}
                            </h2>
                            <div className="flex items-center space-x-4">
                                <div className="flex items-center space-x-2">
                                    <Calendar
                                        size={20}
                                        className="text-gray-500 dark:text-gray-400"
                                    />
                                    <select
                                        value={selectedMonth}
                                        onChange={e => setSelectedMonth(Number(e.target.value))}
                                        className="px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                                    >
                                        {months.map((month, index) => (
                                            <option key={month} value={index}>{month}</option>
                                        ))}
                                    </select>
                                    <select
                                        value={selectedYear}
                                        onChange={e => setSelectedYear(Number(e.target.value))}
                                        className="px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                                    >
                                        {years.map(year => (
                                            <option key={year} value={year}>{year}</option>
                                        ))}
                                    </select>
                                </div>
                                <PDFDownloadLink
                                    document={<div>{t('moderation-report-placeholder')}</div>}
                                    fileName={`${t('moderation-report')}-${months[selectedMonth]?.toLowerCase() ?? ''}-${selectedYear}.pdf`}
                                    className="flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                                >
                                    <Download size={18} className="mr-2" />
                                    {t('download-report')}
                                </PDFDownloadLink>
                            </div>
                        </div>

                        {/* Summary Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
                            {[
                                { label: t('total-actions'), value: statsActionLoading ? '...' : actionStats.total, color: 'gray' },
                                { label: t('approved'), value: statsActionLoading ? '...' : actionStats.approved, color: 'emerald' },
                                { label: t('rejected'), value: statsActionLoading ? '...' : actionStats.rejected, color: 'red' },
                                { label: t('suspended'), value: statsActionLoading ? '...' : actionStats.suspended, color: 'amber' },
                                { label: t('warned'), value: statsActionLoading ? '...' : actionStats.warned, color: 'yellow' },
                                { label: t('deleted'), value: statsActionLoading ? '...' : actionStats.deleted, color: 'red' },
                                { label: t('blocked'), value: statsActionLoading ? '...' : actionStats.blocked, color: 'gray' },
                            ].map((stat, index) => (
                                <div
                                    key={stat.label}
                                    className={cn(
                                        'p-4 rounded-xl transition-all duration-200 hover:scale-105',
                                        stat.color === 'gray' && 'bg-gray-50 dark:bg-gray-700/50',
                                        stat.color === 'emerald' && 'bg-emerald-50 dark:bg-emerald-900/30',
                                        stat.color === 'red' && 'bg-red-50 dark:bg-red-900/30',
                                        stat.color === 'amber' && 'bg-amber-50 dark:bg-amber-900/30',
                                        stat.color === 'yellow' && 'bg-yellow-50 dark:bg-yellow-900/30',
                                        stat.color === 'blue' && 'bg-blue-50 dark:bg-blue-900/30',
                                    )}
                                    style={{ animationDelay: `${index * 50}ms` }}
                                >
                                    <div className="text-2xl font-bold text-center text-gray-900 dark:text-white">
                                        {stat.value}
                                    </div>
                                    <div className={cn(
                                        'text-sm text-center mt-1',
                                        stat.color === 'gray' && 'text-gray-500 dark:text-gray-300',
                                        stat.color === 'emerald' && 'text-emerald-600 dark:text-emerald-300',
                                        stat.color === 'red' && 'text-red-600 dark:text-red-300',
                                        stat.color === 'amber' && 'text-amber-600 dark:text-amber-300',
                                        stat.color === 'yellow' && 'text-yellow-600 dark:text-yellow-300',
                                        stat.color === 'blue' && 'text-blue-600 dark:text-blue-300',
                                    )}
                                    >
                                        {stat.label}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Actions Table */}
                        <div className="overflow-x-auto">
                            {reportLoading
                                ? (
                                        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                                            <div className="text-lg font-medium">
                                                {t('loading')}
                                                ...
                                            </div>
                                        </div>
                                    )
                                : (
                                        <table className="w-full">
                                            <thead>
                                                <tr className="bg-gray-50 dark:bg-gray-700/50">
                                                    {[t('date-time'), t('profile-name'), t('action'), t('content-type'), t('moderator'), t('reason'), t('actions')].map(
                                                        header => (
                                                            <th
                                                                key={header}
                                                                className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-300"
                                                            >
                                                                {header}
                                                            </th>
                                                        ),
                                                    )}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                                {filteredActions.map((action: I_ModerationAction, index: number) => (
                                                    <tr
                                                        key={action.id}
                                                        className="transition-all duration-200 hover:scale-[1.01] hover:bg-gray-50 dark:hover:bg-gray-700/50"
                                                        style={{ animationDelay: `${index * 50}ms` }}
                                                    >
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                                {new Date(action.date).toLocaleDateString()}
                                                            </div>
                                                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                                                {action.time}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                                                {action.profileName}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <span className={_getActionColor(action.action)}>
                                                                {t(`${action.action}`)}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="flex items-center">
                                                                {_getContentTypeIcon(action.contentType)}
                                                                <span className="ml-2 text-sm font-medium capitalize text-gray-900 dark:text-white">
                                                                    {t(action.contentType.replace('_', '-'))}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <span className="text-sm text-gray-900 dark:text-white">
                                                                {action.moderator}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="text-sm max-w-xs truncate text-gray-500 dark:text-gray-300">
                                                                {action.reason || '-'}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                                            <Button
                                                                variant="ghost"
                                                                onClick={() => setShowDeleteConfirmModal(action.id)}
                                                                className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 transition-colors duration-200"
                                                                title={t('delete-entry')}
                                                            >
                                                                <Trash2 size={18} />
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                        </div>

                        {filteredActions.length === 0 && (
                            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                                <div className="text-6xl mb-4">📊</div>
                                <p className="text-lg font-medium">
                                    {t('no-moderation-actions', { month: months[selectedMonth], year: selectedYear })}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Delete Confirmation Modal */}
                {showDeleteConfirmModal && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                        <div className="rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                            <div className="flex items-center text-red-600 dark:text-red-400 mb-6">
                                <div className="p-3 rounded-full bg-red-100 dark:bg-red-900/30 mr-4">
                                    <AlertTriangle size={24} />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                    {t('delete-moderation-entry')}
                                </h3>
                            </div>
                            <p className="mb-8 text-gray-500 dark:text-gray-300">
                                {t('confirm-delete-entry')}
                            </p>
                            <div className="flex justify-end space-x-4">
                                <Button
                                    onClick={() => setShowDeleteConfirmModal(null)}
                                    variant="ghost"
                                    className="px-6 py-2 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                                >
                                    {t('cancel')}
                                </Button>
                                <Button
                                    variant="ghost"
                                    onClick={_handleDeleteAction}
                                    className="px-6 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-200 shadow-lg"
                                >
                                    {t('delete-entry')}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
