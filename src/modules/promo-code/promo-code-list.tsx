import type { ColumnDef } from '@tanstack/react-table';

import { Loading } from '@cyberskill/shared/react/loading';
import { Edit, Plus, Trash2 } from 'lucide-react';

import type { T_PromoCode } from '#shared/graphql';

import { Badge, Button, Switch } from '#shared/component';
import { DataTable } from '#shared/component/data-table';
import { useTranslate } from '#shared/i18n';
import { formatExactTimeDifference } from '#shared/util';

import type { I_PromoCodeListProps } from './promo-code.type';

export function PromoCodeList({
    promoCodes,
    loading,
    onEditPromoCode,
    onCreatePromoCode,
    onDeletePromoCode,
    onToggleStatus,
    updatingStatusId,
    totalDocs,
    page,
    pageSize,
    onPageChange,
    onPageSizeChange,
}: I_PromoCodeListProps) {
    const { t } = useTranslate('promoCodes');

    const columns: ColumnDef<T_PromoCode>[] = [
        {
            accessorKey: 'code',
            header: t('code'),
            cell: ({ row }) => (
                <span className="font-mono font-medium">{row.getValue('code')}</span>
            ),
        },
        {
            accessorKey: 'expiresAt',
            header: t('expires'),
            cell: ({ row }) => {
                const expiresAt = row.getValue('expiresAt') as string;
                const createdAt = row.original.createdAt;

                if (!expiresAt) {
                    return (
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">{t('never-expires')}</span>
                            <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-800 hover:text-white transition-colors">
                                {t('lifetime-benefit')}
                            </Badge>
                        </div>
                    );
                }

                const exactDuration = formatExactTimeDifference(createdAt, expiresAt);
                const expiryDate = new Date(expiresAt).toLocaleString();

                return (
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">{expiryDate}</span>
                        <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-800 hover:text-white transition-colors">
                            {exactDuration}
                        </Badge>
                    </div>
                );
            },
        },
        {
            id: 'membershipDuration',
            header: t('membership-duration'),
            cell: ({ row }) => {
                const promoCode = row.original as T_PromoCode & { membershipDurationDays?: number };

                let durationDays = promoCode.membershipDurationDays;
                if (!durationDays && promoCode.createdAt && promoCode.expiresAt) {
                    const created = new Date(promoCode.createdAt);
                    const expires = new Date(promoCode.expiresAt);
                    durationDays = Math.ceil((expires.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
                }

                durationDays = durationDays || 30;

                const isLifetime = durationDays >= 999999 * 30;

                if (isLifetime) {
                    return (
                        <div className="flex items-center gap-2">
                            <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold">
                                ♾️
                                {' '}
                                {t('lifetime-benefit')}
                            </Badge>
                        </div>
                    );
                }

                let monthsLabel: number | string = Math.floor(durationDays / 30);
                if (durationDays <= 35)
                    monthsLabel = 1;
                else if (durationDays <= 65)
                    monthsLabel = 2;
                else if (durationDays <= 95)
                    monthsLabel = 3;
                else if (durationDays <= 185)
                    monthsLabel = 6;
                else if (durationDays <= 370)
                    monthsLabel = 12;

                return (
                    <Badge variant="outline" className="text-xs">
                        {monthsLabel}
                        {' '}
                        {(monthsLabel === 1) ? t('month') : t('months')}
                    </Badge>
                );
            },
        },
        {
            accessorKey: 'isActive',
            header: t('status'),
            cell: ({ row }) => {
                const promoCode = row.original;
                const isActive = promoCode.isActive || false;
                return (
                    <div className="flex items-center gap-2">
                        <Switch
                            checked={isActive}
                            onCheckedChange={() => onToggleStatus?.(promoCode.id!, isActive)}
                            aria-label={t('toggle-status')}
                            disabled={updatingStatusId === promoCode.id}
                        />
                        <span className={`text-sm ${isActive ? 'text-green-600' : 'text-gray-500'}`}>
                            {isActive ? t('active') : t('inactive')}
                        </span>
                    </div>
                );
            },
        },
        {
            accessorKey: 'isLimit',
            header: t('usage-limit'),
            cell: ({ row }) => {
                const promoCode = row.original;
                if (!promoCode.isLimit) {
                    return <span className="text-muted-foreground">-</span>;
                }
                return (
                    <Badge variant="outline">
                        {promoCode.usageLimit || 0}
                    </Badge>
                );
            },
        },
        {
            accessorKey: 'globalUsageLimit',
            header: t('global-limit'),
            cell: ({ row }) => {
                const promoCode = row.original;
                if (!promoCode.globalUsageLimit || promoCode.globalUsageLimit === 0) {
                    return <span className="text-muted-foreground">-</span>;
                }
                return (
                    <Badge variant="outline">
                        {promoCode.globalUsageLimit}
                    </Badge>
                );
            },
        },
        {
            accessorKey: 'createdAt',
            header: t('created'),
            cell: ({ row }) => (
                <span className="text-sm text-muted-foreground">
                    {new Date(row.getValue('createdAt')).toLocaleDateString()}
                </span>
            ),
        },
        {
            id: 'actions',
            header: t('actions'),
            cell: ({ row }) => {
                const promoCode = row.original;
                return (
                    <div className="flex justify-end gap-1">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => onEditPromoCode?.(promoCode)}
                        >
                            <Edit className="w-3 h-3" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                            onClick={() => onDeletePromoCode?.(promoCode)}
                            aria-label={t('delete')}
                        >
                            <Trash2 className="w-4 h-4" />
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
                    onClick={onCreatePromoCode}
                    className="flex items-center whitespace-nowrap"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    {t('create-promo-code')}
                </Button>
            </div>
            <DataTable
                columns={columns}
                data={promoCodes}
                showPagination={true}
                showToolbar={true}
                showColumnVisibility={true}
                pageSize={pageSize}
                page={page}
                totalItems={totalDocs}
                onPageChange={onPageChange}
                onPageSizeChange={onPageSizeChange}
            />
        </div>
    );
}
