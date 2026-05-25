import { useMutation, useQuery } from '@cyberskill/shared/react/apollo-client';
import { toast } from '@cyberskill/shared/react/toast';
import { useCallback, useEffect, useMemo, useState } from 'react';

import type {
    createUserMutationVariables,
    deleteUserMutationVariables,
    getBlocksQuery,
    getUsersQuery,
    getUsersQueryVariables,
    T_User,
    updateUserMutationVariables,
} from '#shared/graphql';

import { adminBlockUserDocument, adminUnBlockUserDocument, createUserDocument, deactivateUserDocument, deleteUserDocument, getBlocksDocument, getSubscriptionPriceDocument, getUsersDocument, updateUserDocument } from '#shared/graphql';
import { useTranslate } from '#shared/i18n';

export interface I_UsersResponse {
    users: T_User[];
    totalDocs: number;
    limit: number;
    page: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    loading: boolean;
    error: any;
    refetch: () => void;
}

export function useGetUsers(
    filter?: getUsersQueryVariables['filter'],
    options?: getUsersQueryVariables['options'] & { skip?: boolean },
): I_UsersResponse {
    const { t } = useTranslate('authz');

    const { skip, ...queryOptions } = options || {};

    const { data, loading, error, refetch } = useQuery<getUsersQuery, getUsersQueryVariables>(
        getUsersDocument,
        {
            variables: { filter, options: queryOptions },
            fetchPolicy: 'no-cache',
            notifyOnNetworkStatusChange: true,
            skip: skip ?? false,
        },
    );

    const users = _getUsersFromData(data);
    const totalDocs = data?.getUsers?.result?.totalDocs || 0;
    const limit = data?.getUsers?.result?.limit || 10;
    const page = data?.getUsers?.result?.page || 1;
    const totalPages = data?.getUsers?.result?.totalPages || 0;
    const hasNextPage = data?.getUsers?.result?.hasNextPage || false;
    const hasPrevPage = data?.getUsers?.result?.hasPrevPage || false;

    useEffect(() => {
        if (error) {
            toast.error(t('error.fetchUsersFailed') || 'Failed to fetch users');
        }
    }, [error, t]);

    return {
        users,
        totalDocs,
        limit,
        page,
        totalPages,
        hasNextPage,
        hasPrevPage,
        loading,
        error,
        refetch,
    };
}

function _getUsersFromData(data: getUsersQuery | undefined): T_User[] {
    return (data?.getUsers?.result?.docs || []).filter((u): u is T_User => u !== null);
}

