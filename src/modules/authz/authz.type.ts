import type { E_PermissionType, T_Permission, T_Role } from '#shared/graphql';

// UI Component types
export interface I_RoleWithPermissions extends T_Role {
    permissions?: T_Permission[];
}

export interface I_PermissionGroup {
    type: E_PermissionType;
    permissions: T_Permission[];
}

export interface I_RolePermissionAssignment {
    roleId: string;
    permissionId: string;
    assigned: boolean;
}
