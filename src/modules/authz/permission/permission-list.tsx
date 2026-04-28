import type { ColumnDef } from '@tanstack/react-table';

import { Loading } from '@cyberskill/shared/react/loading';
import { Edit, Trash } from 'lucide-react';

import type { T_Permission } from '#shared/graphql';

import { Badge, Button, Switch } from '#shared/component';
import { DataTable } from '#shared/component/data-table';
import { useTranslate } from '#shared/i18n';

import type { I_PermissionListProps } from './permission.type';

export function PermissionList({
    permissions,
    loading,
    onTogglePublic,
    onToggleActive,
    updatingPublicId,
    updatingActiveId,
    selectedRoleId,
    isPermissionActive,
    onEditPermission,
    onCreatePermission,
    onDeletePermission,
}: I_PermissionListProps) {
    const { t } = useTranslate('authz');

    const isRoleSelected = !!selectedRoleId;

    const columns: ColumnDef<T_Permission>[] = [
        {
            accessorKey: 'type',
            header: t('type'),
            cell: ({ row }) => {
                const type = row.getValue('type') as string;
                return (
                    <Badge className={
                        (type === 'GRAPHQL' && 'bg-blue-100 text-blue-800 hover:bg-blue-800 hover:text-white dark:bg-blue-900 dark:text-blue-200 dark:hover:bg-blue-700 transition-colors')
                        || (type === 'REST' && 'bg-green-100 text-green-800 hover:bg-green-800 hover:text-white dark:bg-green-900 dark:text-green-200 dark:hover:bg-green-700 transition-colors')
                        || (type === 'ROUTE' && 'bg-purple-100 text-purple-800 hover:bg-purple-800 hover:text-white dark:bg-purple-900 dark:text-purple-200 dark:hover:bg-purple-700 transition-colors')
                        || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                    }
                    >
                        {type}
                    </Badge>
                );
            },
        },
        {
            accessorKey: 'method',
            header: t('method'),
            cell: ({ row }) => {
                const method = row.getValue('method') as string;
                if (!method) {
                    return <span className="text-muted-foreground">-</span>;
                }
                return (
                    <Badge className={
                        (method === 'GET' && 'bg-green-100 text-green-800 hover:bg-green-800 hover:text-white dark:bg-green-900 dark:text-green-200 dark:hover:bg-green-700 transition-colors')
                        || (method === 'POST' && 'bg-blue-100 text-blue-800 hover:bg-blue-800 hover:text-white dark:bg-blue-900 dark:text-blue-200 dark:hover:bg-blue-700 transition-colors')
                        || (method === 'PUT' && 'bg-yellow-100 text-yellow-800 hover:bg-yellow-800 hover:text-white dark:bg-yellow-900 dark:text-yellow-200 dark:hover:bg-yellow-700 transition-colors')
                        || (method === 'PATCH' && 'bg-orange-100 text-orange-800 hover:bg-orange-800 hover:text-white dark:bg-orange-900 dark:text-orange-200 dark:hover:bg-orange-700 transition-colors')
                        || (method === 'DELETE' && 'bg-red-100 text-red-800 hover:bg-red-800 hover:text-white dark:bg-red-900 dark:text-red-200 dark:hover:bg-red-700 transition-colors')
                        || (method === 'QUERY' && 'bg-blue-100 text-blue-800 hover:bg-blue-800 hover:text-white dark:bg-blue-900 dark:text-blue-200 dark:hover:bg-blue-700 transition-colors')
                        || (method === 'MUTATION' && 'bg-pink-100 text-pink-800 hover:bg-pink-800 hover:text-white dark:bg-pink-900 dark:text-pink-200 dark:hover:bg-pink-700 transition-colors')
                        || (method === 'SUBSCRIPTION' && 'bg-purple-100 text-purple-800 hover:bg-purple-800 hover:text-white dark:bg-purple-900 dark:text-purple-200 dark:hover:bg-purple-700 transition-colors')
                        || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                    }
                    >
                        {method}
                    </Badge>
                );
            },
        },
        {
            accessorKey: 'target',
            header: t('target'),
            cell: ({ row }) => (
                <span className="font-mono text-sm">{row.getValue('target')}</span>
            ),
        },
        {
            accessorKey: 'name',
            header: t('name'),
            cell: ({ row }) => (
                <span className="font-medium">{row.getValue('name')}</span>
            ),
        },
        {
            accessorKey: 'isPublic',
            header: t('public'),
            cell: ({ row }) => {
                const permission = row.original;
                return (
                    <Switch
                        checked={permission.isPublic || false}
                        onCheckedChange={() => onTogglePublic?.(permission.id!, permission.isPublic || false)}
                        aria-label={t('toggle-public')}
                        disabled={updatingPublicId === permission.id}
                    />
                );
            },
        },
        {
            accessorKey: 'active',
            header: t('active'),
            cell: ({ row }) => {
                const permission = row.original;
                const active = isPermissionActive ? isPermissionActive(permission.id!) : false;
                return (
                    <Switch
                        checked={active}
                        onCheckedChange={() => onToggleActive?.(permission.id!, active)}
                        aria-label={t('toggle-active')}
                        disabled={!isRoleSelected || updatingActiveId === permission.id}
                    />
                );
            },
        },
        {
            id: 'actions',
            header: t('actions'),
            cell: ({ row }) => {
                const permission = row.original;
                return (
                    <div className="flex justify-end gap-1">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => onEditPermission?.(permission)}
                            aria-label={t('edit')}
                        >
                            <Edit className="w-3 h-3" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                            onClick={() => onDeletePermission?.(permission)}
                            aria-label={t('delete')}
                        >
                            <Trash className="w-4 h-4" />
                        </Button>
                    </div>
                );
            },
        },
    ];

    return (
        <div className="space-y-4">
            {loading && <Loading />}
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold dark:text-slate-100">{t('permissions')}</h2>
                <Button
                    size="sm"
                    onClick={onCreatePermission}
                >
                    +
                    {' '}
                    {t('create-permission')}
                </Button>
            </div>
            <div className="text-sm text-muted-foreground">
                {t('auto-permissions-hint')}
            </div>
            <DataTable
                columns={columns}
                data={permissions}
                searchKey="name"
                searchPlaceholder={t('search-permissions')}
                showPagination={false}
                showToolbar={true}
                showColumnVisibility={true}
                pageSize={10000}
            />
        </div>
    );
}
