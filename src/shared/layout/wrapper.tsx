import type { I_Children } from '@cyberskill/shared/typescript';

import { ApolloProvider } from '@cyberskill/shared/react/apollo-client';
import { LoadingProvider } from '@cyberskill/shared/react/loading';
import { Userback } from '@cyberskill/shared/react/userback';

import { AuthGuard, AuthProvider } from '#modules/authn';

import { getEnv } from '../env';

export function LayoutWrapper({ children }: I_Children) {
    const env = getEnv();
    const uri = `${env.VITE_API_BASE_ENDPOINT}${env.VITE_API_GRAPHQL_ENDPOINT}`;
    const userbackCode = env.VITE_USERBACK_CODE;

    return (
        <>
            <ApolloProvider options={{ uri }}>
                <LoadingProvider>
                    <AuthProvider>
                        <AuthGuard>
                            {children}
                        </AuthGuard>
                    </AuthProvider>
                </LoadingProvider>
            </ApolloProvider>
            <Userback
                token={userbackCode}
                options={{
                    hide: ['ubfooter', '.main .region-actions'],
                }}
            />
        </>
    );
}
