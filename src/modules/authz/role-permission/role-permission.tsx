import { useState } from 'react';

import type { E_PermissionType } from '#shared/graphql';

import { Badge } from '#shared/component/badge';
import { Button } from '#shared/component/button';
import { Checkbox } from '#shared/component/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '#shared/component/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '#shared/component/tabs';
import { useTranslate } from '#shared/i18n';

import type { I_RolePermissionProps } from './role-permission.type';

export function RolePermission({
    roles,
    permissions,
    rolePermissions,
    onAssignPermission,
    onBulkAssign,
    loading,
}: I_RolePermissionProps) {
    const { t } = useTranslate('authz');
    const [selectedRole, setSelectedRole] = useState<string | null>(null);

    const _isPermissionAssigned = (roleId: string, permissionId: string) => {
        return rolePermissions.some(rp => rp.roleId === roleId && rp.permissionId === permissionId && rp.assigned);
    };

    const _handlePermissionToggle = (roleId: string, permissionId: string) => {
        const currentlyAssigned = _isPermissionAssigned(roleId, permissionId);
        onAssignPermission(roleId, permissionId, !currentlyAssigned);
    };

    const _handleBulkAssign = (roleId: string, permissionIds: string[], assigned: boolean) => {
        onBulkAssign(roleId, permissionIds, assigned);
    };

    const _getPermissionTypeColor = (type: E_PermissionType) => {
        switch (type) {
            case 'GRAPHQL':
                return 'bg-blue-100 text-blue-800';
            case 'REST':
                return 'bg-green-100 text-green-800';
            case 'ROUTE':
                return 'bg-purple-100 text-purple-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-slate-300 mx-auto"></div>
                    <p className="mt-2 text-muted-foreground dark:text-slate-400">{t('loading-permissions')}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold mb-4 dark:text-slate-100">{t('role-permission-assignment')}</h2>
                <p className="text-muted-foreground dark:text-slate-400">
                    {t('role-permission-description')}
                </p>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="text-sm font-medium dark:text-slate-200">{t('select-role')}</label>
                    <div className="flex flex-wrap gap-2 mt-2">
                        {roles.map(role => (
                            <Button
                                key={role.id}
                                variant={selectedRole === role.id ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setSelectedRole(role.id || null)}
                            >
                                {role.name}
                            </Button>
                        ))}
                    </div>
                </div>

                {selectedRole && (
                    <Tabs defaultValue="all" className="w-full">
                        <TabsList className="grid w-full grid-cols-4">
                            <TabsTrigger value="all">{t('all-permissions')}</TabsTrigger>
                            <TabsTrigger value="graphql">{t('graphql')}</TabsTrigger>
                            <TabsTrigger value="rest">{t('rest')}</TabsTrigger>
                            <TabsTrigger value="route">{t('route')}</TabsTrigger>
                        </TabsList>

                        <TabsContent value="all" className="space-y-4">
                            {permissions.map(group => (
                                <div key={group.type} className="space-y-2">
                                    <h3 className="text-lg font-semibold flex items-center gap-2 dark:text-slate-100">
                                        <Badge className={_getPermissionTypeColor(group.type)}>
                                            {group.type}
                                        </Badge>
                                        {group.permissions.length}
                                        {' '}
                                        {t('permissions')}
                                    </h3>
                                    <div className="border rounded-lg dark:border-slate-700">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead className="dark:text-slate-200">{t('permission')}</TableHead>
                                                    <TableHead className="dark:text-slate-200">{t('target')}</TableHead>
                                                    <TableHead className="dark:text-slate-200">{t('method')}</TableHead>
                                                    <TableHead className="dark:text-slate-200">{t('public')}</TableHead>
                                                    <TableHead className="text-center dark:text-slate-200">{t('assigned')}</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {group.permissions.map(permission => (
                                                    <TableRow key={permission.id} className="dark:border-slate-700">
                                                        <TableCell className="font-medium dark:text-slate-200">
                                                            {permission.name}
                                                        </TableCell>
                                                        <TableCell className="font-mono text-sm dark:text-slate-300">
                                                            {permission.target}
                                                        </TableCell>
                                                        <TableCell>
                                                            {permission.method
                                                                ? (
                                                                        <Badge variant="outline">
                                                                            {permission.method}
                                                                        </Badge>
                                                                    )
                                                                : (
                                                                        <span className="text-muted-foreground dark:text-slate-400">-</span>
                                                                    )}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge variant={permission.isPublic ? 'default' : 'secondary'}>
                                                                {permission.isPublic ? t('yes') : t('no')}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="text-center">
                                                            <Checkbox
                                                                checked={_isPermissionAssigned(selectedRole, permission.id || '')}
                                                                onCheckedChange={() =>
                                                                    _handlePermissionToggle(selectedRole, permission.id || '')}
                                                            />
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </div>
                            ))}
                        </TabsContent>

                        {permissions.map(group => (
                            <TabsContent key={group.type} value={group.type.toLowerCase()} className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-lg font-semibold flex items-center gap-2 dark:text-slate-100">
                                        <Badge className={_getPermissionTypeColor(group.type)}>
                                            {group.type}
                                        </Badge>
                                        {group.permissions.length}
                                        {' '}
                                        {t('permissions')}
                                    </h3>
                                    <div className="space-x-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => _handleBulkAssign(
                                                selectedRole,
                                                group.permissions.map(p => p.id || ''),
                                                true,
                                            )}
                                        >
                                            {t('assign-all')}
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => _handleBulkAssign(
                                                selectedRole,
                                                group.permissions.map(p => p.id || ''),
                                                false,
                                            )}
                                        >
                                            {t('remove-all')}
                                        </Button>
                                    </div>
                                </div>
                                <div className="border rounded-lg dark:border-slate-700">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="dark:text-slate-200">{t('permission')}</TableHead>
                                                <TableHead className="dark:text-slate-200">{t('target')}</TableHead>
                                                <TableHead className="dark:text-slate-200">{t('method')}</TableHead>
                                                <TableHead className="dark:text-slate-200">{t('public')}</TableHead>
                                                <TableHead className="text-center dark:text-slate-200">{t('assigned')}</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {group.permissions.map(permission => (
                                                <TableRow key={permission.id} className="dark:border-slate-700">
                                                    <TableCell className="font-medium dark:text-slate-200">
                                                        {permission.name}
                                                    </TableCell>
                                                    <TableCell className="font-mono text-sm dark:text-slate-300">
                                                        {permission.target}
                                                    </TableCell>
                                                    <TableCell>
                                                        {permission.method
                                                            ? (
                                                                    <Badge variant="outline">
                                                                        {permission.method}
                                                                    </Badge>
                                                                )
                                                            : (
                                                                    <span className="text-muted-foreground dark:text-slate-400">-</span>
                                                                )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant={permission.isPublic ? 'default' : 'secondary'}>
                                                            {permission.isPublic ? t('yes') : t('no')}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <Checkbox
                                                            checked={_isPermissionAssigned(selectedRole, permission.id || '')}
                                                            onCheckedChange={() =>
                                                                _handlePermissionToggle(selectedRole, permission.id || '')}
                                                        />
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </TabsContent>
                        ))}
                    </Tabs>
                )}
            </div>
        </div>
    );
}
