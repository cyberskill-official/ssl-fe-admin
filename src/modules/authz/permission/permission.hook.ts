import { useMutation, useQuery } from '@cyberskill/shared/react/apollo-client';
import { toast } from '@cyberskill/shared/react/toast';
import { useCallback } from 'react';

import type { createPermissionMutation, createPermissionMutationVariables, deletePermissionMutation, deletePermissionMutationVariables, getPermissionsQuery, getPermissionsQueryVariables, T_Permission, updatePermissionMutation, updatePermissionMutationVariables } from '#shared/graphql';

import { createPermissionDocument, deletePermissionDocument, getPermissionsDocument, updatePermissionDocument } from '#shared/graphql';

export function useGetPermissions(
    filter?: getPermissionsQueryVariables['filter'],
    options?: getPermissionsQueryVariables['options'],
) {
    const { data, loading, refetch } = useQuery<getPermissionsQuery, getPermissionsQueryVariables>(getPermissionsDocument, {
        variables: { filter, options },
        fetchPolicy: 'network-only',
    });

    const permissions = data?.getPermissions?.result?.docs || [];
    const totalDocs = data?.getPermissions?.result?.totalDocs || 0;
    const totalPages = data?.getPermissions?.result?.totalPages || 1;
    const hasNextPage = data?.getPermissions?.result?.hasNextPage || false;
    const hasPrevPage = data?.getPermissions?.result?.hasPrevPage || false;
    const page = data?.getPermissions?.result?.page || 1;
    const limit = data?.getPermissions?.result?.limit || 10;

    return {
        permissions,
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

export function useCreatePermission() {
    const [createPermission, { loading }] = useMutation<createPermissionMutation, createPermissionMutationVariables>(createPermissionDocument, {
        onCompleted: (response) => {
            const { success, message } = response.createPermission;

            if (success) {
                toast.success('Permission created successfully');
            }
            else {
                toast.error(message || 'Failed to create permission');
            }
        },
        onError: (error) => {
            toast.error(error.message);
        },
    });

    const execute = useCallback((permissionData: { name: string; target: string; isPublic?: boolean }) => {
        return createPermission({
            variables: {
                doc: permissionData,
            },
        });
    }, [createPermission]);

    return {
        createPermission: execute,
        loading,
    };
}

export function useUpdatePermission() {
    const [updatePermission, { loading }] = useMutation<updatePermissionMutation, updatePermissionMutationVariables>(updatePermissionDocument, {
        onCompleted: (response) => {
            const { success, message } = response.updatePermission;

            if (success) {
                toast.success('Permission updated successfully');
            }
            else {
                toast.error(message || 'Failed to update permission');
            }
        },
        onError: (error) => {
            toast.error(error.message);
        },
    });

    const execute = useCallback((filter: { id: string }, update: Partial<T_Permission>) => {
        return updatePermission({
            variables: {
                filter,
                update,
            },
        });
    }, [updatePermission]);

    return {
        updatePermission: execute,
        loading,
    };
}

export function useDeletePermission() {
    const [deletePermission, { loading }] = useMutation<deletePermissionMutation, deletePermissionMutationVariables>(deletePermissionDocument, {
        onCompleted: (response) => {
            const { success, message } = response.deletePermission;
            if (success) {
                toast.success('Permission deleted successfully');
            }
            else {
                toast.error(message || 'Failed to delete permission');
            }
        },
        onError: (error) => {
            toast.error(error.message);
        },
    });

    const execute = useCallback((filter: { id: string }) => {
        return deletePermission({
            variables: {
                filter,
            },
        });
    }, [deletePermission]);

    return {
        deletePermission: execute,
        loading,
    };
}
