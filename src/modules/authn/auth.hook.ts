import { use } from 'react';

import type { I_AuthContext } from './auth.type';

import { AuthContext } from './auth.context';

export function useAuth(): I_AuthContext {
    const context = use(AuthContext);

    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }

    return context;
}
