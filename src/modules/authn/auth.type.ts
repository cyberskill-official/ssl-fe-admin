import type { ApolloError } from '@cyberskill/shared/react/apollo-error';

import type { loginMutationVariables, T_Auth } from '#shared/graphql';

export interface I_Auth extends T_Auth {
    isLoggedIn: boolean;
}

export interface I_AuthContext {
    isLoading: boolean;
    error: ApolloError | undefined;
    checkAuth: () => void;
    auth: I_Auth | undefined;
    setAuth: React.Dispatch<React.SetStateAction<I_Auth | undefined>>;
    login: (variables: loginMutationVariables, callback?: () => void) => void;
    logout: (callback?: () => void) => void;
    visitWebsite: () => Promise<void>;
}