export function useUsersWithPagination(initialPage = 1, initialLimit = 10) {
    const [page, setPage] = useState(initialPage);
    const [limit, setLimit] = useState(initialLimit);
    const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
    const [searchFilters, setSearchFilters] = useState({
        username: '',
        email: '',
        country: 'all',
        isActive: 'all', // 'all', 'active', 'inactive'
        membershipStatus: 'all', // 'all', 'free', 'paid'
        userStatus: 'all', // 'all', 'active', 'deactivated', 'blocked'
    });

    // 'free' membership, username/email text search, and country need client-side filtering
    const needsClientSideMembershipFilter = searchFilters.membershipStatus === 'free';
    const needsClientSideTextFilter = !!(searchFilters.username || searchFilters.email || (searchFilters.country !== 'all' && searchFilters.country));
    const shouldFetchAll = needsClientSideMembershipFilter || needsClientSideTextFilter;

    // Track the real total so we can re-fetch all when shouldFetchAll is true
    const [knownTotal, setKnownTotal] = useState(1000);
    const effectiveLimit = shouldFetchAll ? knownTotal : limit;

    const options = {
        page: shouldFetchAll ? 1 : page,
        limit: effectiveLimit,
        sort: { createdAt: -1 },
        populate: [
            'roles',
            'nativeLanguage',
            {
                path: 'partner1',
                populate: [
                    {
                        path: 'location',
                        populate: ['country'],
                    },
                ],
            },
        ],
    };

    // Build filter based on userStatus to fetch correct users from server
    // username/email/country are handled client-side — server only accepts exact String match
    const filter: any = {
        ...(selectedRoleId && { rolesIds: selectedRoleId }),
        ...(searchFilters.isActive !== 'all' && { isActive: searchFilters.isActive === 'active' }),
    };

    if (searchFilters.membershipStatus === 'paid') {
        filter.rolesNames = ['PAID_MEMBER'];
    }
    else if (searchFilters.membershipStatus === 'promo') {
        filter.rolesNames = ['PROMO_MEMBER'];
    }

    // Add isDeactivated, isAdminBlocked, and isDel filters based on userStatus
    if (searchFilters.userStatus === 'active') {
        filter.isActive = true;
        filter.isDel = false;
    }
    else if (searchFilters.userStatus === 'deactivated') {
        filter.isDeactivated = true;
        filter.isDel = true;
    }
    else if (searchFilters.userStatus === 'blocked') {
        filter.isAdminBlocked = true;
        filter.isDel = true;
    }
    else if (searchFilters.userStatus === 'deleted') {
        filter.isDel = true;
        filter.isDeactivated = false;
    }
    else {
        filter.isDel = false;
    }

    const { users: rawUsers, loading, error, refetch, totalDocs: serverTotalDocs, totalPages: serverTotalPages, hasNextPage: serverHasNextPage, hasPrevPage: serverHasPrevPage } = useGetUsers(filter, options);

    // Keep knownTotal up to date so next shouldFetchAll uses the real count
    useEffect(() => {
        if (serverTotalDocs > 0) {
            // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect
            setKnownTotal(prev => Math.max(prev, serverTotalDocs));
        }
    }, [serverTotalDocs]);

    const filteredUsers = useMemo(() => {
        return rawUsers.filter((user) => {
            if (searchFilters.username) {
                const usernameMatch = user?.username?.toLowerCase().includes(searchFilters.username.toLowerCase());
                if (!usernameMatch)
                    return false;
            }
            if (searchFilters.email) {
                const emailMatch = user?.email?.toLowerCase().includes(searchFilters.email.toLowerCase());
                if (!emailMatch)
                    return false;
            }
            if (searchFilters.country !== 'all' && searchFilters.country) {
                const countryMatch = user?.partner1?.location?.countryId === searchFilters.country;
                if (!countryMatch)
                    return false;
            }
            if (searchFilters.membershipStatus === 'free') {
                const hasPaidRole = user?.roles?.some(role => role?.name === 'PAID_MEMBER');
                const hasPromoRole = user?.roles?.some(role => role?.name === 'PROMO_MEMBER');
                if (hasPaidRole || hasPromoRole)
                    return false;
            }
            return true;
        });
    }, [rawUsers, searchFilters.username, searchFilters.email, searchFilters.country, searchFilters.membershipStatus]);

    // Client-side pagination only when fetching all (for search/membership filter)
    // Otherwise use server-side pagination
    const paginatedData = useMemo(() => {
        if (shouldFetchAll) {
            // Client-side pagination for filtered results
            const totalFiltered = filteredUsers.length;
            const totalPagesCalculated = Math.ceil(totalFiltered / limit);
            const startIndex = (page - 1) * limit;
            const endIndex = startIndex + limit;
            const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

            return {
                users: paginatedUsers,
                totalDocs: totalFiltered,
                totalPages: totalPagesCalculated,
                hasNextPage: page < totalPagesCalculated,
                hasPrevPage: page > 1,
            };
        }
        else {
            // Server-side pagination - use data directly from server
            return {
                users: filteredUsers,
                totalDocs: serverTotalDocs,
                totalPages: serverTotalPages,
                hasNextPage: serverHasNextPage,
                hasPrevPage: serverHasPrevPage,
            };
        }
    }, [shouldFetchAll, filteredUsers, page, limit, serverTotalDocs, serverTotalPages, serverHasNextPage, serverHasPrevPage]);

    const goToPage = useCallback((newPage: number) => {
        setPage(newPage);
    }, []);

    const goToNextPage = useCallback(() => {
        if (paginatedData.hasNextPage) {
            setPage(prev => prev + 1);
        }
    }, [paginatedData.hasNextPage]);

    const goToPrevPage = useCallback(() => {
        if (paginatedData.hasPrevPage) {
            setPage(prev => prev - 1);
        }
    }, [paginatedData.hasPrevPage]);

    const changeLimit = useCallback((newLimit: number) => {
        setLimit(newLimit);
        setPage(1);
    }, []);

    const filterByRole = useCallback((roleId: string | null) => {
        setSelectedRoleId(roleId);
        setPage(1);
    }, []);

    const updateSearchFilters = useCallback((newFilters: Partial<typeof searchFilters>) => {
        setSearchFilters((prev) => {
            const next = { ...prev, ...newFilters };
            // If a base filter changes (not text), reset knownTotal so the new context is re-measured
            const baseFilterChanged
                = newFilters.country !== undefined
                    || newFilters.membershipStatus !== undefined
                    || newFilters.userStatus !== undefined
                    || newFilters.isActive !== undefined;
            if (baseFilterChanged) {
                setKnownTotal(1000);
            }
            return next;
        });
        setPage(1);
    }, []);

    const clearSearchFilters = useCallback(() => {
        setSearchFilters({
            username: '',
            email: '',
            country: 'all',
            isActive: 'all',
            membershipStatus: 'all',
            userStatus: 'all',
        });
        setPage(1);
    }, []);

    return {
        users: paginatedData.users,
        totalDocs: paginatedData.totalDocs,
        totalPages: paginatedData.totalPages,
        page,
        limit,
        hasNextPage: paginatedData.hasNextPage,
        hasPrevPage: paginatedData.hasPrevPage,
        loading,
        error,
        selectedRoleId,
        searchFilters,
        goToPage,
        goToNextPage,
        goToPrevPage,
        changeLimit,
        filterByRole,
        updateSearchFilters,
        clearSearchFilters,
        refetch,
    };
}

