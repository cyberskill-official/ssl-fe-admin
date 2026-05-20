/* eslint-disable react-hooks-extra/no-direct-set-state-in-use-effect */
import type { I_Children } from '@cyberskill/shared/typescript';

import { useMutation, useQuery } from '@cyberskill/shared/react/apollo-client';
import { Loading } from '@cyberskill/shared/react/loading';
import { toast } from '@cyberskill/shared/react/toast';
import { useCallback, useEffect, useMemo, useState } from 'react';

import type {
    checkAuthQuery,
    checkAuthQueryVariables,
    createGuardianVisitTokenMutation,
    createGuardianVisitTokenMutationVariables,
    loginMutation,
    loginMutationVariables,
    logoutMutation,
    logoutMutationVariables,
} from '#shared/graphql';

import {
    checkAuthDocument,
    createGuardianVisitTokenDocument,
    E_LoginType,
    loginDocument,
    logoutDocument,
} from '#shared/graphql';
import { useTranslate } from '#shared/i18n';

import type { I_Auth, I_AuthContext } from './auth.type';

import { AuthContext } from './auth.context';
import { useAuthStorage } from './auth.storage';

export function AuthProvider({ children }: I_Children) {
    const token = useAuthStorage<string>('token');
    const { t } = useTranslate('auth');
    const [auth, setAuth] = useState<I_Auth | undefined>(undefined);
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    // Always run checkAuth on mount — auth is cookie-based (credentials: 'include'),
    // so the query works even without a token in localStorage.
    // Token variable is optional and only passed if available in storage.
    const { data, loading: loadingCheckAuth, error: errorCheckAuth, refetch: refetchCheckAuth } = useQuery<checkAuthQuery, checkAuthQueryVariables>(checkAuthDocument, {
        fetchPolicy: 'network-only',
        notifyOnNetworkStatusChange: false,
        ...(token.value && {
            variables: {
                token: token.value,
            },
        }),
    });

    useEffect(() => {
        if (data?.checkAuth) {
            const { success, result } = data.checkAuth;

            setAuth({
                isLoggedIn: success,
                ...(result?.user && { user: result?.user }),
                ...(result?.token && { token: result?.token }),
            });
            if (result?.token) {
                token.set(result.token);
            }
            setIsInitialLoad(false);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data]);

    useEffect(() => {
        if (errorCheckAuth) {
            token.remove();
            setAuth({
                isLoggedIn: false,
            });
            setIsInitialLoad(false);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [errorCheckAuth]);

    const [login, { loading: loadingLogin }] = useMutation<loginMutation, loginMutationVariables>(loginDocument, {
        onCompleted: async (response) => {
            const { success, message, result } = response.login;

            if (success) {
                toast.success(t('login.toast.success'));
            }
            else {
                if (message) {
                    toast.error(message);
                }
            }

            setAuth({
                isLoggedIn: success,
                ...(result?.user && { user: result?.user }),
                ...(result?.token && { token: result?.token }),
            });
        },
    });

    const [logout, { loading: loadingLogout }] = useMutation<logoutMutation, logoutMutationVariables>(logoutDocument, {
        onCompleted: async (response) => {
            const { success } = response.logout;

            if (success) {
                toast.success(t('logout.toast.success'));
            }

            setAuth({
                isLoggedIn: !success,
            });
        },
    });

    const [createGuardianVisitToken, { loading: loadingGuardianToken }] = useMutation<createGuardianVisitTokenMutation, createGuardianVisitTokenMutationVariables>(createGuardianVisitTokenDocument);

    const _handleLogin = useCallback((variables: loginMutationVariables, callback?: () => void) => {
        const loginVariables = {
            ...variables,
            loginType: E_LoginType.ADMIN,
        };

        login({ variables: loginVariables }).then((response) => {
            if (response.data?.login.success && response.data.login.result?.token) {
                token.set(response.data.login.result.token, !!loginVariables.rememberMe);
            }
            if (callback) {
                callback();
            }
        });
    }, [login, token]);

    const _handleLogout = useCallback((callback?: () => void) => {
        logout().then(() => {
            token.remove();

            if (callback) {
                callback();
            }
        });
    }, [logout, token]);

    const _handleVisitWebsite = useCallback(async () => {
        try {
            const response = await createGuardianVisitToken();

            if (response.data?.createGuardianVisitToken.success && response.data.createGuardianVisitToken.result?.token) {
                const guardianToken = response.data.createGuardianVisitToken.result.token;
                const userWebsiteUrl = import.meta.env['VITE_USER_WEBSITE_URL'] || 'https://development.secretswingerlust.com';
                const targetUrl = `${userWebsiteUrl}/home?guardian_token=${guardianToken}`;

                window.open(targetUrl, '_blank', 'noopener,noreferrer');
                toast.success('Guardian access token created. Opening user website...');
            }
            else {
                toast.error(response.data?.createGuardianVisitToken.message || 'Failed to create guardian token');
            }
        }
        catch (error) {
            console.error('Guardian visit error:', error);
            toast.error('Failed to create guardian access token');
        }
    }, [createGuardianVisitToken]);

    const isLoading = loadingLogin || loadingLogout || loadingGuardianToken;

    const contextValue: I_AuthContext = useMemo(() => ({
        isLoading,
        error: errorCheckAuth,
        auth,
        setAuth,
        checkAuth: refetchCheckAuth,
        login: _handleLogin,
        logout: _handleLogout,
        visitWebsite: _handleVisitWebsite,
    }), [isLoading, errorCheckAuth, auth, refetchCheckAuth, _handleLogin, _handleLogout, _handleVisitWebsite]);

    // Only show loading on initial auth check
    if (isInitialLoad && loadingCheckAuth) {
        return <Loading full />;
    }

    return (
        <AuthContext value={contextValue}>
            {children}
        </AuthContext>
    );
}
