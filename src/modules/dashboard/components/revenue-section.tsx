import { Calendar, DollarSign, Target, TrendingUp } from 'lucide-react';

import { Button } from '#shared/component';

import { RevenueChart } from './revenue-chart';

interface I_RevenueSectionProps {
    counts: {
        totalUsers: number;
        activeAdsCount: number;
        totalAds: number;
        totalBlogs: number;
        totalDestinations: number;
    };
    loading: {
        usersLoading: boolean;
        adsLoading: boolean;
        blogsLoading: boolean;
        destinationsLoading: boolean;
    };
}

export function RevenueSection({ counts, loading }: I_RevenueSectionProps) {
    const { totalUsers, activeAdsCount, totalAds, totalBlogs, totalDestinations } = counts;
    const { adsLoading, blogsLoading, destinationsLoading } = loading;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Revenue Chart */}
            <div className="lg:col-span-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 dark:border-slate-700/20 p-8">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl">
                            <TrendingUp className="w-6 h-6 text-white" />
                        </div>
                        <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-purple-800 to-pink-800 dark:from-white dark:via-purple-200 dark:to-pink-200 bg-clip-text text-transparent">
                            Revenue Trends
                        </h2>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                        <Calendar className="w-4 h-4" />
                        <span>Last 6 Months</span>
                    </div>
                </div>
                <div className="h-80 bg-gradient-to-br from-gray-50 to-purple-50 dark:from-slate-700 dark:to-slate-600 rounded-2xl border border-gray-100 dark:border-slate-600 p-6">
                    <RevenueChart height={280} />
                </div>
            </div>

            {/* Revenue Insights */}
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 dark:border-slate-700/20 p-8">
                <div className="flex items-center space-x-3 mb-6">
                    <div className="p-2 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl">
                        <Target className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-bold bg-gradient-to-r from-gray-900 via-emerald-800 to-teal-800 dark:from-white dark:via-emerald-200 dark:to-teal-200 bg-clip-text text-transparent">
                        Revenue Insights
                    </h3>
                </div>

                <div className="space-y-6">
                    {/* Top Revenue Sources */}
                    <div>
                        <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-3 uppercase tracking-wide">Platform Statistics</h4>
                        <div className="space-y-3">
                            {[
                                {
                                    name: 'Total Users',
                                    revenue: totalUsers.toString(),
                                    percentage: 100,
                                    color: 'from-purple-500 to-pink-500',
                                },
                                {
                                    name: 'Active Advertisements',
                                    revenue: activeAdsCount.toString(),
                                    percentage: totalAds > 0 ? (activeAdsCount / totalAds) * 100 : 0,
                                    color: 'from-blue-500 to-cyan-500',
                                },
                                {
                                    name: 'Published Blogs',
                                    revenue: totalBlogs.toString(),
                                    percentage: totalBlogs > 0 ? 100 : 0,
                                    color: 'from-emerald-500 to-teal-500',
                                },
                            ].map(source => (
                                <div key={source.name} className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-700 dark:text-gray-200 font-medium">{source.name}</span>
                                        <span className="text-gray-900 dark:text-gray-100 font-bold">{source.revenue}</span>
                                    </div>
                                    <div className="w-full bg-gray-200 dark:bg-slate-600 rounded-full h-2">
                                        <div
                                            className={`h-2 bg-gradient-to-r ${source.color} rounded-full transition-all duration-1000`}
                                            style={{ width: `${source.percentage}%` }}
                                        />
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                        {source.percentage.toFixed(1)}
                                        % coverage
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Content Performance */}
                    <div>
                        <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-3 uppercase tracking-wide">Content Overview</h4>
                        <div className="space-y-3">
                            {[
                                {
                                    country: 'Blog Posts',
                                    revenue: totalBlogs.toString(),
                                    growth: blogsLoading ? '...' : 'Published',
                                    flag: '📝',
                                },
                                {
                                    country: 'Advertisements',
                                    revenue: totalAds.toString(),
                                    growth: adsLoading ? '...' : 'Total',
                                    flag: '📢',
                                },
                                {
                                    country: 'Destinations',
                                    revenue: totalDestinations.toString(),
                                    growth: destinationsLoading ? '...' : 'Locations',
                                    flag: '🌍',
                                },
                            ].map(market => (
                                <div key={market.country} className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-purple-50 dark:from-slate-700 dark:to-slate-600 rounded-xl border border-gray-100 dark:border-slate-600">
                                    <div className="flex items-center space-x-3">
                                        <span className="text-2xl">{market.flag}</span>
                                        <div>
                                            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{market.country}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">{market.growth}</p>
                                        </div>
                                    </div>
                                    <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{market.revenue}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div>
                        <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-3 uppercase tracking-wide">Quick Actions</h4>
                        <div className="space-y-2">
                            <Button
                                variant="outline"
                                size="sm"
                                className="flex items-center whitespace-nowrap w-full justify-start text-left p-3 border-2 border-purple-200 dark:border-purple-700 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/50 rounded-xl transition-all duration-300"
                            >
                                <DollarSign className="w-4 h-4 mr-2" />
                                View Detailed Reports
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className="flex items-center whitespace-nowrap w-full justify-start text-left p-3 border-2 border-blue-200 dark:border-blue-700 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/50 rounded-xl transition-all duration-300"
                            >
                                <TrendingUp className="w-4 h-4 mr-2" />
                                Export Revenue Data
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