export function useCreateUser() {
    const [createUserMutation, { loading }] = useMutation(createUserDocument, {
        onCompleted: (response) => {
            const { success, message } = response.createUser;
            if (success) {
                toast.success('User created successfully');
            }
            else {
                toast.error(message || 'Failed to create user');
            }
        },
        onError: (error) => {
            toast.error(error.message);
        },
    });

    const createUser = useCallback((userData: createUserMutationVariables['doc']) => {
        return createUserMutation({ variables: { doc: userData } });
    }, [createUserMutation]);

    return {
        createUser,
        loading,
    };
}

export function useUpdateUser() {
    const [updateUserMutation, { loading }] = useMutation(updateUserDocument, {
        onCompleted: (response) => {
            const { success, message } = response.updateUser;
            if (success) {
                toast.success('User updated successfully');
            }
            else {
                toast.error(message || 'Failed to update user');
            }
        },
        onError: (error) => {
            toast.error(error.message);
        },
    });

    const normalizeDateInput = (value: unknown): string | number | null | undefined => {
        if (value === null)
            return null;
        if (value instanceof Date)
            return value.toISOString();
        if (typeof value === 'string' || typeof value === 'number')
            return value;
        if (value && typeof value === 'object' && typeof (value as { toISOString?: () => string }).toISOString === 'function') {
            return (value as { toISOString: () => string }).toISOString();
        }
        return undefined;
    };

    const updateUser = useCallback((filter: updateUserMutationVariables['filter'], userData: updateUserMutationVariables['update'], options?: updateUserMutationVariables['options']) => {
        const update = { ...userData } as Record<string, unknown>;
        if (Object.hasOwn(update, 'membershipExpiresAt')) {
            const normalized = normalizeDateInput(update['membershipExpiresAt']);
            if (normalized === undefined) {
                delete update['membershipExpiresAt'];
            }
            else {
                update['membershipExpiresAt'] = normalized;
            }
        }
        return updateUserMutation({ variables: { filter, update: update as updateUserMutationVariables['update'], options } });
    }, [updateUserMutation]);

    return {
        updateUser,
        loading,
    };
}

export function useDeleteUser() {
    const [deleteUserMutation, { loading }] = useMutation(deleteUserDocument, {
        onCompleted: (response) => {
            const { success, message } = response.deleteUser;
            if (success) {
                toast.success('User permanently deleted successfully');
            }
            else {
                toast.error(message || 'Failed to delete user');
            }
        },
        onError: (error) => {
            toast.error(error.message);
        },
    });

    const deleteUser = useCallback((filter: deleteUserMutationVariables['filter'], options?: deleteUserMutationVariables['options']) => {
        return deleteUserMutation({ variables: { filter, options } });
    }, [deleteUserMutation]);

    return {
        deleteUser,
        loading,
    };
}

export function useDeactivateUser() {
    const [deactivateUserMutation, { loading }] = useMutation(deactivateUserDocument, {
        onCompleted: (response) => {
            const { success, message } = response.deactivateUser;
            if (success) {
                toast.success('User deactivated successfully');
            }
            else {
                toast.error(message || 'Failed to deactivate user');
            }
        },
        onError: (error) => {
            toast.error(error.message);
        },
    });

    const deactivateUser = useCallback((filter: { id: string }) => {
        return deactivateUserMutation({ variables: { filter } });
    }, [deactivateUserMutation]);

    return {
        deactivateUser,
        loading,
    };
}

