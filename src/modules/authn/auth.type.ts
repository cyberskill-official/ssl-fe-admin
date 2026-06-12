import type { useQuery } from '@cyberskill/shared/react/apollo-client';

import type { loginMutationVariables, T_Auth } from '#shared/graphql';

type T_AuthError = ReturnType<typeof useQuery>['error'];

export interface I_Auth extends T_Auth {
    isLoggedIn: boolean;
}

export interface I_AuthContext {
    isLoading: boolean;
    error: T_AuthError;
    checkAuth: () => void;
    auth: I_Auth | undefined;
    setAuth: React.Dispatch<React.SetStateAction<I_Auth | undefined>>;
    login: (variables: loginMutationVariables, callback?: () => void) => void;
    logout: (callback?: () => void) => void;
    visitWebsite: () => Promise<void>;
}
