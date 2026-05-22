import { Shield, TrendingDown, TrendingUp, Users } from 'lucide-react';

interface I_BusinessPerformanceSectionProps {
    counts: {
        totalUsers: number;
        paidUsersCount: number;
        promoUsersCount: number;
        totalPayingUsersCount: number;
        freeUsersCount: number;
        totalBlogs: number;
        totalDestinations: number;
        totalAds: number;
        activeAdsCount: number;
    };
    loading: {
        usersLoading: boolean;
        blogsLoading: boolean;
        destinationsLoading: boolean;
        adsLoading: boolean;
    };
}

export function BusinessPerformanceSection({ counts, loading }: I_BusinessPerformanceSectionProps) {
    const { totalUsers, paidUsersCount, totalPayingUsersCount, freeUsersCount, totalBlogs, totalDestinations, totalAds, activeAdsCount } = counts;
    const { usersLoading, blogsLoading, destinationsLoading, adsLoading } = loading;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* User Engagement Metrics */}
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 dark:border-slate-700/20 p-8">
                <div className="flex items-center space-x-3 mb-6">
                    <div className="p-2 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl">
                        <Users className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-cyan-800 dark:from-white dark:via-blue-200 dark:to-cyan-200 bg-clip-text text-transparent">
                        User Engagement
                    </h3>
                </div>

                <div className="space-y-6">
                    {[
                        { metric: 'Total Registered Users', value: totalUsers.toLocaleString(), change: usersLoading ? '...' : 'All time', trend: 'up' },
                        { metric: 'Paying Members', value: paidUsersCount.toLocaleString(), change: usersLoading ? '...' : 'Active', trend: 'up' },
                        { metric: 'Free Members', value: freeUsersCount.toLocaleString(), change: usersLoading ? '...' : 'Active', trend: 'up' },
                        { metric: 'Active Blogs', value: totalBlogs.toString(), change: blogsLoading ? '...' : 'Published', trend: 'up' },
                        { metric: 'Active Destinations', value: totalDestinations.toString(), change: destinationsLoading ? '...' : 'Listed', trend: 'up' },
                        { metric: 'Conversion Rate', value: totalUsers > 0 ? `${((totalPayingUsersCount / totalUsers) * 100).toFixed(1)}%` : '0%', change: usersLoading ? '...' : 'Free to Paid', trend: 'up' },
                    ].map(item => (
                        <div key={item.metric} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-slate-700 dark:to-slate-600 rounded-xl border border-gray-100 dark:border-slate-600">
                            <div>
                                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{item.metric}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {item.change}
                                    {' '}
                                    from last month
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{item.value}</p>
                                <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-bold ${
                                    item.trend === 'up'
                                        ? 'bg-gradient-to-r from-emerald-100 to-teal-100 dark:from-emerald-900/50 dark:to-teal-900/50 text-emerald-700 dark:text-emerald-300'
                                        : 'bg-gradient-to-r from-red-100 to-pink-100 dark:from-red-900/50 dark:to-pink-900/50 text-red-700 dark:text-red-300'
                                }`}
                                >
                                    {item.trend === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                    <span>{item.change}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Platform Health Metrics */}
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 dark:border-slate-700/20 p-8">
                <div className="flex items-center space-x-3 mb-6">
                    <div className="p-2 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl">
                        <Shield className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-bold bg-gradient-to-r from-gray-900 via-emerald-800 to-teal-800 dark:from-white dark:via-emerald-200 dark:to-teal-200 bg-clip-text text-transparent">
                        Platform Health
                    </h3>
                </div>

                <div className="space-y-6">
                    {[
                        { metric: 'Total Advertisements', value: totalAds.toString(), change: adsLoading ? '...' : 'All time', trend: 'up', status: 'excellent' },
                        { metric: 'Active Advertisements', value: activeAdsCount.toString(), change: adsLoading ? '...' : 'Running', trend: 'up', status: 'good' },
                        { metric: 'Blog Content', value: totalBlogs.toString(), change: blogsLoading ? '...' : 'Published', trend: 'up', status: 'normal' },
                        { metric: 'Travel Destinations', value: totalDestinations.toString(), change: destinationsLoading ? '...' : 'Listed', trend: 'up', status: 'good' },
                        { metric: 'System Status', value: 'Online', change: 'Operational', trend: 'neutral', status: 'excellent' },
                    ].map(item => (
                        <div key={item.metric} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-emerald-50 dark:from-slate-700 dark:to-slate-600 rounded-xl border border-gray-100 dark:border-slate-600">
                            <div>
                                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{item.metric}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {item.change}
                                    {' '}
                                    from last week
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{item.value}</p>
                                <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-bold ${
                                    item.status === 'excellent'
                                        ? 'bg-gradient-to-r from-emerald-100 to-teal-100 dark:from-emerald-900/50 dark:to-teal-900/50 text-emerald-700 dark:text-emerald-300'
                                        : item.status === 'good'
                                            ? 'bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-900/50 dark:to-cyan-900/50 text-blue-700 dark:text-blue-300'
                                            : item.status === 'normal'
                                                ? 'bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/50 dark:to-orange-900/50 text-amber-700 dark:text-amber-300'
                                                : 'bg-gradient-to-r from-red-100 to-pink-100 dark:from-red-900/50 dark:to-pink-900/50 text-red-700 dark:text-red-300'
                                }`}
                                >
                                    <span className="capitalize">{item.status}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
