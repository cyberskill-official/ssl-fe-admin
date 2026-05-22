import { BarChart3 } from 'lucide-react';
import { useEffect } from 'react';

import { usePortal } from '#shared/portal';

import { BusinessPerformanceSection } from './components/business-performance-section';
import { CelebrationOverlay } from './components/celebration-overlay';
import { DashboardStatsGrid } from './components/dashboard-stats-grid';
import { RevenueSection } from './components/revenue-section';
import { SiteTasksSection } from './components/site-tasks-section';
import { useDashboardData } from './hooks/use-dashboard-data';

function Dashboard() {
    const { setHeader } = usePortal();
    const {
        stats,
        tasks,
        showConfetti,
        showMoneyImage,
        newPaidUsersCount,
        newPromoUsersCount,
        counts,
        activity,
        loading,
    } = useDashboardData();

    useEffect(() => {
        setHeader({
            title: 'Dashboard Overview',
            description: 'Monitor your platform\'s performance, track key metrics, and manage tasks efficiently',
            icon: BarChart3,
        });
        return () => setHeader(null);
    }, [setHeader]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-6 space-y-6">
            <CelebrationOverlay
                showConfetti={showConfetti}
                showMoneyImage={showMoneyImage}
                newPaidUsersCount={newPaidUsersCount}
                newPromoUsersCount={newPromoUsersCount}
            />

            <DashboardStatsGrid stats={stats} />

            <RevenueSection counts={counts} activity={activity} loading={loading} />

            <BusinessPerformanceSection counts={counts} loading={loading} />

            <SiteTasksSection tasks={tasks} />
        </div>
    );
}

export default Dashboard;
