import { useMutation } from '@cyberskill/shared/react/apollo-client';
import { toast } from '@cyberskill/shared/react/toast';
import {
    AlertTriangle,
    BarChart3,
    Calendar,
    Check,
    ChevronLeft,
    ChevronRight,
    Clock,
    Download,
    Eye,
    FileText,
    Filter,
    Flag,
    MessageSquare,
    Search,
    Shield,
    Trash2,
    User,
    Users,
    UserX,
    X,
    Zap,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';

import type { createGuardianVisitTokenMutation, createGuardianVisitTokenMutationVariables, T_Note, T_Report } from '#shared/graphql';

import { Button, Editor, LexicalPreview } from '#shared/component';
import { createGuardianVisitTokenDocument, E_NoteType, E_ReportStatus, E_ReportType } from '#shared/graphql';
import { useTranslate } from '#shared/i18n';
import { usePortal } from '#shared/portal';
import { cn } from '#shared/util';

import { useUpdateUser } from '../../user/user.hook';
import { useGetReports, useUpdateReport } from './report.hook';

export default function ReportPage() {
    const { t } = useTranslate();
    const { setHeader } = usePortal();
    const [selectedTab, setSelectedTab] = useState<'all' | 'pending' | 'approve' | 'closed'>('all');
    const [showActionModal, setShowActionModal] = useState(false);
    const [selectedReport, setSelectedReport] = useState<T_Report | null>(null);
    const [actionReason, setActionReason] = useState('');
    const [selectedAction, setSelectedAction] = useState<'approve' | 'remove' | 'suspend' | null>(null);
    const [showNotesModal, setShowNotesModal] = useState(false);
    const [showKeywordModal, setShowKeywordModal] = useState(false);
    const [newNote, setNewNote] = useState('');
    const [noteEditorKey, setNoteEditorKey] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedReports, setSelectedReports] = useState<Set<string>>(() => new Set());
    const [page, setPage] = useState(1);
    const pageSize = 10;
    const [createGuardianVisitToken, { loading: guardianTokenLoading }] = useMutation<
        createGuardianVisitTokenMutation,
        createGuardianVisitTokenMutationVariables
    >(createGuardianVisitTokenDocument);

    const tReport = useCallback((key: string) => t(`moderation.report.${key}`), [t]);

    const statusFilter = useMemo(() => {
        if (selectedTab === 'pending')
            return E_ReportStatus.PENDING;
        if (selectedTab === 'approve')
            return E_ReportStatus.APPROVED;
        if (selectedTab === 'closed')
            return E_ReportStatus.CLOSED;
        return undefined;
    }, [selectedTab]);

    const reportFilter = useMemo(() => {
        return statusFilter
            ? { status: statusFilter }
            : {};
    }, [statusFilter]);

    const { reports, totalDocs, paginationInfo, refetch } = useGetReports(reportFilter, {
        page,
        limit: pageSize,
        sort: { createdAt: -1 },
        populate: [
            { path: 'reportedBy', select: 'id username email' },
            { path: 'target', select: 'id username email' },
            {
                path: 'moderationMedia',
                populate: { path: 'uploadedBy', select: 'id username email' },
            },
        ],
    });
    const { updateReport, loading: updateReportLoading } = useUpdateReport();
    const { updateUser } = useUpdateUser();

    // Set portal header
    useEffect(() => {
        setHeader({
            title: tReport('title'),
            description: tReport('description'),
            icon: Shield,
        });
        return () => setHeader(null);
    }, [setHeader, tReport]);

    const _highlightKeyword = (text: string, keyword?: string) => {
        if (!keyword)
            return text;
        const regex = new RegExp(`(${keyword})`, 'gi');
        return text.split(regex).map((part, i) =>
            regex.test(part)
                ? (
                        <span key={`${part}-${text.indexOf(part, i)}`} className="font-bold text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-1 rounded">
                            {part}
                        </span>
                    )
                : part,
        );
    };

    const _handleAddNote = async (content: string) => {
        if (!selectedReport?.id || !content.trim())
            return;

        const trimmedContent = content.trim();
        setNewNote('');
        setNoteEditorKey(prev => prev + 1);

        const existingNotes = (selectedReport.notes || [])
            .filter((note): note is NonNullable<typeof note> => Boolean(note?.content))
            .map(note => ({
                content: note.content || '',
                type: note.type || E_NoteType.MEMBER_NOTE,
                createdById: note.createdById || undefined,
            }));

        await updateReport(
            { id: selectedReport.id },
            {
                notes: [
                    ...existingNotes,
                    {
                        type: E_NoteType.MEMBER_NOTE,
                        content: trimmedContent,
                    },
                ],
            },
        );

        const newNotePreview: T_Note = {
            type: E_NoteType.MEMBER_NOTE,
            content: trimmedContent,
            createdAt: new Date().toISOString(),
            createdBy: { username: 'Admin' },
        };

        setSelectedReport(prev => prev ? { ...prev, notes: [...(prev.notes || []), newNotePreview] } : null);
        const targetId = selectedReport.targetId
            || (Array.isArray(selectedReport.target)
                ? selectedReport.target[0]?.id
                : selectedReport.target?.id);
        if (targetId) {
            try {
                await updateUser(
                    { id: targetId },
                    {
                        notes: {
                            type: E_NoteType.MEMBER_NOTE,
                            content: trimmedContent,
                        },
                    } as any,
                );
            }
            catch (error) {
                console.error('Error adding user note from report:', error);
            }
        }
        refetch();
    };

    const _handleAction = async () => {
        if (!selectedReport?.id || !selectedAction)
            return;
        if (selectedAction === 'approve' && selectedReport.status === E_ReportStatus.APPROVED)
            return;
        const existingNotes = (selectedReport.notes || [])
            .filter((note): note is NonNullable<typeof note> => Boolean(note?.content))
            .map(note => ({
                content: note.content || '',
                type: note.type || E_NoteType.MEMBER_NOTE,
                createdById: note.createdById || undefined,
            }));

        if (selectedAction === 'suspend' && !actionReason.trim())
            return;

        if (selectedAction === 'remove') {
            await updateReport(
                { id: selectedReport.id },
                {
                    status: E_ReportStatus.CLOSED,
                    notes: existingNotes,
                },
            );
            setShowActionModal(false);
            setSelectedReport(null);
            setSelectedAction(null);
            setActionReason('');
            refetch();
            return;
        }

        const newStatus = selectedAction === 'approve'
            ? E_ReportStatus.APPROVED
            : E_ReportStatus.CLOSED;

        await updateReport(
            { id: selectedReport.id },
            {
                status: newStatus,
                notes: selectedAction === 'approve'
                    ? existingNotes
                    : [
                            ...existingNotes,
                            {
                                type: E_NoteType.CONTENT_REVIEW,
                                content: actionReason.trim(),
                            },
                        ],
            },
        );

        setShowActionModal(false);
        setSelectedReport(null);
        setSelectedAction(null);
        setActionReason('');
        refetch();
    };

    const filteredReports = useMemo(() => {
        return reports.filter((r) => {
            const matchesTab = selectedTab === 'all'
                ? true
                : selectedTab === 'pending'
                    ? r.status === E_ReportStatus.PENDING
                    : selectedTab === 'approve'
                        ? r.status === E_ReportStatus.APPROVED
                        : r.status === E_ReportStatus.CLOSED;

            const normalizedQuery = searchQuery.toLowerCase();
            const targetUser = Array.isArray(r.target) ? r.target[0] : r.target;
            const reportedByUsers = Array.isArray(r.reportedBy)
                ? r.reportedBy
                : r.reportedBy
                    ? [r.reportedBy]
                    : [];
            const mediaUploader = r.moderationMedia?.uploadedBy;
            const matchesSearch = searchQuery === ''
                || targetUser?.username?.toLowerCase().includes(normalizedQuery)
                || targetUser?.email?.toLowerCase().includes(normalizedQuery)
                || mediaUploader?.username?.toLowerCase().includes(normalizedQuery)
                || mediaUploader?.email?.toLowerCase().includes(normalizedQuery)
                || reportedByUsers.some(user => user?.username?.toLowerCase().includes(normalizedQuery) || user?.email?.toLowerCase().includes(normalizedQuery))
                || r.content?.toLowerCase().includes(normalizedQuery);

            return matchesTab && matchesSearch;
        });
    }, [reports, searchQuery, selectedTab]);

    const stats = useMemo(() => ({
        total: totalDocs || reports.length,
        pending: reports.filter(r => r.status === E_ReportStatus.PENDING).length,
        resolved: reports.filter(r => r.status !== E_ReportStatus.PENDING).length,
    }), [reports, totalDocs]);

    const _handleSelectAll = () => {
        if (selectedReports.size === filteredReports.length) {
            setSelectedReports(new Set());
        }
        else {
            setSelectedReports(new Set(filteredReports.map(r => r.id || '').filter(Boolean)));
        }
    };

    const getTypeIcon = (type: E_ReportType) => {
        switch (type) {
            case E_ReportType.KEYWORD:
                return <Flag className="w-4 h-4" />;
            case E_ReportType.USER:
                return <User className="w-4 h-4" />;
            default:
                return <AlertTriangle className="w-4 h-4" />;
        }
    };

    const _handleOpenTargetPage = async (report: T_Report) => {
        if (String(report.type) === E_ReportType.KEYWORD) {
            setSelectedReport(report);
            setShowKeywordModal(true);
            return;
        }
        const targetUser = Array.isArray(report.target)
            ? report.target[0]
            : report.target;
        const targetUsername = targetUser?.username;

        try {
            const response = await createGuardianVisitToken();
            const token = response.data?.createGuardianVisitToken.result?.token;

            if (!response.data?.createGuardianVisitToken.success || !token) {
                toast.error(response.data?.createGuardianVisitToken.message || 'Failed to create guardian token');
                return;
            }

            const userWebsiteUrl = import.meta.env['VITE_USER_WEBSITE_URL'] || 'http://localhost:8001';
            if (!targetUsername) {
                toast.error('Target user not found.');
                return;
            }

            const targetUrl = `${userWebsiteUrl}/profile/${encodeURIComponent(targetUsername)}?guardian_token=${token}`;

            window.open(targetUrl, '_blank', 'noopener,noreferrer');
        }
        catch (error) {
            console.error('Guardian visit error:', error);
            toast.error('Failed to create guardian access token');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50 dark:from-slate-900 dark:to-slate-800 p-6 animate-fade-in-up">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header Section */}
                <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-slate-700/50 p-6">
                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-4 text-white shadow-lg hover-lift">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-blue-100 text-sm font-medium">{tReport('total-reports')}</p>
                                    <p className="text-2xl font-bold">{stats.total}</p>
                                </div>
                                <BarChart3 className="w-8 h-8 text-blue-200" />
                            </div>
                        </div>
                        <div className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl p-4 text-white shadow-lg hover-lift">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-yellow-100 text-sm font-medium">{tReport('pending-reports')}</p>
                                    <p className="text-2xl font-bold">{stats.pending}</p>
                                </div>
                                <Clock className="w-8 h-8 text-yellow-200" />
                            </div>
                        </div>
                        <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl p-4 text-white shadow-lg hover-lift">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-green-100 text-sm font-medium">{tReport('resolved-reports')}</p>
                                    <p className="text-2xl font-bold">{stats.resolved}</p>
                                </div>
                                <Check className="w-8 h-8 text-green-200" />
                            </div>
                        </div>
                    </div>
                    {/* Search and Filters */}
                    <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setPage(1);
                                    setSelectedReports(new Set());
                                }}
                                placeholder={tReport('search-placeholder')}
                                className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                            />
                        </div>
                        <div className="flex items-center space-x-3">
                            <Button variant="ghost" className="flex items-center px-4 py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-all duration-200">
                                <Filter className="w-4 h-4 mr-2" />
                                {tReport('filters')}
                            </Button>
                            <Button variant="ghost" className="flex items-center px-4 py-3 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-xl hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-all duration-200">
                                <Download className="w-4 h-4 mr-2" />
                                {tReport('export-reports')}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-slate-700/50 p-6">
                    <div className="flex flex-wrap gap-2 mb-6">
                        {(['all', 'pending', 'approve', 'closed'] as const).map(tab => (
                            <Button
                                key={tab}
                                variant="ghost"
                                onClick={() => {
                                    setSelectedTab(tab);
                                    setPage(1);
                                    setSelectedReports(new Set());
                                }}
                                className={cn(
                                    'px-6 py-3 rounded-xl font-medium transition-all duration-200 hover-lift',
                                    selectedTab === tab
                                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                                        : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600',
                                )}
                            >
                                {tab === 'all' && tReport('tab-all')}
                                {tab === 'pending' && tReport('tab-pending')}
                                {tab === 'approve' && tReport('tab-approve')}
                                {tab === 'closed' && tReport('tab-closed')}
                                <span className="ml-2 px-2 py-1 text-xs bg-white/20 dark:bg-black/20 rounded-full">
                                    {tab === 'all'
                                        ? stats.total
                                        : tab === 'pending'
                                            ? stats.pending
                                            : tab === 'approve'
                                                ? reports.filter(r => r.status === E_ReportStatus.APPROVED).length
                                                : reports.filter(r => r.status === E_ReportStatus.CLOSED).length}
                                </span>
                            </Button>
                        ))}
                    </div>

                    {/* Bulk Actions */}
                    {selectedReports.size > 0 && (
                        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                            <div className="flex items-center justify-between">
                                <span className="text-blue-700 dark:text-blue-300 font-medium">
                                    {selectedReports.size}
                                    {' '}
                                    {tReport('reports-count')}
                                    {' '}
                                    selected
                                </span>
                                <div className="flex space-x-2">
                                    <Button
                                        variant="ghost"
                                        onClick={async () => {
                                            const ids = Array.from(selectedReports).filter(Boolean);
                                            await Promise.all(ids.map(id => updateReport({ id }, { status: E_ReportStatus.APPROVED })));
                                            setSelectedReports(new Set());
                                            refetch();
                                        }}
                                        className="px-4 py-2 bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-700"
                                    >
                                        <Check className="w-4 h-4 mr-2" />
                                        {tReport('approve-content')}
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        onClick={async () => {
                                            const ids = Array.from(selectedReports).filter(Boolean);
                                            await Promise.all(ids.map(id => updateReport({ id }, { status: E_ReportStatus.CLOSED })));
                                            setSelectedReports(new Set());
                                            refetch();
                                        }}
                                        className="px-4 py-2 bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-700"
                                    >
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        {tReport('remove-content')}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Table */}
                    <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-50 dark:bg-slate-700/50">
                                    <tr>
                                        <th className="px-6 py-4 text-left">
                                            <input
                                                type="checkbox"
                                                checked={selectedReports.size === filteredReports.length && filteredReports.length > 0}
                                                onChange={_handleSelectAll}
                                                className="rounded border-slate-300 dark:border-slate-600 text-purple-600 focus:ring-purple-500"
                                            />
                                        </th>
                                        {[
                                            tReport('type'),
                                            tReport('reported-by'),
                                            tReport('reported-user'),
                                            tReport('content'),
                                            tReport('report-date'),
                                            tReport('status'),
                                            tReport('reports'),
                                            tReport('notes'),
                                            tReport('action'),
                                        ].map(header => (
                                            <th
                                                key={header}
                                                className="px-6 py-4 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider"
                                            >
                                                {header}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                                    {filteredReports.map((report, index) => (
                                        <tr
                                            key={report.id || `report-${index}`}
                                            className={cn(
                                                'hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all duration-200',
                                                report.id && selectedReports.has(report.id) && 'bg-blue-50 dark:bg-blue-900/20',
                                            )}
                                            style={{ animationDelay: `${index * 50}ms` }}
                                        >
                                            <td className="px-6 py-4">
                                                <input
                                                    type="checkbox"
                                                    checked={report.id ? selectedReports.has(report.id) : false}
                                                    onChange={(e) => {
                                                        if (!report.id)
                                                            return;
                                                        const newSelected = new Set(selectedReports);
                                                        if (e.target.checked) {
                                                            newSelected.add(report.id);
                                                        }
                                                        else {
                                                            newSelected.delete(report.id);
                                                        }
                                                        setSelectedReports(newSelected);
                                                    }}
                                                    className="rounded border-slate-300 dark:border-slate-600 text-purple-600 focus:ring-purple-500"
                                                />
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center space-x-2">
                                                    {getTypeIcon(report.type || E_ReportType.KEYWORD)}
                                                    <span className={cn(
                                                        'px-3 py-1 text-xs font-semibold rounded-full border',
                                                        report.type === E_ReportType.KEYWORD
                                                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 border-blue-200 dark:border-blue-800'
                                                            : 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400 border-purple-200 dark:border-purple-800',
                                                    )}
                                                    >
                                                        {report.type || 'Unknown'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {(() => {
                                                    const reportedByUsers = Array.isArray(report.reportedBy)
                                                        ? report.reportedBy
                                                        : report.reportedBy
                                                            ? [report.reportedBy]
                                                            : [];
                                                    const reporterNames = reportedByUsers
                                                        .map(user => user?.username || user?.email)
                                                        .filter(Boolean);
                                                    if (!reporterNames.length) {
                                                        return <span className="text-sm text-slate-400 dark:text-slate-500">N/A</span>;
                                                    }
                                                    const visibleNames = reporterNames.slice(0, 2);
                                                    const extraCount = reporterNames.length - visibleNames.length;
                                                    return (
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                                                {visibleNames.join(', ')}
                                                            </span>
                                                            {extraCount > 0 && (
                                                                <span className="text-xs text-slate-500 dark:text-slate-400">
                                                                    +
                                                                    {extraCount}
                                                                </span>
                                                            )}
                                                        </div>
                                                    );
                                                })()}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center space-x-3">
                                                    <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                                                        <User className="w-4 h-4 text-white" />
                                                    </div>
                                                    <span className="font-medium text-slate-900 dark:text-slate-100">
                                                        {(() => {
                                                            const targetUser = Array.isArray(report.target)
                                                                ? report.target[0]
                                                                : report.target;
                                                            const mediaUploader = report.moderationMedia?.uploadedBy;
                                                            return (
                                                                mediaUploader?.username
                                                                || mediaUploader?.email
                                                                || targetUser?.username
                                                                || targetUser?.email
                                                                || 'N/A'
                                                            );
                                                        })()}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 max-w-xs">
                                                <div className="text-sm text-slate-700 dark:text-slate-300">
                                                    {report.content
                                                        ? _highlightKeyword(report.content, report.content)
                                                        : <span className="text-slate-400 dark:text-slate-500">N/A</span>}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center space-x-2">
                                                    <Calendar className="w-4 h-4 text-slate-400" />
                                                    <span className="text-sm text-slate-600 dark:text-slate-400">
                                                        {report.createdAt ? new Date(report.createdAt).toLocaleDateString() : 'N/A'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={cn(
                                                    'inline-flex items-center whitespace-nowrap text-xs font-semibold px-3 py-1 rounded-full border',
                                                    report.status === E_ReportStatus.APPROVED
                                                        ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300 border-green-200 dark:border-green-800'
                                                        : report.status === E_ReportStatus.CLOSED
                                                            ? 'bg-slate-100 text-slate-700 dark:bg-slate-700/40 dark:text-slate-300 border-slate-200 dark:border-slate-600'
                                                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800',
                                                )}
                                                >
                                                    {report.status === E_ReportStatus.APPROVED
                                                        ? tReport('status-approved')
                                                        : report.status === E_ReportStatus.CLOSED
                                                            ? tReport('status-closed')
                                                            : tReport('status-pending')}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center space-x-1">
                                                    <Users className="w-4 h-4 text-slate-400" />
                                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                                        {report.reportedByIds?.length || 0}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <Button
                                                    variant="ghost"
                                                    onClick={() => {
                                                        setSelectedReport(report);
                                                        setShowNotesModal(true);
                                                    }}
                                                    className="text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 transition-colors"
                                                    title={`${report.notes?.length || 0} notes`}
                                                >
                                                    <FileText className="w-5 h-5" />
                                                    {(report.notes?.length ?? 0) > 0 && (
                                                        <span className="ml-1 px-2 py-1 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full">
                                                            {report.notes?.length ?? 0}
                                                        </span>
                                                    )}
                                                </Button>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center space-x-2">
                                                    <Link
                                                        to={`/messenger?userId=${report.targetId}`}
                                                        className="p-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all duration-200"
                                                        title={tReport('send-message')}
                                                    >
                                                        <MessageSquare className="w-4 h-4" />
                                                    </Link>
                                                    <Button
                                                        variant="ghost"
                                                        onClick={() => _handleOpenTargetPage(report)}
                                                        className="p-2 text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-all duration-200"
                                                        title={tReport('view-profile')}
                                                        disabled={guardianTokenLoading}
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </Button>
                                                    {(['approve', 'remove', 'suspend'] as const).map(action => (
                                                        <Button
                                                            key={action}
                                                            variant="ghost"
                                                            onClick={() => {
                                                                if (action === 'approve' && report.status === E_ReportStatus.APPROVED)
                                                                    return;
                                                                setSelectedReport(report);
                                                                setSelectedAction(action);
                                                                setShowActionModal(true);
                                                            }}
                                                            disabled={action === 'approve' && report.status === E_ReportStatus.APPROVED}
                                                            className={cn(
                                                                'p-2 rounded-lg transition-all duration-200 hover-lift',
                                                                action === 'approve' && 'text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20',
                                                                action === 'remove' && 'text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20',
                                                                action === 'suspend' && 'text-orange-600 dark:text-orange-400 hover:text-orange-800 dark:hover:text-orange-300 hover:bg-orange-50 dark:hover:bg-orange-900/20',
                                                                action === 'approve' && report.status === E_ReportStatus.APPROVED && 'opacity-50 cursor-not-allowed',
                                                            )}
                                                        >
                                                            {action === 'approve' && <Check className="w-4 h-4" />}
                                                            {action === 'remove' && <Trash2 className="w-4 h-4" />}
                                                            {action === 'suspend' && <UserX className="w-4 h-4" />}
                                                        </Button>
                                                    ))}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Pagination */}
                    <div className="mt-6 flex items-center justify-between">
                        <div className="text-sm text-slate-600 dark:text-slate-400">
                            {tReport('showing')}
                            {' '}
                            <span className="font-medium">{filteredReports.length}</span>
                            {' '}
                            {tReport('of')}
                            {' '}
                            <span className="font-medium">{totalDocs || reports.length}</span>
                            {' '}
                            {tReport('reports-count')}
                        </div>
                        <div className="flex items-center space-x-2">
                            <Button
                                variant="ghost"
                                onClick={() => setPage(prev => Math.max(1, prev - 1))}
                                disabled={!paginationInfo.hasPrevPage}
                                className="p-2 text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </Button>
                            <Button
                                variant="ghost"
                                className="px-3 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg font-medium"
                            >
                                {paginationInfo.page}
                            </Button>
                            <span className="text-sm text-slate-500 dark:text-slate-400">
                                /
                                {' '}
                                {paginationInfo.totalPages}
                            </span>
                            <Button
                                variant="ghost"
                                onClick={() => setPage(prev => prev + 1)}
                                disabled={!paginationInfo.hasNextPage}
                                className="p-2 text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Action Modal */}
            {showActionModal && selectedReport && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in-up">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full mx-4 border border-slate-200 dark:border-slate-700">
                        <div className="p-6">
                            <div className="flex items-center mb-6">
                                <div className={cn(
                                    'p-3 rounded-xl mr-4',
                                    selectedAction === 'approve' && 'bg-green-100 dark:bg-green-900/30',
                                    selectedAction === 'remove' && 'bg-red-100 dark:bg-red-900/30',
                                    selectedAction === 'suspend' && 'bg-orange-100 dark:bg-orange-900/30',
                                )}
                                >
                                    {selectedAction === 'approve' && <Check className="w-6 h-6 text-green-600 dark:text-green-400" />}
                                    {selectedAction === 'remove' && <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />}
                                    {selectedAction === 'suspend' && <UserX className="w-6 h-6 text-orange-600 dark:text-orange-400" />}
                                </div>
                                <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                                    {selectedAction === 'approve'
                                        ? tReport('approve-content')
                                        : selectedAction === 'remove' ? tReport('remove-content') : tReport('suspend-account')}
                                </h3>
                            </div>
                            {selectedAction === 'suspend' && (
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                                        {tReport('action-reason')}
                                    </label>
                                    <textarea
                                        value={actionReason}
                                        onChange={e => setActionReason(e.target.value)}
                                        rows={3}
                                        className="w-full px-4 py-3 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 resize-none"
                                        placeholder={tReport('enter-reason')}
                                    />
                                </div>
                            )}
                            <div className="flex justify-end space-x-3">
                                <Button
                                    variant="ghost"
                                    onClick={() => {
                                        setShowActionModal(false);
                                        setSelectedReport(null);
                                        setSelectedAction(null);
                                        setActionReason('');
                                    }}
                                    className="px-6 py-3 text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-all duration-200"
                                >
                                    {tReport('cancel')}
                                </Button>
                                <Button
                                    variant="ghost"
                                    onClick={_handleAction}
                                    disabled={(selectedAction === 'suspend' && !actionReason) || updateReportLoading}
                                    className={cn(
                                        'px-6 py-3 text-white rounded-xl font-medium transition-all duration-200',
                                        selectedAction === 'approve' && 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600',
                                        selectedAction === 'remove' && 'bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600',
                                        selectedAction === 'suspend' && 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600',
                                        ((selectedAction !== 'approve' && !actionReason) || updateReportLoading) && 'opacity-50 cursor-not-allowed',
                                    )}
                                >
                                    {tReport('confirm-action')}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Notes Modal */}
            {showNotesModal && selectedReport && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in-up">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-4xl w-full mx-4 border border-slate-200 dark:border-slate-700">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center space-x-3">
                                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                                        <FileText className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                                            {tReport('notes-for')}
                                            {' '}
                                            {selectedReport.target?.username}
                                        </h3>
                                        <p className="text-sm text-slate-600 dark:text-slate-400">
                                            {selectedReport.notes?.length || 0}
                                            {' '}
                                            notes
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    onClick={() => setShowNotesModal(false)}
                                    className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-all duration-200"
                                >
                                    <X className="w-5 h-5" />
                                </Button>
                            </div>

                            <div className="mb-6">
                                <div className="flex space-x-3">
                                    <div className="flex-1">
                                        <Editor
                                            key={noteEditorKey}
                                            value={newNote}
                                            valueKey={noteEditorKey}
                                            onChange={setNewNote}
                                            placeholder={tReport('add-note-placeholder')}
                                            showToolbar={true}
                                            className="bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl"
                                            contentClassName="min-h-[75px] outline-none p-3"
                                        />
                                    </div>
                                    <Button
                                        variant="ghost"
                                        onClick={() => _handleAddNote(newNote)}
                                        disabled={!newNote.trim() || updateReportLoading}
                                        className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 self-end"
                                    >
                                        <Zap className="w-4 h-4 mr-2" />
                                        {tReport('add-note')}
                                    </Button>
                                </div>
                            </div>

                            <div className="space-y-4 max-h-96 overflow-y-auto">
                                {selectedReport.notes?.length === 0
                                    ? (
                                            <div className="text-center py-12">
                                                <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                                                <p className="text-slate-500 dark:text-slate-400">{tReport('no-notes')}</p>
                                            </div>
                                        )
                                    : (
                                            selectedReport.notes?.map(note =>
                                                note
                                                    ? (
                                                            <div
                                                                key={`${note.createdAt ?? ''}-${note.createdBy?.username ?? ''}-${note.type}-${note.content}`}
                                                                className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-xl border border-slate-200 dark:border-slate-600 hover-lift"
                                                            >
                                                                <div className="flex justify-between items-start mb-3">
                                                                    <div className="flex items-center space-x-3">
                                                                        <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                                                                            <User className="w-4 h-4 text-white" />
                                                                        </div>
                                                                        <div>
                                                                            <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                                                                {note.createdBy?.username}
                                                                            </span>
                                                                            <span className="ml-2 text-xs text-slate-500 dark:text-slate-400">
                                                                                {note.createdAt ? new Date(note.createdAt).toLocaleDateString() : 'N/A'}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                    <span className={cn(
                                                                        'text-xs font-medium px-3 py-1 rounded-full border',
                                                                        note.type === E_NoteType.MEMBER_NOTE
                                                                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 border-blue-200 dark:border-blue-800'
                                                                            : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400 border-red-200 dark:border-red-800',
                                                                    )}
                                                                    >
                                                                        {note.type}
                                                                    </span>
                                                                </div>
                                                                <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                                                                    <LexicalPreview
                                                                        content={note.content || ''}
                                                                        className="prose prose-slate dark:prose-invert max-w-none p-0"
                                                                    />
                                                                </div>
                                                            </div>
                                                        )
                                                    : null,
                                            )
                                        )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Keyword Detail Modal */}
            {showKeywordModal && selectedReport && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in-up">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-lg w-full mx-4 border border-slate-200 dark:border-slate-700">
                        <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                                    Keyword Details
                                </h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    Review keyword content only
                                </p>
                            </div>
                            <Button
                                variant="ghost"
                                onClick={() => setShowKeywordModal(false)}
                                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-all duration-200"
                            >
                                <X className="w-5 h-5" />
                            </Button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2">
                                    Keyword
                                </p>
                                <div className="px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                                    {selectedReport.content || 'N/A'}
                                </div>
                            </div>
                            <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400">
                                <span>
                                    Reports:
                                    {' '}
                                    <strong className="text-slate-800 dark:text-slate-200">
                                        {selectedReport.reportedByIds?.length || 0}
                                    </strong>
                                </span>
                                <span>
                                    Status:
                                    {' '}
                                    <strong className="text-slate-800 dark:text-slate-200">
                                        {selectedReport.status || 'N/A'}
                                    </strong>
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
