import type { I_Children } from '@cyberskill/shared/typescript';

import { Loading } from '@cyberskill/shared/react/loading';
import { useMemo } from 'react';
import { Navigate, useLocation } from 'react-router';

import { PUBLIC_ROUTES, ROUTES } from '#shared/constant';

import { useAuth } from './auth.hook';

export function AuthGuard({ children }: I_Children) {
    const { auth } = useAuth();
    const { pathname, search } = useLocation();
    const isLoggedIn = !!auth?.isLoggedIn;
    const isPublic = PUBLIC_ROUTES.some(route => pathname === route || pathname.startsWith(`${route}/`));
    const currentPath = `${pathname}${search}`;
    const redirectPath = `${ROUTES.AUTH.LOGIN}?redirect=${encodeURIComponent(currentPath)}`;
    const redirectTo = useMemo(() => {
        const searchParams = new URLSearchParams(search);
        const param = searchParams.get('redirect');

        return param && decodeURIComponent(param);
    }, [search]);

    if (auth === undefined && !isPublic) {
        return <Loading full />;
    }

    if (!isLoggedIn && !isPublic) {
        return <Navigate to={redirectPath} replace />;
    }

    if (isLoggedIn && redirectTo && redirectTo !== currentPath) {
        return <Navigate to={redirectTo} replace />;
    }

    return children;
}
