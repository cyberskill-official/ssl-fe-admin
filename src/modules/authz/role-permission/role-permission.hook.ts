import { useMutation, useQuery } from '@cyberskill/shared/react/apollo-client';
import { toast } from '@cyberskill/shared/react/toast';
import { useCallback } from 'react';

import type { createRolePermissionMutation, createRolePermissionMutationVariables, deleteRolePermissionMutation, deleteRolePermissionMutationVariables, getRolePermissionsQuery, getRolePermissionsQueryVariables } from '#shared/graphql';

import {
    createRolePermissionDocument,
    deleteRolePermissionDocument,
    getRolePermissionsDocument,
} from '#shared/graphql';

export function useGetRolePermissions(
    filter?: getRolePermissionsQueryVariables['filter'],
    options?: getRolePermissionsQueryVariables['options'],
) {
    const { data, loading, refetch } = useQuery<getRolePermissionsQuery, getRolePermissionsQueryVariables>(getRolePermissionsDocument, {
        variables: { filter, options },
        fetchPolicy: 'network-only',
    });

    const rolePermissions = data?.getRolePermissions?.result?.docs || [];
    const totalDocs = data?.getRolePermissions?.result?.totalDocs || 0;
    const totalPages = data?.getRolePermissions?.result?.totalPages || 1;
    const hasNextPage = data?.getRolePermissions?.result?.hasNextPage || false;
    const hasPrevPage = data?.getRolePermissions?.result?.hasPrevPage || false;
    const page = data?.getRolePermissions?.result?.page || 1;
    const limit = data?.getRolePermissions?.result?.limit || 10;

    return {
        rolePermissions,
        totalDocs,
        totalPages,
        hasNextPage,
        hasPrevPage,
        page,
        limit,
        loading,
        refetch,
    };
}

export function useCreateRolePermission() {
    const [createRolePermission, { loading }] = useMutation<createRolePermissionMutation, createRolePermissionMutationVariables>(createRolePermissionDocument, {
        onCompleted: (response) => {
            const { success, message } = response.createRolePermission;

            if (success) {
                toast.success('Role permission assigned successfully');
            }
            else {
                toast.error(message || 'Failed to assign role permission');
            }
        },
        onError: (error) => {
            toast.error(error.message);
        },
    });

    const execute = useCallback((rolePermissionData: { roleId: string; permissionId: string }) => {
        return createRolePermission({
            variables: {
                doc: rolePermissionData,
            },
        });
    }, [createRolePermission]);

    return {
        createRolePermission: execute,
        loading,
    };
}

export function useDeleteRolePermission() {
    const [deleteRolePermission, { loading }] = useMutation<deleteRolePermissionMutation, deleteRolePermissionMutationVariables>(deleteRolePermissionDocument, {
        onCompleted: (response) => {
            const { success, message } = response.deleteRolePermission;

            if (success) {
                toast.success('Role permission removed successfully');
            }
            else {
                toast.error(message || 'Failed to remove role permission');
            }
        },
        onError: (error) => {
            toast.error(error.message);
        },
    });

    const execute = useCallback((filter: { roleId: string; permissionId: string }) => {
        return deleteRolePermission({
            variables: {
                filter,
            },
        });
    }, [deleteRolePermission]);

    return {
        deleteRolePermission: execute,
        loading,
    };
}
