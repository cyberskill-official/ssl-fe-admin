import { Outlet } from 'react-router';

import { PendingCountProvider } from '#shared/context/pending-count.context';
import { PortalProvider } from '#shared/portal';

import { ThemeProvider } from '../../component/theme-context';
import { Header } from './header';
import { Sidebar } from './sidebar';

function AdminLayout() {
    return (
        <ThemeProvider>
            <PortalProvider>
                <PendingCountProvider>
                    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
                        <Sidebar />
                        <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
                            <Header />
                            <main className="flex-1 overflow-auto p-6 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
                                <Outlet />
                            </main>
                        </div>
                    </div>
                </PendingCountProvider>
            </PortalProvider>
        </ThemeProvider>
    );
}

export default AdminLayout;
