import type { T_Role } from '#shared/graphql';

export interface I_RoleTreeProps {
    roles: T_Role[];
    onEdit: (role: T_Role) => void;
    onDelete: (role: T_Role) => void;
    onCreateNew: () => void;
    loading?: boolean;
    selectedRoleId?: string | null;
    onSelectRole?: (roleId: string | null) => void;
}

export interface I_TreeNode extends T_Role {
    children: I_TreeNode[];
    expanded?: boolean;
}

export interface I_RoleFormProps {
    role?: T_Role;
    onSubmit: (data: Partial<T_Role>) => void;
    onCancel: () => void;
    loading?: boolean;
    allRoles?: T_Role[];
}
