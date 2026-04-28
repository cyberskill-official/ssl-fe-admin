import type { ColumnDef } from '@tanstack/react-table';

import { Loading } from '@cyberskill/shared/react/loading';
import { Edit, Mail, Send, Trash2, Users } from 'lucide-react';

import type { T_EmailCampaign } from '#shared/graphql';

import {
    Badge,
    Button,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '#shared/component';
import { DataTable } from '#shared/component/data-table';
import { E_UserGroup } from '#shared/graphql';
import { useTranslate } from '#shared/i18n';
import { cn } from '#shared/util';

import type { I_EmailCampaignListProps } from './email-campaign.type';

export function EmailCampaignList({
    emailCampaigns,
    loading,
    onEditEmailCampaign,
    onCreateEmailCampaign,
    onDeleteEmailCampaign,
    onToggleStatus,
    updatingStatusId,
    totalDocs,
    page,
    pageSize,
    onPageChange,
    onPageSizeChange,
    search,
    onSearchChange,
    selectedStatus,
    onStatusFilterChange,
}: I_EmailCampaignListProps) {
    const { t } = useTranslate('email-campaign');

    const _getTargetLabel = (target: E_UserGroup) => {
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
                return t('all-subscribers');
        }
    };

    const _getOpenRate = (openCount: number, recipientCount: number) => {
        if (!recipientCount)
            return 0;
        return Math.round((openCount / recipientCount) * 100);
    };

    const _getClickRate = (clickCount: number, recipientCount: number) => {
        if (!recipientCount)
            return 0;
        return Math.round((clickCount / recipientCount) * 100);
    };

    const columns: ColumnDef<T_EmailCampaign>[] = [
        {
            accessorKey: 'name',
            header: t('table-campaign-name'),
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-400 rounded-lg flex items-center justify-center">
                        <Mail className="w-4 h-4 text-white" />
                    </div>
                    <div>
                        <div className="font-medium">{row.getValue('name')}</div>
                        <div className="text-xs text-muted-foreground">
                            {row.original.subject}
                        </div>
                    </div>
                </div>
            ),
        },
        {
            accessorKey: 'target',
            header: t('table-target-audience'),
            cell: ({ row }) => {
                const target = row.getValue('target') as E_UserGroup;
                return (
                    <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-800 hover:text-white transition-colors">
                        {_getTargetLabel(target)}
                    </Badge>
                );
            },
        },
        {
            accessorKey: 'isScheduled',
            header: t('table-status'),
            cell: ({ row }) => {
                const emailCampaign = row.original;
                const isScheduled = emailCampaign.isScheduled || false;
                const isSent = emailCampaign.isSent || false;

                return (
                    <div className="flex items-center gap-2">
                        <Badge
                            className={cn(
                                'text-xs px-2 py-1',
                                isSent
                                    ? 'bg-green-100 text-green-800 hover:bg-green-800 hover:text-white'
                                    : isScheduled
                                        ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-800 hover:text-white'
                                        : 'bg-gray-100 text-gray-800 hover:bg-gray-800 hover:text-white',
                            )}
                        >
                            {isSent ? t('sent') : isScheduled ? t('scheduled') : t('draft')}
                        </Badge>
                        {isScheduled && !isSent && emailCampaign.scheduledDate && (
                            <span className="text-xs text-muted-foreground">
                                {new Date(emailCampaign.scheduledDate).toLocaleDateString()}
                            </span>
                        )}
                    </div>
                );
            },
        },
        {
            accessorKey: 'recipientCount',
            header: t('table-recipients'),
            cell: ({ row }) => {
                const recipientCount = row.getValue('recipientCount') as number;
                return (
                    <div className="flex items-center gap-1">
                        <Users className="w-4 h-4 text-blue-500" />
                        <span className="font-medium">
                            {recipientCount?.toLocaleString() || 0}
                        </span>
                    </div>
                );
            },
        },
        {
            accessorKey: 'openCount',
            header: t('table-opens'),
            cell: ({ row }) => {
                const emailCampaign = row.original;
                const openCount = emailCampaign.openCount || 0;
                const recipientCount = emailCampaign.recipientCount || 0;
                const openRate = _getOpenRate(openCount, recipientCount);

                return (
                    <div className="text-center">
                        <div className="font-medium text-purple-600">
                            {openCount.toLocaleString()}
                        </div>
                        <div className="text-xs text-muted-foreground">
                            {openRate}
                            %
                        </div>
                    </div>
                );
            },
        },
        {
            accessorKey: 'clickCount',
            header: t('table-clicks'),
            cell: ({ row }) => {
                const emailCampaign = row.original;
                const clickCount = emailCampaign.clickCount || 0;
                const recipientCount = emailCampaign.recipientCount || 0;
                const clickRate = _getClickRate(clickCount, recipientCount);

                return (
                    <div className="text-center">
                        <div className="font-medium text-purple-600">
                            {clickCount.toLocaleString()}
                        </div>
                        <div className="text-xs text-muted-foreground">
                            {clickRate}
                            %
                        </div>
                    </div>
                );
            },
        },
        {
            accessorKey: 'scheduledDate',
            header: t('table-sent-date'),
            cell: ({ row }) => (
                <span className="text-sm text-muted-foreground">
                    {row.getValue('scheduledDate')
                        ? new Date(row.getValue('scheduledDate')).toLocaleDateString()
                        : '-'}
                </span>
            ),
        },
        {
            id: 'actions',
            header: t('table-actions'),
            cell: ({ row }) => {
                const emailCampaign = row.original;
                const isScheduled = emailCampaign.isScheduled || false;
                const isSent = emailCampaign.isSent || false;

                return (
                    <div className="flex justify-end gap-1">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => onEditEmailCampaign?.(emailCampaign)}
                            disabled={isSent}
                            className={isSent ? 'opacity-50 cursor-not-allowed' : ''}
                            title={
                                isSent ? t('cannot-edit-sent-campaign') : t('edit-campaign')
                            }
                            aria-label={t('edit-campaign')}
                        >
                            <Edit className="w-3 h-3" />
                        </Button>
                        {isScheduled && !isSent && (
                            <Button
                                variant="outline"
                                size="icon"
                                className="text-green-600 hover:text-green-700"
                                onClick={() => onToggleStatus?.(emailCampaign.id!, isScheduled)}
                                disabled={updatingStatusId === emailCampaign.id}
                                aria-label={t('send-campaign')}
                                title={t('send-campaign')}
                            >
                                <Send className="size-3" />
                            </Button>
                        )}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                            onClick={() => onDeleteEmailCampaign?.(emailCampaign)}
                            aria-label={t('delete')}
                        >
                            <Trash2 className="size-4" />
                        </Button>
                    </div>
                );
            },
        },
    ];

    return (
        <div className="space-y-4">
            {loading && <Loading />}
            <div className="flex justify-end items-center">
                <Button
                    size="sm"
                    onClick={onCreateEmailCampaign}
                    className="flex items-center whitespace-nowrap bg-purple-600 hover:bg-purple-700"
                >
                    <Mail className="w-4 h-4 mr-2" />
                    {t('create-campaign')}
                </Button>
            </div>
            <div className="flex items-center gap-4">
                <Select
                    value={selectedStatus}
                    onValueChange={value =>
                        onStatusFilterChange?.(
                            value as 'all' | 'sent' | 'scheduled' | 'draft',
                        )}
                >
                    <SelectTrigger className="w-48">
                        <SelectValue placeholder={t('filter-by-status')} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">{t('all-campaigns')}</SelectItem>
                        <SelectItem value="draft">{t('draft')}</SelectItem>
                        <SelectItem value="scheduled">{t('scheduled')}</SelectItem>
                        <SelectItem value="sent">{t('sent')}</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <DataTable
                columns={columns}
                data={emailCampaigns}
                searchKey="name"
                searchPlaceholder={t('search-campaigns')}
                showPagination={true}
                showToolbar={true}
                showColumnVisibility={true}
                pageSize={pageSize}
                page={page}
                totalItems={totalDocs}
                onPageChange={onPageChange}
                onPageSizeChange={onPageSizeChange}
                searchValue={search}
                onSearchChange={onSearchChange}
            />
        </div>
    );
}
