import { useMutation, useQuery } from '@cyberskill/shared/react/apollo-client';
import { toast } from '@cyberskill/shared/react/toast';
import { useCallback } from 'react';

import type {
    createRoleMutation,
    createRoleMutationVariables,
    deleteRoleMutation,
    deleteRoleMutationVariables,
    getRolesQuery,
    getRolesQueryVariables,
    updateRoleMutation,
    updateRoleMutationVariables,
} from '#shared/graphql';

import {
    createRoleDocument,
    deleteRoleDocument,
    getRolesDocument,
    updateRoleDocument,
} from '#shared/graphql';

export function useGetRoles(
    filter?: getRolesQueryVariables['filter'],
    options?: getRolesQueryVariables['options'],
) {
    const { data, loading, refetch } = useQuery<getRolesQuery, getRolesQueryVariables>(
        getRolesDocument,
        {
            variables: { filter, options },
            fetchPolicy: 'network-only',
        },
    );

    const roles = data?.getRoles?.result?.docs || [];
    const totalDocs = data?.getRoles?.result?.totalDocs || 0;
    const totalPages = data?.getRoles?.result?.totalPages || 1;
    const hasNextPage = data?.getRoles?.result?.hasNextPage || false;
    const hasPrevPage = data?.getRoles?.result?.hasPrevPage || false;
    const page = data?.getRoles?.result?.page || 1;
    const limit = data?.getRoles?.result?.limit || 10;

    return {
        roles,
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

export function useCreateRole() {
    const [createRole, { loading }] = useMutation<createRoleMutation, createRoleMutationVariables>(
        createRoleDocument,
        {
            onCompleted: (response) => {
                const { success, message } = response.createRole;

                if (success) {
                    toast.success('Role created successfully');
                }
                else {
                    toast.error(message || 'Failed to create role');
                }
            },
            onError: (error) => {
                toast.error(error.message);
            },
        },
    );

    const execute = useCallback((roleData: createRoleMutationVariables['doc']) => {
        return createRole({
            variables: { doc: roleData },
        });
    }, [createRole]);

    return {
        createRole: execute,
        loading,
    };
}

export function useUpdateRole() {
    const [updateRole, { loading }] = useMutation<updateRoleMutation, updateRoleMutationVariables>(
        updateRoleDocument,
        {
            onCompleted: (response) => {
                const { success, message } = response.updateRole;

                if (success) {
                    toast.success('Role updated successfully');
                }
                else {
                    toast.error(message || 'Failed to update role');
                }
            },
            onError: (error) => {
                toast.error(error.message);
            },
        },
    );

    const execute = useCallback((
        filter: updateRoleMutationVariables['filter'],
        update?: updateRoleMutationVariables['update'],
        options?: updateRoleMutationVariables['options'],
    ) => {
        return updateRole({
            variables: { filter, update, options },
        });
    }, [updateRole]);

    return {
        updateRole: execute,
        loading,
    };
}

export function useDeleteRole() {
    const [deleteRole, { loading }] = useMutation<deleteRoleMutation, deleteRoleMutationVariables>(
        deleteRoleDocument,
        {
            onCompleted: (response) => {
                const { success, message } = response.deleteRole;

                if (success) {
                    toast.success('Role deleted successfully');
                }
                else {
                    toast.error(message || 'Failed to delete role');
                }
            },
            onError: (error) => {
                toast.error(error.message);
            },
        },
    );

    const execute = useCallback((
        filter: deleteRoleMutationVariables['filter'],
        options?: deleteRoleMutationVariables['options'],
    ) => {
        return deleteRole({
            variables: { filter, options },
        });
    }, [deleteRole]);

    return {
        deleteRole: execute,
        loading,
    };
}
