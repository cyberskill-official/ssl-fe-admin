import type { I_Children } from '@cyberskill/shared/typescript';

import { Loading } from '@cyberskill/shared/react/loading';
import {
    isRouteErrorResponse,
    Links,
    Meta,
    Outlet,
    Scripts,
    ScrollRestoration,
} from 'react-router';
import '@cyberskill/shared/style.css';

import { initI18n } from '#shared/i18n';
import { LayoutWrapper } from '#shared/layout';
import '#shared/style/global.css';
import '#shared/util/prism';

initI18n();

export function Layout({ children }: I_Children) {
    return (
        <html lang="en">
            <head>
                <meta charSet="UTF-8" />
                <link rel="icon" type="image/svg+xml" href="/vite.svg" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <title>Admin </title>
                <Meta />
                <Links />
            </head>
            <body suppressHydrationWarning>
                {children}
                <ScrollRestoration />
                <Scripts />
            </body>
        </html>
    );
}

export function HydrateFallback() {
    return (
        <Loading full />
    );
}

export default function Root() {
    return (
        <LayoutWrapper>
            <Outlet />
        </LayoutWrapper>
    );
}

export function ErrorBoundary({ error }: { error: unknown }) {
    let message = 'Oops!';
    let details = 'An unexpected error occurred.';
    let stack: string | undefined;

    if (isRouteErrorResponse(error)) {
        message = error.status === 404 ? '404' : 'Error';
        details
            = error.status === 404
                ? 'The requested page could not be found.'
                : error.statusText || details;
    }
    else if (import.meta.env.DEV && error && error instanceof Error) {
        details = error.message;
        stack = error.stack;
    }

    return (
        <main className="pt-16 p-4 container mx-auto">
            <h1>{message}</h1>
            <p>{details}</p>
            {stack && (
                <pre className="w-full p-4 overflow-x-auto">
                    <code>{stack}</code>
                </pre>
            )}
        </main>
    );
}
