import { log } from '@cyberskill/shared/react/log';
import { toast } from '@cyberskill/shared/react/toast';
import { Settings } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import type { T_Permission, T_Role, T_User } from '#shared/graphql';

import {
    useAdminBlockUser,
    useAdminUnblockUser,
    useCreateUser,
    useDeactivateUser,
    useDeleteUser,
    useGetBlocks,
    useRestoreUser,
    UserForm,
    UserList,
    UserSearch,
    useUpdateUser,
    useUsersWithPagination,
} from '#modules/user';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    Pagination,
} from '#shared/component';
import { Button } from '#shared/component/button';
import { ConfirmDialog } from '#shared/component/confirm-dialog';
import { E_RegisterStep } from '#shared/graphql';
import { useTranslate } from '#shared/i18n';
import { usePortal } from '#shared/portal';

import { PermissionForm, PermissionList, useCreatePermission, useDeletePermission, useGetPermissions, useUpdatePermission } from './permission';
import {
    RoleForm,
    RoleTree,
    useCreateRole,
    useDeleteRole,
    useGetRoles,
    useUpdateRole,
} from './role';
import {
    useCreateRolePermission,
    useDeleteRolePermission,
    useGetRolePermissions,
} from './role-permission';

export function AuthzPage() {
    const { t } = useTranslate('authz');
    const { setHeader } = usePortal();
    const [showRoleForm, setShowRoleForm] = useState(false);
    const [editingRole, setEditingRole] = useState<T_Role | null>(null);
    const [showAddUser, setShowAddUser] = useState(false);
    const [addUserDefaultRoles, setAddUserDefaultRoles] = useState<string[]>([]);
    const [showPermissionForm, setShowPermissionForm] = useState(false);
    const [editingPermission, setEditingPermission] = useState<T_Permission | null>(null);
    const [permissionFormMode, setPermissionFormMode] = useState<'create' | 'edit'>('create');
    const [editingUser, setEditingUser] = useState<T_User | null>(null);
    const [userFormMode, setUserFormMode] = useState<'create' | 'edit'>('create');
    const { createUser, loading: creatingUser } = useCreateUser();
    const { updateUser, loading: updatingUser } = useUpdateUser();
    const { adminBlockUser, loading: _blockingUser } = useAdminBlockUser();
    const { adminUnblockUser, loading: _unblockingUser } = useAdminUnblockUser();

    const { roles, loading: rolesLoading, refetch: refetchRoles } = useGetRoles();
    const {
        permissions,
        totalDocs: permissionsTotalDocs,
        totalPages: permissionsTotalPages,
        hasNextPage: permissionsHasNextPage,
        hasPrevPage: permissionsHasPrevPage,
        page: permissionsPage,
        limit: permissionsLimit,
        refetch: refetchPermissions,
    } = useGetPermissions(
        undefined,
        {
            pagination: false,
            sort: { createdAt: -1 },
        },
    );

    const {
        users,
        totalDocs,
        totalPages,
        page,
        limit,
        hasNextPage,
        hasPrevPage,
        loading: usersLoading,
        selectedRoleId,
        searchFilters,
        goToPage,
        changeLimit,
        filterByRole,
        updateSearchFilters,
        clearSearchFilters,
        refetch: refetchUsers,
    } = useUsersWithPagination(1, 10);

    const { refetch: refetchBlocks } = useGetBlocks();

    const { createRole, loading: creatingRole } = useCreateRole();
    const { updateRole, loading: updatingRole } = useUpdateRole();
    const { deleteRole } = useDeleteRole();
    const { createPermission } = useCreatePermission();
    const { deletePermission } = useDeletePermission();

    const {
        rolePermissions,
        loading: rolePermissionsLoading,
        refetch: refetchRolePermissions,
    } = useGetRolePermissions(
        selectedRoleId ? { roleId: selectedRoleId } : undefined,
        {
            pagination: false,
        },
    );
    const { createRolePermission } = useCreateRolePermission();
    const { deleteRolePermission } = useDeleteRolePermission();

    const rolesFiltered = roles.filter(role => role !== null && role.id !== null && role.name !== null);

    const isPermissionActive = useMemo(() => {
        if (!selectedRoleId) {
            return () => false;
        }

        const assignedPermissionIds = rolePermissions
            .filter(rp => rp?.roleId === selectedRoleId && !rp?.isDel)
            .map(rp => rp?.permissionId);
        return (permissionId: string) => assignedPermissionIds.includes(String(permissionId));
    }, [selectedRoleId, rolePermissions]);

    const [updatingPublicId, setUpdatingPublicId] = useState<string | null>(null);
    const { updatePermission } = useUpdatePermission();
    const _handlePublicToggle = async (permissionId: string, currentIsPublic: boolean) => {
        setUpdatingPublicId(permissionId);
        try {
            await updatePermission(
                { id: permissionId },
                { isPublic: !currentIsPublic },
            );
            await refetchPermissions();
        }
        catch (error) {
            log.error('Error updating permission isPublic:', error);
        }
        finally {
            setUpdatingPublicId(null);
        }
    };

    const [updatingActiveId, setUpdatingActiveId] = useState<string | null>(null);
    const _handleActiveToggle = async (permissionId: string, currentIsActive: boolean) => {
        if (!selectedRoleId)
            return;

        setUpdatingActiveId(permissionId);
        try {
            if (currentIsActive) {
                await deleteRolePermission({ roleId: selectedRoleId, permissionId });
            }
            else {
                await createRolePermission({ roleId: selectedRoleId, permissionId });
            }
            await refetchRolePermissions();
        }
        catch (error) {
            log.error('Error toggling permission assignment:', error);
        }
        finally {
            setUpdatingActiveId(null);
        }
    };

    const _handleEditPermission = (permission: T_Permission) => {
        setEditingPermission(permission);
        setPermissionFormMode('edit');
        setShowPermissionForm(true);
    };

    const _handleCreatePermission = () => {
        setEditingPermission(null);
        setPermissionFormMode('create');
        setShowPermissionForm(true);
    };

    const _handlePermissionFormSubmit = async (formData: Partial<T_Permission>) => {
        try {
            if (permissionFormMode === 'edit' && editingPermission?.id) {
                await updatePermission(
                    { id: editingPermission.id },
                    formData,
                );
            }
            else if (permissionFormMode === 'create') {
                await createPermission({
                    name: formData.name!,
                    target: formData.target!,
                    isPublic: formData.isPublic!,
                });
            }

            setShowPermissionForm(false);
            setEditingPermission(null);
            await refetchPermissions();
        }
        catch (error) {
            log.error('Error saving permission:', error);
            toast.error(t('error.save-permission-failed'));
        }
    };

    useEffect(() => {
        filterByRole(selectedRoleId);
    }, [selectedRoleId, filterByRole]);

    useEffect(() => {
        setHeader({
            title: 'Admin Control',
            description: 'Manage roles, permissions, and user access control',
            icon: Settings,
        });
        return () => setHeader(null);
    }, [setHeader]);

    const _handleCreateRole = async (formData: Partial<T_Role>) => {
        try {
            await createRole({
                name: formData.name!,
                description: formData.description!,
                parentId: formData.parentId || undefined,
            });
            setShowRoleForm(false);
            refetchRoles();
        }
        catch (error) {
            log.error('Error creating role:', error);
        }
    };

    const [roleFormMode, setRoleFormMode] = useState<'create' | 'edit'>('create');

    const _handleUpdateRole = async (formData: Partial<T_Role>) => {
        if (!editingRole?.id) {
            toast.error(t('error.role-not-found'));
            return;
        }
        try {
            await updateRole(
                { id: editingRole.id },
                {
                    name: formData.name!,
                    description: formData.description!,
                    parentId: formData.parentId || undefined,
                },
            );
            setShowRoleForm(false);
            setEditingRole(null);
            setRoleFormMode('create');
            refetchRoles();
        }
        catch (error) {
            log.error('Error updating role:', error);
        }
    };

    const _handleEditRole = (role: T_Role) => {
        setEditingRole(role);
        setRoleFormMode('edit');
        setShowRoleForm(true);
    };

    const _handleCreateNewRole = () => {
        setEditingRole(null);
        setRoleFormMode('create');
        setShowRoleForm(true);
    };

    const _handleSelectRole = (roleId: string | null) => {
        filterByRole(roleId);
    };

    const _handleAddUser = (role: T_Role) => {
        setAddUserDefaultRoles(role.id ? [role.id] : []);
        setShowAddUser(true);
    };

    const _handleCreateUser = () => {
        setAddUserDefaultRoles([]);
        setEditingUser(null);
        setUserFormMode('create');
        setShowAddUser(true);
    };

    const [permissionToDelete, setPermissionToDelete] = useState<T_Permission | null>(null);
    const [deleting, setDeleting] = useState(false);

    const [userToDelete, setUserToDelete] = useState<T_User | null>(null);
    const [userToPermanentDelete, setUserToPermanentDelete] = useState<T_User | null>(null);
    const [deletingUser, setDeletingUser] = useState(false);
    const { deleteUser, loading: _deletingUserLoading } = useDeleteUser();
    const { restoreUser } = useRestoreUser();
    const { deactivateUser } = useDeactivateUser();

    const [roleToDelete, setRoleToDelete] = useState<T_Role | null>(null);
    const [deletingRole, setDeletingRole] = useState(false);

    const _handleCreateSubRole = (parentRole: T_Role) => {
        setEditingRole({ parentId: parentRole.id });
        setRoleFormMode('create');
        setShowRoleForm(true);
    };

    const _handleDeleteRole = (role: T_Role) => {
        setRoleToDelete(role);
    };

    const _handlePermanentDeleteUser = (user: T_User) => {
        setUserToPermanentDelete(user);
    };

    const _handleChangePaymentDate = async (user: T_User, newDate: Date) => {
        try {
            if (!user.id) {
                toast.error(t('User ID not found'));
                return;
            }

            await updateUser(
                { id: user.id },
                { membershipExpiresAt: newDate.toISOString() },
            );

            await refetchUsers?.();
            toast.success(t('Payment date updated successfully'));
        }
        catch (error) {
            log.error('Error updating payment date:', error);
            toast.error(t('Failed to update payment date'));
        }
    };

    const _handleUpdateUserNotes = async (user: T_User, notes: string) => {
        try {
            const res = await updateUser(
                { id: user.id },
                {
                    notes: {
                        type: 'MEMBER_NOTE',
                        content: notes,
                    },
                } as any,
            );

            if (res.data?.updateUser?.success) {
                await refetchUsers?.();
                toast.success(t('Notes saved successfully'));
            }
            else {
                toast.error(res.data?.updateUser?.message || t('Failed to save notes'));
            }
        }
        catch (error) {
            log.error('Error saving user notes:', error);
            toast.error(t('Failed to save notes'));
        }
    };

    const _handleBlockUser = async (user: T_User) => {
        try {
            if (!user.id) {
                toast.error(t('User ID not found'));
                return;
            }

            await adminBlockUser(user.id);
            await refetchUsers?.();
            await refetchBlocks(); // Refresh danh sách blocks để cập nhật icon
        }
        catch (error) {
            log.error('Error blocking user:', error);
            toast.error(t('Failed to block user'));
        }
    };

    const _handleUnblockUser = async (user: T_User) => {
        try {
            if (!user.id) {
                toast.error(t('User ID not found'));
                return;
            }

            await adminUnblockUser(user.id);
            await refetchUsers?.();
            await refetchBlocks(); // Refresh danh sách blocks để cập nhật icon
        }
        catch (error) {
            log.error('Error unblocking user:', error);
            toast.error(t('Failed to unblock user'));
        }
    };

    return (
        <div className="container mx-auto space-y-6 h-[100vh] flex flex-col dark:bg-slate-900">
            <div className="flex-1 flex flex-col gap-4" style={{ minHeight: '0' }}>
                <div className="flex gap-8 min-h-0" style={{ height: '50%' }}>
                    <div className="w-1/3 min-w-[260px] max-w-sm border rounded-lg p-4 bg-white dark:bg-slate-800 dark:border-slate-700 max-h-[50vh] overflow-auto">
                        <h2 className="text-lg font-semibold mb-2 dark:text-slate-100">{t('roles')}</h2>
                        <RoleTree
                            roles={rolesFiltered as T_Role[]}
                            onEdit={_handleEditRole}
                            onDelete={_handleDeleteRole}
                            onCreateNew={_handleCreateNewRole}
                            loading={rolesLoading}
                            selectedRoleId={selectedRoleId}
                            onSelectRole={_handleSelectRole}
                            onAddUser={_handleAddUser}
                            onCreateSubRole={_handleCreateSubRole}
                        />
                    </div>
                    <div className="flex-1 border rounded-lg px-4 pt-4 bg-white dark:bg-slate-800 dark:border-slate-700 max-h-[50vh] overflow-auto relative">
                        <PermissionList
                            permissions={permissions as T_Permission[]}
                            loading={rolePermissionsLoading}
                            onTogglePublic={_handlePublicToggle}
                            onToggleActive={_handleActiveToggle}
                            updatingPublicId={updatingPublicId || undefined}
                            updatingActiveId={updatingActiveId || undefined}
                            selectedRoleId={selectedRoleId}
                            isPermissionActive={isPermissionActive}
                            onEditPermission={_handleEditPermission}
                            onCreatePermission={_handleCreatePermission}
                            onDeletePermission={(permission) => {
                                setPermissionToDelete(permission);
                            }}
                        />
                        <Pagination
                            total={permissionsTotalDocs}
                            page={permissionsPage}
                            limit={permissionsLimit}
                            hasNextPage={permissionsHasNextPage}
                            hasPrevPage={permissionsHasPrevPage}
                            totalPages={permissionsTotalPages}
                            sticky
                        />
                    </div>
                </div>
                <div className="flex-1 border rounded-lg p-4 bg-white dark:bg-slate-800 dark:border-slate-700 overflow-auto">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold dark:text-slate-100">{t('users')}</h2>
                        <Button onClick={_handleCreateUser} size="sm">
                            +
                            {' '}
                            {t('create-user')}
                        </Button>
                    </div>

                    <UserSearch
                        filters={searchFilters}
                        onFiltersChange={updateSearchFilters}
                        onClear={clearSearchFilters}
                        loading={usersLoading}
                    />

                    <UserList
                        users={users}
                        loading={usersLoading}
                        totalDocs={totalDocs}
                        page={page}
                        totalPages={totalPages}
                        limit={limit}
                        hasNextPage={hasNextPage}
                        hasPrevPage={hasPrevPage}
                        onPageChange={goToPage}
                        onLimitChange={changeLimit}
                        onDeleteUser={user => setUserToDelete(user)}
                        onRestoreUser={async (user) => {
                            try {
                                if (user.id) {
                                    await restoreUser({ id: user.id });
                                    await refetchUsers?.();
                                }
                            }
                            catch (error) {
                                console.error('Error restoring user:', error);
                            }
                        }}
                        onPermanentDelete={_handlePermanentDeleteUser}
                        onChangePaymentDate={_handleChangePaymentDate}
                        onUpdateUserNotes={_handleUpdateUserNotes}
                        onBlockUser={_handleBlockUser}
                        onUnblockUser={_handleUnblockUser}
                        onEditUser={(user) => {
                            setEditingUser(user);
                            setUserFormMode('edit');
                            setShowAddUser(true);
                        }}
                    />
                </div>
            </div>
            <UserForm
                open={showAddUser || !!editingUser}
                onOpenChange={(open) => {
                    setShowAddUser(open);
                    if (!open) {
                        setEditingUser(null);
                        setUserFormMode('create');
                    }
                }}
                user={editingUser || undefined}
                mode={userFormMode}
                onSubmit={async (data) => {
                    try {
                        if (userFormMode === 'edit' && editingUser) {
                            // Remove duplicates from rolesIds before updating
                            const uniqueRolesIds = Array.from(new Set(data.rolesIds));

                            // Single update — backend enforces role exclusivity and deduplication.
                            // The old two-step approach (clear → set) was dangerous: if Step 2 failed,
                            // the user would be left with NO roles, breaking their account.
                            const res = await updateUser(
                                { id: editingUser.id },
                                { rolesIds: uniqueRolesIds },
                            );

                            if (res.data?.updateUser?.success) {
                                toast.success(t('success.user-updated'));
                                setEditingUser(null);
                                setShowAddUser(false);
                                await refetchUsers?.();
                            }
                            else {
                                toast.error(res.data?.updateUser?.message || t('error.update-user-failed'));
                            }
                        }
                        else {
                            const res = await createUser({
                                username: data.username,
                                email: data.email,
                                password: data.password,
                                rolesIds: data.rolesIds,
                                isActive: true,
                                isEmailVerified: true,
                                registerStep: E_RegisterStep.COMPLETE,
                            });
                            if (res.data?.createUser?.success) {
                                toast.success(t('success.user-created'));
                                setShowAddUser(false);
                                await refetchUsers?.();
                            }
                            else {
                                toast.error(res.data?.createUser?.message || t('error.create-user-failed'));
                            }
                        }
                    }
                    catch {
                        toast.error(userFormMode === 'edit' ? t('error.update-user-failed') : t('error.create-user-failed'));
                    }
                }}
                onCancel={() => {
                    setShowAddUser(false);
                    setEditingUser(null);
                    setUserFormMode('create');
                }}
                allRoles={rolesFiltered as T_Role[]}
                defaultRoles={addUserDefaultRoles}
                readonlyRoles={addUserDefaultRoles.length === 1 ? addUserDefaultRoles : []}
                loading={creatingUser || updatingUser}
            />
            <Dialog open={showRoleForm} onOpenChange={setShowRoleForm}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>
                            {roleFormMode === 'edit' ? t('update-role') : t('create-new-role')}
                        </DialogTitle>
                    </DialogHeader>
                    <RoleForm
                        role={editingRole || undefined}
                        allRoles={rolesFiltered as T_Role[]}
                        mode={roleFormMode}
                        onSubmit={async (formData) => {
                            if (roleFormMode === 'edit') {
                                await _handleUpdateRole(formData);
                            }
                            else {
                                await _handleCreateRole(formData);
                            }
                        }}
                        onCancel={() => {
                            setShowRoleForm(false);
                            setEditingRole(null);
                            setRoleFormMode('create');
                        }}
                        loading={creatingRole || updatingRole}
                    />
                </DialogContent>
            </Dialog>
            <Dialog open={showPermissionForm} onOpenChange={setShowPermissionForm}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>
                            {permissionFormMode === 'edit' ? t('update-permission') : t('create-new-permission')}
                        </DialogTitle>
                    </DialogHeader>
                    <PermissionForm
                        permission={editingPermission || undefined}
                        mode={permissionFormMode}
                        onSubmit={_handlePermissionFormSubmit}
                        onCancel={() => {
                            setShowPermissionForm(false);
                            setEditingPermission(null);
                        }}
                        loading={false}
                    />
                </DialogContent>
            </Dialog>
            <ConfirmDialog
                open={!!roleToDelete}
                title={t('delete-role')}
                description={(
                    <span>
                        {t('confirm.delete-role')}
                        &nbsp;
                        <b>{roleToDelete?.name}</b>
                        ?
                    </span>
                )}
                onCancel={() => setRoleToDelete(null)}
                onConfirm={async () => {
                    if (!roleToDelete?.id) {
                        toast.error(t('error.role-not-found'));
                        return;
                    }
                    setDeletingRole(true);
                    await deleteRole({ id: roleToDelete.id });
                    setDeletingRole(false);
                    setRoleToDelete(null);
                    await refetchRoles();
                }}
                loading={deletingRole}
                confirmLabel={t('delete')}
                cancelLabel={t('cancel')}
            />
            <ConfirmDialog
                open={!!permissionToDelete}
                title={t('delete-permission')}
                description={(
                    <span>
                        {t('confirm.delete-permission')}
                        &nbsp;
                        <b>{permissionToDelete?.name}</b>
                        ?
                    </span>
                )}
                onCancel={() => setPermissionToDelete(null)}
                onConfirm={async () => {
                    if (!permissionToDelete?.id) {
                        toast.error(t('error.permission-not-found'));
                        return;
                    }
                    setDeleting(true);
                    await deletePermission({ id: permissionToDelete.id });
                    setDeleting(false);
                    setPermissionToDelete(null);
                    await refetchPermissions();
                }}
                loading={deleting}
                confirmLabel={t('delete')}
                cancelLabel={t('cancel')}
            />
            <ConfirmDialog
                open={!!userToDelete}
                title={t('deleteUser')}
                description={(
                    <span>
                        {t('deleteUser')}
                        &nbsp;
                        <b>{userToDelete?.username || userToDelete?.email}</b>
                        ?
                    </span>
                )}
                onCancel={() => setUserToDelete(null)}
                onConfirm={async () => {
                    if (!userToDelete?.id) {
                        toast.error(t('error.userNotFound'));
                        return;
                    }
                    setDeletingUser(true);
                    await deactivateUser({ id: userToDelete.id });
                    setDeletingUser(false);
                    setUserToDelete(null);
                    await refetchUsers?.();
                }}
                loading={deletingUser}
                confirmLabel={t('delete')}
                cancelLabel={t('cancel')}
            />

            <ConfirmDialog
                open={!!userToPermanentDelete}
                title={t('confirm-permanent-delete')}
                description={t('permanent-delete-message', {
                    username: userToPermanentDelete?.username || userToPermanentDelete?.email,
                })}
                onCancel={() => setUserToPermanentDelete(null)}
                onConfirm={async () => {
                    if (!userToPermanentDelete?.id) {
                        return;
                    }
                    setDeletingUser(true);
                    try {
                        await deleteUser({ id: userToPermanentDelete.id });
                        await refetchUsers?.();
                        setUserToPermanentDelete(null);
                    }
                    catch (error) {
                        console.error('Error permanently deleting user:', error);
                    }
                    finally {
                        setDeletingUser(false);
                    }
                }}
                loading={deletingUser}
            />

        </div>
    );
}

export default AuthzPage;
