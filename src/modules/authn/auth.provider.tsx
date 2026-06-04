/* eslint-disable react-hooks-extra/no-direct-set-state-in-use-effect */
import type { I_Children } from '@cyberskill/shared/typescript';

import { useMutation, useQuery } from '@cyberskill/shared/react/apollo-client';
import { Loading } from '@cyberskill/shared/react/loading';
import { toast } from '@cyberskill/shared/react/toast';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

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

import { Button } from '#shared/component';
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
    const [sessionConflict, setSessionConflict] = useState(false);
    const loadedTokenRef = useRef<string | undefined>(undefined);

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
                loadedTokenRef.current = result.token;
                token.set(result.token);
            }
            setIsInitialLoad(false);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data]);

    useEffect(() => {
        if (errorCheckAuth) {
            loadedTokenRef.current = undefined;
            token.remove();
            setAuth({
                isLoggedIn: false,
            });
            setIsInitialLoad(false);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [errorCheckAuth]);

    useEffect(() => {
        if (auth?.isLoggedIn && loadedTokenRef.current) {
            if (token.value !== loadedTokenRef.current) {
                setSessionConflict(true);
            }
        }
    }, [token.value, auth]);

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
                const newTokenVal = response.data.login.result.token;
                loadedTokenRef.current = newTokenVal;
                token.set(newTokenVal, !!loginVariables.rememberMe);
            }
            if (callback) {
                callback();
            }
        });
    }, [login, token]);

    const _handleLogout = useCallback((callback?: () => void) => {
        loadedTokenRef.current = undefined;
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
            {sessionConflict && (
                <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-fade-in-custom">
                    <style>
                        {`
                        @keyframes fadeIn {
                            from { opacity: 0; }
                            to { opacity: 1; }
                        }
                        @keyframes scaleUp {
                            from { transform: scale(0.95); opacity: 0; }
                            to { transform: scale(1); opacity: 1; }
                        }
                        @keyframes spinSlow {
                            from { transform: rotate(0deg); }
                            to { transform: rotate(360deg); }
                        }
                        .animate-fade-in-custom {
                            animation: fadeIn 0.3s ease-out forwards;
                        }
                        .animate-scale-up-custom {
                            animation: scaleUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
                        }
                        .animate-spin-slow-custom {
                            animation: spinSlow 3s linear infinite;
                        }
                    `}
                    </style>
                    <div className="relative bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl p-8 max-w-md w-full shadow-2xl border border-white/20 dark:border-slate-800/40 text-center space-y-6 overflow-hidden animate-scale-up-custom">
                        {/* Ambient background glows */}
                        <div className="absolute -top-10 -left-10 w-40 h-40 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
                        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

                        <div className="relative">
                            <div className="w-20 h-20 bg-rose-100 dark:bg-rose-950/40 rounded-2xl flex items-center justify-center mx-auto text-rose-500 dark:text-rose-400 shadow-inner border border-rose-200/50 dark:border-rose-900/30 animate-pulse">
                                <AlertTriangle className="w-10 h-10 stroke-[2]" />
                            </div>
                        </div>

                        <div className="space-y-3 relative z-10">
                            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white bg-gradient-to-r from-rose-500 to-amber-500 bg-clip-text text-transparent">
                                {t('sessionConflict.title')}
                            </h2>
                            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                                {t('sessionConflict.description')}
                            </p>
                        </div>

                        <div className="relative z-10">
                            <Button
                                onClick={() => window.location.reload()}
                                className="w-full bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white font-semibold py-6 rounded-2xl transition-all duration-300 shadow-lg shadow-rose-500/20 hover:shadow-rose-600/30 hover:scale-[1.02] active:scale-[0.98] border-none text-base"
                            >
                                <RefreshCw className="w-5 h-5 mr-2 animate-spin-slow-custom" />
                                {t('sessionConflict.reloadButton')}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </AuthContext>
    );
}
