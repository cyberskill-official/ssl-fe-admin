import type { ColumnDef } from '@tanstack/react-table';

import { RotateCcw, User } from 'lucide-react';
import { useCallback, useMemo } from 'react';

import { Badge, Button } from '#shared/component';
import { DataTable } from '#shared/component/data-table';
import { useTranslate } from '#shared/i18n';

import { useGetBlocks } from '../user/user.hook';

interface I_Block {
    id?: string | null;
    userId?: string | null;
    blockId?: string | null;
    createdAt?: any;
    user?: {
        id?: string | null;
        username?: string | null;
        email?: string | null;
    } | null;
    block?: {
        id?: string | null;
        username?: string | null;
        email?: string | null;
    } | null;
}

interface I_BlockListProps {
    onUnblockUser?: (blockId: string) => void;
}

export function BlockList({ onUnblockUser }: I_BlockListProps) {
    const { t } = useTranslate('user');
    const { blocks, loading: _loading } = useGetBlocks();

    const _formatDate = useCallback((date: any) => {
        if (!date) {
            return t('na');
        }
        return new Date(date).toLocaleDateString();
    }, [t]);

    const columns: ColumnDef<I_Block | null>[] = useMemo(() => [
        {
            accessorKey: 'user.username',
            header: t('blocker'),
            cell: ({ row }) => {
                const user = row.original?.user;
                return (
                    <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-500" />
                        <span className="font-mono text-xs">
                            {user?.username || user?.email || t('na')}
                        </span>
                    </div>
                );
            },
        },
        {
            accessorKey: 'block.username',
            header: t('blocked-user'),
            cell: ({ row }) => {
                const blockedUser = row.original?.block;
                return (
                    <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-red-500" />
                        <span className="font-mono text-xs">
                            {blockedUser?.username || blockedUser?.email || t('na')}
                        </span>
                    </div>
                );
            },
        },
        {
            accessorKey: 'createdAt',
            header: t('blocked-at'),
            cell: ({ row }) => (
                <Badge variant="outline" className="text-xs">
                    {_formatDate(row.getValue('createdAt'))}
                </Badge>
            ),
        },
        {
            id: 'actions',
            header: t('actions'),
            cell: ({ row }) => {
                const block = row.original;
                if (!block) {
                    return null;
                }
                return (
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="icon"
                            className="text-green-600 hover:text-green-700"
                            onClick={() => block.blockId && onUnblockUser?.(block.blockId)}
                            title={t('unblock-user')}
                            aria-label={t('unblock-user')}
                        >
                            <RotateCcw className="w-4 h-4" />
                        </Button>
                    </div>
                );
            },
        },
    ], [t, onUnblockUser, _formatDate]);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">{t('blocked-users')}</h3>
                <Badge variant="secondary">
                    {blocks.length}
                    {' '}
                    {t('total-blocks')}
                </Badge>
            </div>

            <DataTable
                columns={columns}
                data={blocks}
                searchKey="block.username"
                searchPlaceholder={t('search-blocked-users')}
                showPagination={true}
                showToolbar={true}
                showColumnVisibility={true}
                pageSize={10}
            />
        </div>
    );
}
