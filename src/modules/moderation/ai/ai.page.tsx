import { Activity, AlertTriangle, Brain, CheckCircle, Clock, Download, ExternalLink, Eye, RefreshCw, Search, Settings, Shield, TrendingUp, UserX, X, XCircle } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { Button } from '#shared/component';
import { useTranslate } from '#shared/i18n';
import { usePortal } from '#shared/portal';
import { cn } from '#shared/util';

import type { I_AISettings, I_ContentScan } from './ai.type';

import { useAIModerationWithLogging, useGetModerationLogs } from './ai.hook';

const ROOM_HASH_RE = /#(\w+)/;
const CAMEL_TO_KEBAB_RE = /([A-Z])/g;

export default function AIPage() {
    const { t } = useTranslate('moderation');
    const { setHeader } = usePortal();
    const [showSettings, setShowSettings] = useState(false);
    const [showSuspendUserModal, setShowSuspendUserModal] = useState(false);
    const [userToSuspend, setUserToSuspend] = useState<{ id: string; name: string } | null>(null);
    const [suspendReason, setSuspendReason] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState<'scans' | 'logs'>('scans');
    const [page, setPage] = useState(1);
    const [limit] = useState(20);

    const aiModerationWithLogging = useAIModerationWithLogging();

    // Fetch moderation logs from API
    const logsOptions = useMemo(() => ({
        page,
        limit,
        sort: { createdAt: -1 },
        populate: ['user', 'moderationMedia', 'message'],
    }), [page, limit]);

    const {
        logs: moderationLogs,
        totalDocs,
        totalPages,
        hasNextPage,
        hasPrevPage,
        loading: logsLoading,
        refetch: refetchLogs,
    } = useGetModerationLogs(undefined, logsOptions, activeTab !== 'logs');

    const [settings, setSettings] = useState<I_AISettings>({
        enabled: true,
        confidence: 0.8,
        autoReject: false,
        categories: { adult: true, violence: true, hate: true, selfHarm: true, sexualContent: true, drugs: true },
    });

    const [scans] = useState<I_ContentScan[]>(() => [
        {
            id: 1,
            type: 'image',
            content: 'profile_pic_123.jpg',
            timestamp: '2025-01-15T14:30:00',
            confidence: 0.92,
            category: 'adult',
            action: 'flagged',
            aiDecision: t('ai.high-confidence-adult-content'),
            userId: 'user123',
            userName: 'John Doe',
        },
        {
            id: 2,
            type: 'text',
            content: 'Message in chat room #general',
            timestamp: '2025-01-15T14:15:00',
            confidence: 0.85,
            category: 'hate',
            action: 'rejected',
            aiDecision: t('ai.detected-hate-speech'),
            userId: 'user456',
            userName: 'Jane Smith',
        },
        {
            id: 3,
            type: 'image',
            content: 'upload_789.png',
            timestamp: '2025-01-15T13:45:00',
            confidence: 0.78,
            category: 'violence',
            action: 'approved',
            aiDecision: 'Content reviewed and approved',
            userId: 'user789',
            userName: 'Mike Johnson',
        },
        {
            id: 4,
            type: 'text',
            content: 'Forum post in #discussion',
            timestamp: '2025-01-15T13:20:00',
            confidence: 0.95,
            category: 'drugs',
            action: 'rejected',
            aiDecision: 'High confidence drug-related content detected',
            userId: 'user101',
            userName: 'Alice Brown',
        },
    ]);

    // Set portal header
    useEffect(() => {
        setHeader({
            title: t('ai.ai-content-screening'),
            description: t('ai.automated-content-moderation'),
            icon: Brain,
        });
        return () => setHeader(null);
    }, [setHeader, t]);

    const _handleSuspend = (reason: string) => {
        if (userToSuspend && reason.trim()) {
            setShowSuspendUserModal(false);
            setUserToSuspend(null);
            setSuspendReason('');
        }
    };

    const _handleRefresh = async () => {
        setIsRefreshing(true);
        await refetchLogs();
        setTimeout(setIsRefreshing, 1000, false);
    };

    const _handleTestAIModeration = async () => {
        const testResult = await aiModerationWithLogging.moderateWithLogging(
            'text',
            'This is a test message for AI moderation',
            'test-user-123',
            'test-media-456',
        );

        if (testResult) {
            await refetchLogs();
        }
    };

    const navigateToIssue = (scan: I_ContentScan) => {
        // Navigate to the specific location of the content based on type and context
        const baseUrl = window.location.origin;
        let targetUrl = '';

        switch (scan.type) {
            case 'image':
                if (scan.content.includes('profile_pic')) {
                    // Navigate to user profile
                    targetUrl = `${baseUrl}/user/${scan.userId}?tab=profile`;
                }
                else if (scan.content.includes('upload')) {
                    // Navigate to media gallery or specific upload
                    targetUrl = `${baseUrl}/media/${scan.content}`;
                }
                else {
                    // Navigate to general media section
                    targetUrl = `${baseUrl}/media?search=${encodeURIComponent(scan.content)}`;
                }
                break;

            case 'text':
                if (scan.content.includes('chat room')) {
                    // Extract room name and navigate to chat
                    const roomMatch = scan.content.match(ROOM_HASH_RE);
                    const roomName = roomMatch ? roomMatch[1] : 'general';
                    targetUrl = `${baseUrl}/chat/${roomName}?highlight=${scan.id}`;
                }
                else if (scan.content.includes('Forum post')) {
                    // Navigate to forum post
                    targetUrl = `${baseUrl}/forum?post=${scan.id}`;
                }
                else {
                    // Navigate to user's messages
                    targetUrl = `${baseUrl}/messages?user=${scan.userId}&highlight=${scan.id}`;
                }
                break;

            default:
                // Fallback to user profile
                targetUrl = `${baseUrl}/user/${scan.userId}`;
        }

        // Open in new tab to preserve moderation context
        window.open(targetUrl, '_blank', 'noopener,noreferrer');
    };

    const _getActionColor = (action: I_ContentScan['action']) =>
        cn(
            'px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full',
            action === 'flagged' && 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200',
            action === 'approved' && 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200',
            action === 'rejected' && 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200',
            !['flagged', 'approved', 'rejected'].includes(action) && 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200',
        );

    const _getCategoryColor = (category: string) =>
        cn(
            'px-2 py-1 text-xs font-medium rounded-full',
            category === 'adult' && 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
            category === 'violence' && 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300',
            category === 'hate' && 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
            category === 'selfHarm' && 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300',
            category === 'sexualContent' && 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300',
            category === 'drugs' && 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
        );

    const filteredScans = scans.filter((scan) => {
        const matchesSearch = scan.content.toLowerCase().includes(searchQuery.toLowerCase())
            || scan.userName?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || scan.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const stats = [
        {
            title: 'Total Scans',
            value: scans.length,
            change: '+12.5%',
            icon: Eye,
            color: 'text-blue-600 dark:text-blue-400',
            bgColor: 'bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20',
            borderColor: 'border-blue-200 dark:border-blue-700',
        },
        {
            title: 'Flagged Content',
            value: scans.filter(s => s.action === 'flagged').length,
            change: '+8.2%',
            icon: AlertTriangle,
            color: 'text-yellow-600 dark:text-yellow-400',
            bgColor: 'bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20',
            borderColor: 'border-yellow-200 dark:border-yellow-700',
        },
        {
            title: 'Rejected Content',
            value: scans.filter(s => s.action === 'rejected').length,
            change: '+15.7%',
            icon: XCircle,
            color: 'text-red-600 dark:text-red-400',
            bgColor: 'bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20',
            borderColor: 'border-red-200 dark:border-red-700',
        },
        {
            title: 'Avg Confidence',
            value: `${Math.round(scans.reduce((acc, scan) => acc + scan.confidence, 0) / scans.length * 100)}%`,
            change: '+2.1%',
            icon: TrendingUp,
            color: 'text-green-600 dark:text-green-400',
            bgColor: 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20',
            borderColor: 'border-green-200 dark:border-green-700',
        },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-6 space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, index) => (
                    <div
                        key={stat.title}
                        className={cn(
                            'transform hover:scale-105 transition-all duration-300 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-xl border p-6',
                            stat.borderColor,
                        )}
                        style={{ animationDelay: `${index * 100}ms` }}
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.title}</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">{stat.value}</p>
                                <div className="flex items-center mt-2">
                                    <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                                    <span className="text-sm text-green-600 dark:text-green-400">{stat.change}</span>
                                </div>
                            </div>
                            <div className={cn('p-3 rounded-xl', stat.bgColor)}>
                                <stat.icon className={cn('w-6 h-6', stat.color)} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* AI Moderation Tester - Comment out for now until component is fixed */}
            {/* <AIModerationTester /> */}

            {/* Main Content */}
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 dark:border-slate-700/20">
                {/* Header */}
                <div className="p-6 border-b border-white/20 dark:border-slate-700/20">
                    <div className="flex items-center justify-end mb-6">
                        <div className="flex items-center space-x-3">
                            {/* Tab Navigation */}
                            <div className="flex rounded-xl bg-gray-100 dark:bg-gray-800 p-1 mr-4">
                                <Button
                                    variant={activeTab === 'scans' ? 'default' : 'ghost'}
                                    onClick={() => setActiveTab('scans')}
                                    className="px-4 py-2 text-sm rounded-lg"
                                >
                                    {t('ai.content-scans')}
                                </Button>
                                <Button
                                    variant={activeTab === 'logs' ? 'default' : 'ghost'}
                                    onClick={() => setActiveTab('logs')}
                                    className="px-4 py-2 text-sm rounded-lg"
                                >
                                    {t('ai.moderation-logs')}
                                </Button>
                            </div>

                            <Button
                                variant="outline"
                                onClick={_handleTestAIModeration}
                                disabled={aiModerationWithLogging.loading}
                                className="flex items-center whitespace-nowrap px-4 py-2 border-2 border-green-200 dark:border-green-700 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/50 rounded-xl transition-all duration-300"
                            >
                                <Brain className="w-4 h-4 mr-2" />
                                {t('ai.test-ai-moderation')}
                            </Button>
                            <Button
                                variant="outline"
                                onClick={_handleRefresh}
                                disabled={isRefreshing}
                                className="flex items-center whitespace-nowrap px-4 py-2 border-2 border-purple-200 dark:border-purple-700 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/50 rounded-xl transition-all duration-300"
                            >
                                <RefreshCw className={cn('w-4 h-4 mr-2', isRefreshing && 'animate-spin')} />
                                Refresh
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => setShowSettings(true)}
                                className="flex items-center whitespace-nowrap px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                            >
                                <Settings className="w-4 h-4 mr-2" />
                                {t('ai.ai-settings')}
                            </Button>
                        </div>
                    </div>

                    {/* AI Status Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-4 border border-green-200 dark:border-green-700">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <div className="p-2 bg-green-600 rounded-lg mr-3">
                                        <Activity className="text-white" size={20} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-green-800 dark:text-green-200">{t('ai.ai-status')}</h3>
                                        <p className="text-sm text-green-600 dark:text-green-400">{t('ai.processing-real-time')}</p>
                                    </div>
                                </div>
                                <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 text-xs font-medium rounded-full">
                                    {t('ai.active')}
                                </span>
                            </div>
                        </div>
                        <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-4 border border-purple-200 dark:border-purple-700">
                            <h3 className="text-lg font-semibold text-purple-800 dark:text-purple-200 mb-2">{t('ai.confidence-threshold')}</h3>
                            <div className="flex items-center">
                                <div className="flex-1 bg-purple-200 dark:bg-purple-700 rounded-full h-3 mr-3">
                                    <div
                                        className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-full h-3 transition-all duration-1000"
                                        style={{ width: `${settings.confidence * 100}%` }}
                                    />
                                </div>
                                <span className="text-sm font-bold text-purple-800 dark:text-purple-200">
                                    {Math.round(settings.confidence * 100)}
                                    %
                                </span>
                            </div>
                        </div>
                        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-700">
                            <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-2">{t('ai.auto-rejection')}</h3>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-blue-600 dark:text-blue-400">
                                    {settings.autoReject ? t('ai.enabled') : t('ai.disabled')}
                                </span>
                                <Button
                                    variant="ghost"
                                    onClick={() => setSettings(s => ({ ...s, autoReject: !s.autoReject }))}
                                    className={cn(
                                        'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                                        settings.autoReject ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700',
                                    )}
                                >
                                    <span
                                        className={cn(
                                            'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                                            settings.autoReject ? 'translate-x-6' : 'translate-x-1',
                                        )}
                                    />
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Search and Filters */}
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder={t('ai.search-content-users')}
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                        </div>
                        <select
                            value={selectedCategory}
                            onChange={e => setSelectedCategory(e.target.value)}
                            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                            <option value="all">{t('ai.all-categories')}</option>
                            <option value="adult">{t('ai.adult')}</option>
                            <option value="violence">{t('ai.violence')}</option>
                            <option value="hate">{t('ai.hate')}</option>
                            <option value="selfHarm">{t('ai.self-harm')}</option>
                            <option value="sexualContent">{t('ai.sexual-content')}</option>
                            <option value="drugs">{t('ai.drugs')}</option>
                        </select>
                        <Button
                            variant="outline"
                            className="px-4 py-2 border-2 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-all duration-300"
                        >
                            <Download className="w-4 h-4 mr-2" />
                            {t('ai.export')}
                        </Button>
                    </div>
                </div>

                {/* Tab Content */}
                {activeTab === 'scans' && (
                    <>
                        {/* Content Table */}
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 dark:bg-gray-800/50">
                                    <tr>
                                        {[
                                            t('ai.timestamp'),
                                            t('ai.content-type'),
                                            t('ai.user'),
                                            t('ai.content'),
                                            t('ai.category'),
                                            t('ai.confidence'),
                                            t('ai.action'),
                                            t('ai.ai-decision'),
                                            t('ai.actions'),
                                        ].map(header => (
                                            <th
                                                key={header}
                                                className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider"
                                            >
                                                {header}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-800/50 divide-y divide-gray-200 dark:divide-gray-700">
                                    {filteredScans.map(scan => (
                                        <tr key={scan.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                                <div className="flex items-center">
                                                    <Clock className="w-4 h-4 text-gray-400 mr-2" />
                                                    {new Date(scan.timestamp).toLocaleString()}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span
                                                    className={cn(
                                                        'px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full',
                                                        scan.type === 'image'
                                                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200'
                                                            : 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200',
                                                    )}
                                                >
                                                    {t(`ai.${scan.type}`)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                                {scan.userName || t('ai.anonymous')}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100 max-w-xs truncate">
                                                {scan.content}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={_getCategoryColor(scan.category)}>
                                                    {t(`ai.${scan.category}`)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mr-3">
                                                        <div
                                                            className={cn(
                                                                'rounded-full h-2 transition-all duration-1000',
                                                                scan.confidence > 0.8
                                                                    ? 'bg-red-600'
                                                                    : scan.confidence > 0.6
                                                                        ? 'bg-yellow-600'
                                                                        : 'bg-green-600',
                                                            )}
                                                            style={{ width: `${scan.confidence * 100}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                        {Math.round(scan.confidence * 100)}
                                                        %
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={_getActionColor(scan.action)}>
                                                    {t(`ai.${scan.action}`)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400 max-w-xs">
                                                {scan.aiDecision}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex items-center space-x-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => navigateToIssue(scan)}
                                                        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
                                                        title="Go to issue location"
                                                    >
                                                        <ExternalLink size={16} />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200"
                                                    >
                                                        <CheckCircle size={16} />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => {
                                                            setUserToSuspend({ id: scan.userId || `${scan.id}`, name: scan.userName || scan.content });
                                                            setShowSuspendUserModal(true);
                                                        }}
                                                        className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
                                                    >
                                                        <UserX size={16} />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {filteredScans.length === 0 && (
                            <div className="text-center py-12">
                                <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">{t('ai.no-content-found')}</h3>
                                <p className="text-gray-500 dark:text-gray-400">{t('ai.try-adjusting-search')}</p>
                            </div>
                        )}
                    </>
                )}

                {/* Moderation Logs Tab */}
                {activeTab === 'logs' && (
                    <>
                        {logsLoading
                            ? (
                                    <div className="flex items-center justify-center py-12">
                                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                                    </div>
                                )
                            : (
                                    <>
                                        <div className="overflow-x-auto">
                                            <table className="w-full">
                                                <thead className="bg-gray-50 dark:bg-gray-800/50">
                                                    <tr>
                                                        {[
                                                            'Timestamp',
                                                            'Action',
                                                            'User',
                                                            'Media',
                                                            'Risk Level',
                                                            'Confidence',
                                                            'Reason',
                                                            'AI Decision',
                                                        ].map(header => (
                                                            <th
                                                                key={header}
                                                                className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider"
                                                            >
                                                                {header}
                                                            </th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white dark:bg-gray-800/50 divide-y divide-gray-200 dark:divide-gray-700">
                                                    {moderationLogs.map(log => (
                                                        <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                                                <div className="flex items-center">
                                                                    <Clock className="w-4 h-4 text-gray-400 mr-2" />
                                                                    {new Date(log.createdAt).toLocaleString()}
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <span
                                                                    className={cn(
                                                                        'px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full',
                                                                        log.action === 'APPROVE'
                                                                            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                                                                            : log.action === 'DELETE'
                                                                                ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
                                                                                : log.action === 'WARN'
                                                                                    ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200'
                                                                                    : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200',
                                                                    )}
                                                                >
                                                                    {log.action}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                                                {log.user?.username || 'N/A'}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                                                {log.moderationMedia?.type || log.message?.content
                                                                    ? (
                                                                            <span className="flex items-center">
                                                                                {log.moderationMedia?.type && (
                                                                                    <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 text-xs rounded-full">
                                                                                        {log.moderationMedia.type}
                                                                                    </span>
                                                                                )}
                                                                                {log.message && (
                                                                                    <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 text-xs rounded-full">
                                                                                        Message
                                                                                    </span>
                                                                                )}
                                                                            </span>
                                                                        )
                                                                    : (
                                                                            'N/A'
                                                                        )}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                {log.aiResult?.riskLevel
                                                                    ? (
                                                                            <span
                                                                                className={cn(
                                                                                    'px-2 py-1 text-xs font-medium rounded-full',
                                                                                    log.aiResult.riskLevel === 'CRITICAL'
                                                                                        ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                                                                                        : log.aiResult.riskLevel === 'HIGH'
                                                                                            ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
                                                                                            : log.aiResult.riskLevel === 'MEDIUM'
                                                                                                ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                                                                                                : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
                                                                                )}
                                                                            >
                                                                                {log.aiResult.riskLevel}
                                                                            </span>
                                                                        )
                                                                    : (
                                                                            <span className="text-gray-400">N/A</span>
                                                                        )}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                {log.aiResult?.confidence
                                                                    ? (
                                                                            <div className="flex items-center">
                                                                                <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mr-3">
                                                                                    <div
                                                                                        className={cn(
                                                                                            'rounded-full h-2 transition-all',
                                                                                            log.aiResult.confidence > 0.8
                                                                                                ? 'bg-gradient-to-r from-red-600 to-red-500'
                                                                                                : log.aiResult.confidence > 0.6
                                                                                                    ? 'bg-gradient-to-r from-yellow-600 to-yellow-500'
                                                                                                    : 'bg-gradient-to-r from-green-600 to-green-500',
                                                                                        )}
                                                                                        style={{ width: `${log.aiResult.confidence * 100}%` }}
                                                                                    />
                                                                                </div>
                                                                                <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                                                                                    {Math.round(log.aiResult.confidence * 100)}
                                                                                    %
                                                                                </span>
                                                                            </div>
                                                                        )
                                                                    : (
                                                                            <span className="text-gray-400">N/A</span>
                                                                        )}
                                                            </td>
                                                            <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100 max-w-xs truncate">
                                                                {log.reason || log.aiResult?.reasons?.join(', ') || 'N/A'}
                                                            </td>
                                                            <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                                                                {log.aiResult?.decision || 'N/A'}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>

                                        {moderationLogs.length === 0 && (
                                            <div className="text-center py-12">
                                                <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No moderation logs found</h3>
                                                <p className="text-gray-500 dark:text-gray-400">AI moderation logs will appear here</p>
                                            </div>
                                        )}

                                        {/* Pagination */}
                                        {totalPages > 1 && (
                                            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                                                <div className="text-sm text-gray-700 dark:text-gray-300">
                                                    Showing
                                                    {' '}
                                                    <span className="font-medium">{(page - 1) * limit + 1}</span>
                                                    {' '}
                                                    to
                                                    {' '}
                                                    <span className="font-medium">{Math.min(page * limit, totalDocs)}</span>
                                                    {' '}
                                                    of
                                                    {' '}
                                                    <span className="font-medium">{totalDocs}</span>
                                                    {' '}
                                                    results
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button
                                                        onClick={() => setPage(p => p - 1)}
                                                        disabled={!hasPrevPage}
                                                        className="px-4 py-2 text-sm"
                                                    >
                                                        Previous
                                                    </Button>
                                                    <Button
                                                        onClick={() => setPage(p => p + 1)}
                                                        disabled={!hasNextPage}
                                                        className="px-4 py-2 text-sm"
                                                    >
                                                        Next
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                    </>
                )}
            </div>

            {/* Settings Modal */}
            {showSettings && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center space-x-3">
                                <div className="p-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl">
                                    <Settings className="w-6 h-6 text-white" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">{t('ai.ai-screening-settings')}</h3>
                            </div>
                            <Button
                                variant="ghost"
                                onClick={() => setShowSettings(false)}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                                <X size={20} />
                            </Button>
                        </div>

                        <div className="space-y-8">
                            {/* General Settings */}
                            <div>
                                <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">{t('ai.general-settings')}</h4>
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                                        <div>
                                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('ai.enable-ai-screening')}</span>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('ai.enable-ai-screening-description')}</p>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            onClick={() => setSettings(s => ({ ...s, enabled: !s.enabled }))}
                                            className={cn(
                                                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                                                settings.enabled ? 'bg-purple-600' : 'bg-gray-200 dark:bg-gray-700',
                                            )}
                                        >
                                            <span
                                                className={cn(
                                                    'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                                                    settings.enabled ? 'translate-x-6' : 'translate-x-1',
                                                )}
                                            />
                                        </Button>
                                    </div>

                                    <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                            {t('ai.confidence-threshold')}
                                            {' '}
                                            (
                                            {Math.round(settings.confidence * 100)}
                                            %)
                                        </label>
                                        <input
                                            type="range"
                                            min="0"
                                            max="100"
                                            value={settings.confidence * 100}
                                            onChange={e => setSettings(s => ({ ...s, confidence: Number(e.target.value) / 100 }))}
                                            className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                                        />
                                        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-2">
                                            <span>Low</span>
                                            <span>High</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                                        <div>
                                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('ai.auto-reject-high-confidence')}</span>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Automatically reject content above threshold</p>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            onClick={() => setSettings(s => ({ ...s, autoReject: !s.autoReject }))}
                                            className={cn(
                                                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                                                settings.autoReject ? 'bg-purple-600' : 'bg-gray-200 dark:bg-gray-700',
                                            )}
                                        >
                                            <span
                                                className={cn(
                                                    'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                                                    settings.autoReject ? 'translate-x-6' : 'translate-x-1',
                                                )}
                                            />
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {/* Content Categories */}
                            <div>
                                <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">{t('ai.content-categories')}</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {Object.entries(settings.categories).map(([category, enabled]) => (
                                        <div key={category} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                                            <div>
                                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                                                    {t(`ai.${category.replace(CAMEL_TO_KEBAB_RE, '-$1').toLowerCase()}`)}
                                                </span>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                    Screen for
                                                    {' '}
                                                    {category.toLowerCase()}
                                                    {' '}
                                                    content
                                                </p>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                onClick={() =>
                                                    setSettings(s => ({
                                                        ...s,
                                                        categories: { ...s.categories, [category]: !enabled },
                                                    }))}
                                                className={cn(
                                                    'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                                                    enabled ? 'bg-purple-600' : 'bg-gray-200 dark:bg-gray-700',
                                                )}
                                            >
                                                <span
                                                    className={cn(
                                                        'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                                                        enabled ? 'translate-x-6' : 'translate-x-1',
                                                    )}
                                                />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 flex justify-end space-x-4">
                            <Button
                                variant="outline"
                                onClick={() => setShowSettings(false)}
                                className="px-6 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-300"
                            >
                                {t('ai.cancel')}
                            </Button>
                            <Button
                                onClick={() => setShowSettings(false)}
                                className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-lg transition-all duration-300 transform hover:scale-105"
                            >
                                {t('ai.save-settings')}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Suspend User Modal */}
            {showSuspendUserModal && userToSuspend && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md w-full mx-4">
                        <div className="flex items-center text-red-600 dark:text-red-400 mb-4">
                            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-xl mr-3">
                                <AlertTriangle size={24} />
                            </div>
                            <h3 className="text-xl font-bold">{t('ai.suspend-user-account')}</h3>
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 mb-2">
                            {t('ai.confirm-suspend-user', { username: userToSuspend.name })}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-500 mb-6">
                            {t('ai.suspend-user-description')}
                        </p>
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                {t('ai.suspension-reason')}
                            </label>
                            <textarea
                                value={suspendReason}
                                onChange={e => setSuspendReason(e.target.value)}
                                rows={3}
                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                                placeholder={t('ai.enter-suspension-reason')}
                            />
                        </div>
                        <div className="flex justify-end space-x-4">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setShowSuspendUserModal(false);
                                    setUserToSuspend(null);
                                    setSuspendReason('');
                                }}
                                className="px-6 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-300"
                            >
                                {t('ai.cancel')}
                            </Button>
                            <Button
                                onClick={() => _handleSuspend(suspendReason)}
                                className={cn(
                                    'px-6 py-2 text-white rounded-xl transition-all duration-300',
                                    suspendReason.trim()
                                        ? 'bg-gradient-to-r from-red-600 to-pink-600 hover:shadow-lg transform hover:scale-105'
                                        : 'bg-red-300 dark:bg-red-700 cursor-not-allowed',
                                )}
                                disabled={!suspendReason.trim()}
                            >
                                {t('ai.suspend-account')}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
