import type { T_Role } from '#shared/graphql';

import type { I_PermissionGroup } from '../authz.type';

export interface I_RolePermissionProps {
    roles: T_Role[];
    permissions: I_PermissionGroup[];
    rolePermissions: Array<{ roleId: string; permissionId: string; assigned: boolean }>;
    onAssignPermission: (roleId: string, permissionId: string, assigned: boolean) => void;
    onBulkAssign: (roleId: string, permissionIds: string[], assigned: boolean) => void;
    loading?: boolean;
}