export function useRestoreUser() {
    const [updateUserMutation, { loading }] = useMutation(updateUserDocument, {
        onCompleted: (response) => {
            const { success, message } = response.updateUser;
            if (success) {
                toast.success('User restored successfully');
            }
            else {
                toast.error(message || 'Failed to restore user');
            }
        },
        onError: (error) => {
            toast.error(error.message);
        },
    });

    const restoreUser = useCallback((filter: { id: string }) => {
        return updateUserMutation({
            variables: {
                filter,
                update: { isDel: false, isDeactivated: false },
                options: {},
            },
        });
    }, [updateUserMutation]);

    return {
        restoreUser,
        loading,
    };
}

export function usePermanentDeleteUser() {
    const [deleteUserMutation, { loading }] = useMutation(deleteUserDocument, {
        onCompleted: (response) => {
            const { success, message } = response.deleteUser;
            if (success) {
                toast.success('User permanently deleted successfully');
            }
            else {
                toast.error(message || 'Failed to permanently delete user');
            }
        },
        onError: (error) => {
            toast.error(error.message);
        },
    });

    const permanentDeleteUser = useCallback((filter: deleteUserMutationVariables['filter'], options?: deleteUserMutationVariables['options']) => {
        return deleteUserMutation({ variables: { filter, options } });
    }, [deleteUserMutation]);

    return {
        permanentDeleteUser,
        loading,
    };
}

export function useGetSubscriptionPrice() {
    const { data, loading, error, refetch } = useQuery(getSubscriptionPriceDocument);

    const getSubscriptionPrice = useCallback(async () => {
        try {
            const result = await refetch();
            return result.data?.getSubscriptionPrice;
        }
        catch (error) {
            console.error('Failed to get subscription price:', error);
            return null;
        }
    }, [refetch]);

    return {
        getSubscriptionPrice,
        pricing: data?.getSubscriptionPrice,
        loading,
        error,
    };
}

// Block/Unblock user hooks
export function useAdminBlockUser() {
    const { t } = useTranslate('user');

    const [adminBlockUserMutation, { loading }] = useMutation(
        adminBlockUserDocument,
        {
            onCompleted: (response) => {
                const { success, message } = response.adminBlockUser;
                if (success) {
                    toast.success(t('user-blocked-successfully') || 'User blocked successfully');
                }
                else {
                    toast.error(message || t('failed-to-block-user') || 'Failed to block user');
                }
            },
            onError: (error) => {
                toast.error(error.message);
            },
        },
    );

    const adminBlockUser = useCallback((userId: string) => {
        return adminBlockUserMutation({
            variables: {
                doc: { userId },
            },
        });
    }, [adminBlockUserMutation]);

    return {
        adminBlockUser,
        loading,
    };
}

export function useAdminUnblockUser() {
    const { t } = useTranslate('user');

    const [adminUnblockUserMutation, { loading }] = useMutation(
        adminUnBlockUserDocument,
        {
            onCompleted: (response) => {
                const { success, message } = response.adminUnBlockUser;
                if (success) {
                    toast.success(t('user-unblocked-successfully') || 'User unblocked successfully');
                }
                else {
                    toast.error(message || t('failed-to-unblock-user') || 'Failed to unblock user');
                }
            },
            onError: (error) => {
                toast.error(error.message);
            },
        },
    );

    const adminUnblockUser = useCallback((userId: string) => {
        return adminUnblockUserMutation({
            variables: {
                filter: { userId },
            },
        });
    }, [adminUnblockUserMutation]);

    return {
        adminUnblockUser,
        loading,
    };
}

// Hook để lấy danh sách blocks
export function useGetBlocks() {
    const { t } = useTranslate('user');

    const { data, loading, error, refetch } = useQuery<getBlocksQuery>(getBlocksDocument, {
        variables: { options: {} },
        fetchPolicy: 'network-only',
    });

    const blocks = data?.getBlocks?.result?.docs || [];

    useEffect(() => {
        if (error) {
            toast.error(t('error.fetchBlocksFailed') || 'Failed to fetch blocks');
        }
    }, [error, t]);

    return {
        blocks,
        loading,
        error,
        refetch,
    };
}
