import type { ColumnDef } from '@tanstack/react-table';

import { Eye, RotateCcw, Trash } from 'lucide-react';

import { Badge, Button } from '#shared/component';
import { DataTable } from '#shared/component/data-table';
import { Pagination } from '#shared/component/pagination';
import { useTranslate } from '#shared/i18n';

import type { I_ModerationLog, I_ModerationLogListProps } from './moderation-log.type';

import { E_ModerationLogAction } from './moderation-log.type';

export function ModerationLogList({
    logs,
    loading,
    totalDocs,
    page,
    totalPages,
    limit,
    hasNextPage,
    hasPrevPage,
    onPageChange,
    onLimitChange,
    onDeleteLog,
    onEditLog,
    onRestoreLog,
}: I_ModerationLogListProps) {
    const { t } = useTranslate('moderation');

    const _formatDate = (date: string | Date) => {
        return new Date(date).toLocaleDateString();
    };

    const _getActionBadgeColor = (action: E_ModerationLogAction) => {
        switch (action) {
            case E_ModerationLogAction.APPROVE:
                return 'bg-green-100 text-green-800 hover:bg-green-800 hover:text-white';
            case E_ModerationLogAction.DELETE:
                return 'bg-red-100 text-red-800 hover:bg-red-800 hover:text-white';
            case E_ModerationLogAction.WARN:
                return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-800 hover:text-white';
            case E_ModerationLogAction.SUSPEND:
                return 'bg-orange-100 text-orange-800 hover:bg-orange-800 hover:text-white';
            case E_ModerationLogAction.DEACTIVATE:
                return 'bg-gray-100 text-gray-800 hover:bg-gray-800 hover:text-white';
            case E_ModerationLogAction.CLOSE:
                return 'bg-purple-100 text-purple-800 hover:bg-purple-800 hover:text-white';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const _getRiskLevelBadgeColor = (riskLevel?: string) => {
        switch (riskLevel) {
            case 'LOW':
                return 'bg-green-100 text-green-800';
            case 'MEDIUM':
                return 'bg-yellow-100 text-yellow-800';
            case 'HIGH':
                return 'bg-orange-100 text-orange-800';
            case 'CRITICAL':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const columns: ColumnDef<I_ModerationLog>[] = [
        {
            accessorKey: 'id',
            header: t('ID'),
            cell: ({ row }) => (
                <span className="font-mono text-xs">{row.getValue('id')}</span>
            ),
        },
        {
            accessorKey: 'action',
            header: t('Action'),
            cell: ({ row }) => {
                const action = row.getValue('action') as E_ModerationLogAction;
                return (
                    <Badge className={`${_getActionBadgeColor(action)} transition-colors`}>
                        {action}
                    </Badge>
                );
            },
        },
        {
            id: 'user',
            header: t('User'),
            cell: ({ row }) => {
                const log = row.original;
                return (
                    <div className="flex flex-col">
                        <span className="font-medium text-sm">
                            {log.user?.username || 'Unknown'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                            {log.user?.email || log.userId}
                        </span>
                    </div>
                );
            },
        },
        {
            id: 'media',
            header: t('Media'),
            cell: ({ row }) => {
                const log = row.original;
                return (
                    <div className="flex flex-col">
                        <span className="text-sm font-medium">
                            {log.moderationMedia?.type?.toUpperCase() || 'Unknown'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                            {log.moderationMedia?.status || 'N/A'}
                        </span>
                    </div>
                );
            },
        },
        {
            id: 'aiResult',
            header: t('AI Analysis'),
            cell: ({ row }) => {
                const log = row.original;
                const { aiResult } = log;

                if (!aiResult) {
                    return <span className="text-muted-foreground text-sm">N/A</span>;
                }

                return (
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                            <Badge className={`${_getRiskLevelBadgeColor(aiResult.riskLevel)} text-xs`}>
                                {aiResult.riskLevel || 'Unknown'}
                            </Badge>
                            {aiResult.confidence && (
                                <span className="text-xs text-muted-foreground">
                                    {Math.round(aiResult.confidence * 100)}
                                    %
                                </span>
                            )}
                        </div>
                        {aiResult.decision && (
                            <span className="text-xs font-medium">
                                {aiResult.decision}
                            </span>
                        )}
                    </div>
                );
            },
        },
        {
            id: 'reasons',
            header: t('Reasons'),
            cell: ({ row }) => {
                const log = row.original;
                const reasons = log.aiResult?.reasons;

                if (!reasons || reasons.length === 0) {
                    return <span className="text-muted-foreground text-sm">None</span>;
                }

                const firstReason = reasons[0];
                const remainingCount = reasons.length - 1;

                return (
                    <div className="max-w-xs">
                        <span className="text-sm">{firstReason}</span>
                        {remainingCount > 0 && (
                            <Badge variant="outline" className="ml-1 text-xs">
                                +
                                {remainingCount}
                                {' '}
                                more
                            </Badge>
                        )}
                    </div>
                );
            },
        },
        {
            accessorKey: 'createdAt',
            header: t('Created'),
            cell: ({ row }) => {
                const createdAt = row.getValue('createdAt') as string | Date;
                return (
                    <span className="text-sm text-muted-foreground">
                        {createdAt ? _formatDate(createdAt) : 'N/A'}
                    </span>
                );
            },
        },
        {
            id: 'status',
            header: t('Status'),
            cell: ({ row }) => {
                const log = row.original;
                const isDeleted = log.isDel === true;

                return (
                    <Badge
                        className={isDeleted
                            ? 'bg-red-100 text-red-800 hover:bg-red-800 hover:text-white transition-colors'
                            : 'bg-green-100 text-green-800 hover:bg-green-800 hover:text-white transition-colors'}
                    >
                        {isDeleted ? t('deleted') : t('active')}
                    </Badge>
                );
            },
        },
        {
            id: 'actions',
            header: t('Actions'),
            cell: ({ row }) => {
                const log = row.original;
                const isDeleted = log.isDel === true;

                return (
                    <div className="flex justify-end gap-1">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => onEditLog?.(log)}
                            title={t('view details')}
                            aria-label={t('view details')}
                        >
                            <Eye className="w-4 h-4" />
                        </Button>

                        {!isDeleted && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive"
                                onClick={() => onDeleteLog?.(log)}
                                aria-label={t('delete')}
                                title={t('delete')}
                            >
                                <Trash className="w-4 h-4" />
                            </Button>
                        )}

                        {isDeleted && (
                            <Button
                                variant="outline"
                                size="icon"
                                className="text-green-600 hover:text-green-700"
                                onClick={() => onRestoreLog?.(log)}
                                title={t('restore')}
                                aria-label={t('restore')}
                            >
                                <RotateCcw className="w-4 h-4" />
                            </Button>
                        )}
                    </div>
                );
            },
        },
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                    <p className="mt-2 text-muted-foreground">{t('loading')}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <DataTable
                columns={columns}
                data={logs}
                searchKey={undefined}
                searchPlaceholder={t('search logs')}
                showPagination={false}
                showToolbar={false}
                showColumnVisibility={true}
                pageSize={limit}
            />
            <Pagination
                total={totalDocs}
                page={page}
                limit={limit}
                onPageChange={onPageChange}
                onLimitChange={onLimitChange}
                hasNextPage={hasNextPage}
                hasPrevPage={hasPrevPage}
                totalPages={totalPages}
                sticky
            />
        </div>
    );
}
