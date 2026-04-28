import type { T_Role, T_User } from '#shared/graphql';

export interface I_UserListProps {
    users: T_User[];
    loading: boolean;
    totalDocs: number;
    page: number;
    totalPages: number;
    limit: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    onPageChange: (page: number) => void;
    onLimitChange: (limit: number) => void;
    onPermanentDelete?: (user: T_User) => void;
    onDeleteUser?: (user: T_User) => void;
    onRestoreUser?: (user: T_User) => void;
    onRefresh?: () => void;
}

export interface I_UserFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (data: { username: string; email: string; password: string; rolesIds: string[] }) => void;
    onCancel: () => void;
    allRoles: T_Role[];
    defaultRoles?: string[];
    loading?: boolean;
    readonlyRoles?: string[];
    user?: T_User;
    mode?: 'create' | 'edit';
}
