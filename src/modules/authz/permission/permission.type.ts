import type { T_Permission } from '#shared/graphql';

export interface I_PermissionFormProps {
    permission?: T_Permission;
    mode: 'create' | 'edit';
    onSubmit: (data: Partial<T_Permission>) => void;
    onCancel: () => void;
    loading?: boolean;
}

export interface I_PermissionListProps {
    permissions: T_Permission[];
    loading?: boolean;
    onTogglePublic?: (permissionId: string, currentIsPublic: boolean) => void;
    onToggleActive?: (permissionId: string, currentIsActive: boolean) => void;
    updatingPublicId?: string;
    updatingActiveId?: string;
    selectedRoleId?: string | null;
    isPermissionActive?: (permissionId: string) => boolean;
    onEditPermission?: (permission: T_Permission) => void;
    onCreatePermission?: () => void;
    onDeletePermission?: (permission: T_Permission) => void;
}
