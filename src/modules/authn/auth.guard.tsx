import type { I_Children } from '@cyberskill/shared/typescript';

import { useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router';

import { PUBLIC_ROUTES, ROUTES } from '#shared/constant';

import { useAuth } from './auth.hook';

export function AuthGuard({ children }: I_Children) {
    const { auth } = useAuth();
    const navigate = useNavigate();
    const { pathname, search } = useLocation();
    const isLoggedIn = !!auth?.isLoggedIn;
    const isPublic = PUBLIC_ROUTES.some(route => pathname === route || pathname.startsWith(`${route}/`));
    const redirectPath = `${ROUTES.AUTH.LOGIN}?redirect=${encodeURIComponent(pathname)}`;
    const redirectTo = useMemo(() => {
        const searchParams = new URLSearchParams(search);
        const param = searchParams.get('redirect');

        return param && decodeURIComponent(param);
    }, [search]);

    useEffect(() => {
        // Redirect to login if not authenticated and not on a public route
        if (!isLoggedIn && !isPublic) {
            navigate(redirectPath, { replace: true });
            return;
        }

        // Redirect to original page after login
        if (isLoggedIn && redirectTo && redirectTo !== pathname) {
            navigate(redirectTo, { replace: true });
        }
    }, [isLoggedIn, isPublic, navigate, pathname, redirectPath, redirectTo]);

    return children;
}
