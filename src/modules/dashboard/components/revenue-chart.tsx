import {
    ArcElement,
    BarElement,
    CategoryScale,
    Chart as ChartJS,
    Filler,
    Legend,
    LinearScale,
    LineElement,
    PointElement,
    Title,
    Tooltip,
} from 'chart.js';
import { BarChart3, Calendar, Download, Filter, LineChart, PieChart, TrendingDown, TrendingUp } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Bar, Doughnut, Line } from 'react-chartjs-2';

import { useGetAdvertisements } from '../../advertisement/advertisement.hook';
import { useGetBlogs } from '../../blog/blog.hook';
import { useGetUsers } from '../../user/user.hook';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler,
    ArcElement,
);

interface I_RevenueChartProps {
    type?: 'line' | 'bar' | 'doughnut';
    height?: number;
}

type DateRange = '7d' | '30d' | '90d' | '6m' | '1y' | 'custom';

export function RevenueChart({ type = 'line', height = 320 }: I_RevenueChartProps) {
    const [chartType, setChartType] = useState(type);
    const [dateRange, setDateRange] = useState<DateRange>('6m');
    const [showAnalytics, setShowAnalytics] = useState(false);

    // Fetch real data from APIs
    const { users: allUsers, loading: usersLoading } = useGetUsers(
        {},
        { page: 1, limit: 10000, sort: { createdAt: -1 } },
    );

    const { advertisements, totalDocs: totalAds, loading: adsLoading } = useGetAdvertisements(
        {},
        { page: 1, limit: 1000 },
    );

    const { blogs: allBlogs, loading: blogsLoading } = useGetBlogs(
        {},
        { page: 1, limit: 1000 },
    );

    const isLoading = usersLoading || adsLoading || blogsLoading;

    // Generate data based on REAL createdAt timestamps
    const revenueData = useMemo(() => {
        const generateData = (range: DateRange) => {
            const now = new Date();
            const data: { labels: string[]; datasets: any[] } = {
                labels: [],
                datasets: [],
            };

            let days = 0;

            switch (range) {
                case '7d':
                    days = 7;
                    break;
                case '30d':
                    days = 30;
                    break;
                case '90d':
                    days = 90;
                    break;
                case '6m':
                    days = 180;
                    break;
                case '1y':
                    days = 365;
                    break;
            }

            const labels = [];
            const totalActivity: number[] = [];
            const userActivity: number[] = [];
            const contentActivity: number[] = [];

            // Create date buckets
            const dateBuckets: Map<string, { users: number; content: number }> = new Map();

            for (let i = days - 1; i >= 0; i--) {
                const date = new Date(now);
                date.setDate(date.getDate() - i);
                const dateKey = date.toISOString().split('T')[0];
                if (dateKey) {
                    dateBuckets.set(dateKey, { users: 0, content: 0 });
                }

                labels.push(date.toLocaleDateString('en-US', {
                    month: 'short',
                    day: range === '6m' || range === '1y' ? undefined : 'numeric',
                }));
            }

            // Count real users by createdAt date
            allUsers?.forEach((user) => {
                if (user.createdAt) {
                    const userDate = new Date(user.createdAt);
                    const dateKey = userDate.toISOString().split('T')[0];
                    if (dateKey) {
                        const bucket = dateBuckets.get(dateKey);
                        if (bucket) {
                            bucket.users += 1;
                        }
                    }
                }
            });

            // Count real blogs by createdAt date
            allBlogs?.forEach((blog) => {
                if (blog.createdAt) {
                    const blogDate = new Date(blog.createdAt);
                    const dateKey = blogDate.toISOString().split('T')[0];
                    if (dateKey) {
                        const bucket = dateBuckets.get(dateKey);
                        if (bucket) {
                            bucket.content += 1;
                        }
                    }
                }
            });

            // Build chart data arrays from buckets
            dateBuckets.forEach((bucket) => {
                const total = bucket.users + bucket.content;
                totalActivity.push(total);
                userActivity.push(bucket.users);
                contentActivity.push(bucket.content);
            });

            data.labels = labels;
            data.datasets = [
                {
                    label: 'Total Activity',
                    data: totalActivity,
                    borderColor: 'rgb(147, 51, 234)',
                    backgroundColor: 'rgba(147, 51, 234, 0.1)',
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: 'rgb(147, 51, 234)',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: range === '7d' || range === '30d' ? 4 : 2,
                    pointHoverRadius: 6,
                },
                {
                    label: 'User Registrations',
                    data: userActivity,
                    borderColor: 'rgb(59, 130, 246)',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    fill: false,
                    tension: 0.4,
                    pointBackgroundColor: 'rgb(59, 130, 246)',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: range === '7d' || range === '30d' ? 3 : 1,
                    pointHoverRadius: 5,
                },
                {
                    label: 'Content Published',
                    data: contentActivity,
                    borderColor: 'rgb(16, 185, 129)',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    fill: false,
                    tension: 0.4,
                    pointBackgroundColor: 'rgb(16, 185, 129)',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: range === '7d' || range === '30d' ? 3 : 1,
                    pointHoverRadius: 5,
                },
            ];

            return data;
        };

        return generateData(dateRange);
    }, [dateRange, allUsers, allBlogs]);

    const barData = {
        labels: revenueData.labels,
        datasets: [{
            label: 'Total Revenue (EUR)',
            data: revenueData.datasets[0].data,
            backgroundColor: 'rgba(147, 51, 234, 0.8)',
            borderColor: 'rgb(147, 51, 234)',
            borderWidth: 2,
            borderRadius: 8,
            borderSkipped: false,
        }],
    };

    const doughnutData = useMemo(() => {
        const activeAds = totalAds > 0 ? advertisements.filter(ad => ad.isActive).length : 0;
        const now = new Date();
        const payingUsers = allUsers && allUsers.length > 0
            ? allUsers.filter((user) => {
                const membershipExpires = user?.membershipExpiresAt;
                return membershipExpires && new Date(membershipExpires) > now;
            }).length
            : 0;

        // Use real values from data
        const data = [
            payingUsers,
            activeAds,
            allBlogs?.length || 0,
        ];

        return {
            labels: ['Paying Users', 'Active Ads', 'Blog Posts'],
            datasets: [{
                data,
                backgroundColor: [
                    'rgba(147, 51, 234, 0.8)',
                    'rgba(59, 130, 246, 0.8)',
                    'rgba(16, 185, 129, 0.8)',
                ],
                borderColor: [
                    'rgb(147, 51, 234)',
                    'rgb(59, 130, 246)',
                    'rgb(16, 185, 129)',
                ],
                borderWidth: 2,
                hoverOffset: 4,
            }],
        };
    }, [advertisements, allUsers, allBlogs, totalAds]);

    // Calculate analytics
    const calculateAnalytics = () => {
        const totalData = revenueData.datasets[0].data;
        const membershipData = revenueData.datasets[1].data;
        const adData = revenueData.datasets[2].data;

        const totalSum = totalData.reduce((a: number, b: number) => a + b, 0);
        const membershipSum = membershipData.reduce((a: number, b: number) => a + b, 0);
        const adSum = adData.reduce((a: number, b: number) => a + b, 0);

        const avgDaily = totalSum / totalData.length;
        const avgMembership = membershipSum / membershipData.length;
        const avgAd = adSum / adData.length;

        // Calculate growth rate with safety check
        const firstHalf = totalData.slice(0, Math.floor(totalData.length / 2));
        const secondHalf = totalData.slice(Math.floor(totalData.length / 2));
        const firstAvg = firstHalf.reduce((a: number, b: number) => a + b, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((a: number, b: number) => a + b, 0) / secondHalf.length;
        const growthRate = firstAvg === 0 ? 0 : ((secondAvg - firstAvg) / firstAvg) * 100;

        // Calculate trend
        const trend = growthRate > 0 ? 'up' : growthRate < 0 ? 'down' : 'neutral';

        // Forecast next period with safety check
        const forecast = Number.isNaN(growthRate) || !Number.isFinite(growthRate) ? Math.round(secondAvg) : Math.round(secondAvg * (1 + (growthRate / 100)));

        return {
            totalSum,
            membershipSum,
            adSum,
            avgDaily,
            avgMembership,
            avgAd,
            growthRate,
            trend,
            forecast,
        };
    };

    const analytics = calculateAnalytics();

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top' as const,
                labels: {
                    color: 'rgb(107, 114, 128)',
                    font: {
                        size: 12,
                        weight: 'bold' as const,
                    },
                    usePointStyle: true,
                    pointStyle: 'circle',
                    padding: 20,
                },
            },
            tooltip: {
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                titleColor: 'rgb(17, 24, 39)',
                bodyColor: 'rgb(55, 65, 81)',
                borderColor: 'rgba(147, 51, 234, 0.2)',
                borderWidth: 1,
                cornerRadius: 12,
                displayColors: true,
                callbacks: {
                    label(context: any) {
                        return `${context.dataset.label}: ${context.parsed.y.toLocaleString()}`;
                    },
                },
            },
        },
        scales: {
            x: {
                grid: {
                    color: 'rgba(156, 163, 175, 0.1)',
                    drawBorder: false,
                },
                ticks: {
                    color: 'rgb(107, 114, 128)',
                    font: {
                        size: 12,
                        weight: 'normal' as const,
                    },
                    maxTicksLimit: dateRange === '7d' ? 7 : dateRange === '30d' ? 10 : 6,
                },
            },
            y: {
                grid: {
                    color: 'rgba(156, 163, 175, 0.1)',
                    drawBorder: false,
                },
                ticks: {
                    color: 'rgb(107, 114, 128)',
                    font: {
                        size: 12,
                        weight: 'normal' as const,
                    },
                    callback(value: any) {
                        return value.toLocaleString();
                    },
                },
            },
        },
        interaction: {
            intersect: false,
            mode: 'index' as const,
        },
        elements: {
            point: {
                hoverBackgroundColor: 'rgb(147, 51, 234)',
                hoverBorderColor: '#fff',
                hoverBorderWidth: 3,
            },
        },
    };

    const doughnutOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom' as const,
                labels: {
                    color: 'rgb(107, 114, 128)',
                    font: {
                        size: 12,
                        weight: 'bold' as const,
                    },
                    usePointStyle: true,
                    pointStyle: 'circle',
                    padding: 20,
                },
            },
            tooltip: {
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                titleColor: 'rgb(17, 24, 39)',
                bodyColor: 'rgb(55, 65, 81)',
                borderColor: 'rgba(147, 51, 234, 0.2)',
                borderWidth: 1,
                cornerRadius: 12,
                callbacks: {
                    label(context: any) {
                        const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                        const percentage = ((context.parsed / total) * 100).toFixed(1);
                        return `${context.label}: ${context.parsed.toLocaleString()} (${percentage}%)`;
                    },
                },
            },
        },
    };

    const renderChart = () => {
        switch (chartType) {
            case 'line':
                return <Line data={revenueData} options={options} height={height} />;
            case 'bar':
                return <Bar data={barData} options={options} height={height} />;
            case 'doughnut':
                return <Doughnut data={doughnutData} options={doughnutOptions} height={height} />;
            default:
                return <Line data={revenueData} options={options} height={height} />;
        }
    };

    const exportData = () => {
        const csvContent = [
            ['Date', 'Total Activity', 'User Activity', 'Content Activity'],
            ...revenueData.labels.map((label, index) => [
                label,
                revenueData.datasets[0].data[index],
                revenueData.datasets[1].data[index],
                revenueData.datasets[2].data[index],
            ]),
        ].map(row => row.join(',')).join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `activity-data-${dateRange}-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    const dateRangeOptions = [
        { value: '7d', label: '7 Days' },
        { value: '30d', label: '30 Days' },
        { value: '90d', label: '90 Days' },
        { value: '6m', label: '6 Months' },
        { value: '1y', label: '1 Year' },
    ];

    return (
        <div className="w-full h-full">
            {/* Loading indicator */}
            {isLoading && (
                <div className="absolute top-0 right-0 z-10 px-3 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 text-xs font-medium rounded-lg">
                    Loading data...
                </div>
            )}

            {/* Controls Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
                {/* Date Range Selector */}
                <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <div className="flex bg-white/60 dark:bg-slate-700/60 rounded-lg border border-gray-200 dark:border-slate-600">
                        {dateRangeOptions.map(option => (
                            <button
                                type="button"
                                key={option.value}
                                onClick={() => setDateRange(option.value as DateRange)}
                                className={`px-3 py-2 text-sm font-medium transition-all duration-200 rounded-md ${
                                    dateRange === option.value
                                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                                        : 'text-gray-600 dark:text-gray-300 hover:bg-white/80 dark:hover:bg-slate-600/80'
                                }`}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Chart Type Selector */}
                <div className="flex items-center space-x-2">
                    {[
                        { type: 'line', label: 'Line', icon: LineChart },
                        { type: 'bar', label: 'Bar', icon: BarChart3 },
                        { type: 'doughnut', label: 'Breakdown', icon: PieChart },
                    ].map(chart => (
                        <button
                            type="button"
                            key={chart.type}
                            onClick={() => setChartType(chart.type as any)}
                            className={`p-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                                chartType === chart.type
                                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                                    : 'bg-white/60 dark:bg-slate-700/60 text-gray-600 dark:text-gray-300 hover:bg-white/80 dark:hover:bg-slate-700/80 border border-gray-200 dark:border-slate-600'
                            }`}
                        >
                            <chart.icon className="w-4 h-4" />
                        </button>
                    ))}

                    {/* Export Button */}
                    <button
                        type="button"
                        onClick={exportData}
                        className="p-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
                        title="Export Data"
                    >
                        <Download className="w-4 h-4" />
                    </button>

                    {/* Analytics Toggle */}
                    <button
                        type="button"
                        onClick={() => setShowAnalytics(!showAnalytics)}
                        className={`p-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                            showAnalytics
                                ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg'
                                : 'bg-white/60 dark:bg-slate-700/60 text-gray-600 dark:text-gray-300 hover:bg-white/80 dark:hover:bg-slate-700/80 border border-gray-200 dark:border-slate-600'
                        }`}
                        title="Toggle Analytics"
                    >
                        <Filter className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Chart Container */}
            <div className="relative" style={{ height: `${height}px` }}>
                {renderChart()}
            </div>

            {/* Enhanced Analytics Panel */}
            {showAnalytics && (
                <div className="mt-6 bg-gradient-to-r from-gray-50 to-purple-50 dark:from-slate-700 dark:to-slate-600 rounded-xl border border-gray-100 dark:border-slate-600 p-6">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                        <TrendingUp className="w-5 h-5 mr-2 text-purple-600" />
                        Detailed Analytics
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        {[
                            {
                                label: 'Total Activity',
                                value: analytics.totalSum.toLocaleString(),
                                change: `${analytics.growthRate > 0 ? '+' : ''}${analytics.growthRate.toFixed(1)}%`,
                                trend: analytics.trend,
                                subtitle: 'Period total',
                            },
                            {
                                label: 'Avg Daily',
                                value: Math.round(analytics.avgDaily).toLocaleString(),
                                change: `${analytics.growthRate > 0 ? '+' : ''}${analytics.growthRate.toFixed(1)}%`,
                                trend: analytics.trend,
                                subtitle: 'Daily average',
                            },
                            {
                                label: 'Forecast',
                                value: analytics.forecast.toLocaleString(),
                                change: 'Next period',
                                trend: 'neutral',
                                subtitle: 'Predicted activity',
                            },
                            {
                                label: 'Growth Rate',
                                value: `${analytics.growthRate > 0 ? '+' : ''}${analytics.growthRate.toFixed(1)}%`,
                                change: analytics.trend === 'up' ? 'Growing' : 'Declining',
                                trend: analytics.trend,
                                subtitle: 'Period over period',
                            },
                        ].map(item => (
                            <div key={item.label} className="text-center p-4 bg-white/80 dark:bg-slate-800/80 rounded-xl border border-gray-200 dark:border-slate-600">
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">{item.label}</p>
                                <p className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">{item.value}</p>
                                <div className="flex items-center justify-center space-x-1">
                                    {item.trend !== 'neutral' && (
                                        item.trend === 'up'
                                            ? <TrendingUp className="w-3 h-3 text-emerald-600" />
                                            : <TrendingDown className="w-3 h-3 text-red-600" />
                                    )}
                                    <span className={`text-xs font-bold ${
                                        item.trend === 'up'
                                            ? 'text-emerald-600 dark:text-emerald-400'
                                            : item.trend === 'down'
                                                ? 'text-red-600 dark:text-red-400'
                                                : 'text-gray-600 dark:text-gray-400'
                                    }`}
                                    >
                                        {item.change}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{item.subtitle}</p>
                            </div>
                        ))}
                    </div>

                    {/* Activity Breakdown */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">Activity Breakdown</h5>
                            <div className="space-y-3">
                                {[
                                    { name: 'User Activity', value: analytics.membershipSum, percentage: (analytics.membershipSum / analytics.totalSum * 100).toFixed(1), color: 'from-blue-500 to-cyan-500' },
                                    { name: 'Content Activity', value: analytics.adSum, percentage: (analytics.adSum / analytics.totalSum * 100).toFixed(1), color: 'from-emerald-500 to-teal-500' },
                                ].map(item => (
                                    <div key={item.name} className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-700 dark:text-gray-200 font-medium">{item.name}</span>
                                            <span className="text-gray-900 dark:text-gray-100 font-bold">
                                                {Math.round(item.value).toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="w-full bg-gray-200 dark:bg-slate-600 rounded-full h-2">
                                            <div
                                                className={`h-2 bg-gradient-to-r ${item.color} rounded-full transition-all duration-1000`}
                                                style={{ width: `${item.percentage}%` }}
                                            />
                                        </div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                            {item.percentage}
                                            % of total activity
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">Performance Metrics</h5>
                            <div className="space-y-3">
                                {[
                                    { metric: 'Avg User Activity', value: Math.round(analytics.avgMembership).toLocaleString(), trend: analytics.trend },
                                    { metric: 'Avg Content Activity', value: Math.round(analytics.avgAd).toLocaleString(), trend: analytics.trend },
                                    { metric: 'Activity per Day', value: Math.round(analytics.avgDaily).toLocaleString(), trend: analytics.trend },
                                    { metric: 'Growth Trend', value: analytics.growthRate > 0 ? 'Positive' : 'Negative', trend: analytics.trend },
                                ].map(item => (
                                    <div key={item.metric} className="flex items-center justify-between p-3 bg-white/60 dark:bg-slate-700/60 rounded-lg border border-gray-200 dark:border-slate-600">
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{item.metric}</span>
                                        <div className="flex items-center space-x-2">
                                            <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{item.value}</span>
                                            {item.trend !== 'neutral' && (
                                                item.trend === 'up'
                                                    ? <TrendingUp className="w-3 h-3 text-emerald-600" />
                                                    : <TrendingDown className="w-3 h-3 text-red-600" />
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Chart Summary */}
            <div className="mt-6 grid grid-cols-3 gap-4">
                {[
                    { label: 'Total Activity', value: analytics.totalSum.toLocaleString(), change: `${analytics.growthRate > 0 ? '+' : ''}${analytics.growthRate.toFixed(1)}%`, trend: analytics.trend },
                    { label: 'Avg Daily', value: Math.round(analytics.avgDaily).toLocaleString(), change: `${analytics.growthRate > 0 ? '+' : ''}${analytics.growthRate.toFixed(1)}%`, trend: analytics.trend },
                    { label: 'Growth Rate', value: `${analytics.growthRate > 0 ? '+' : ''}${analytics.growthRate.toFixed(1)}%`, change: analytics.trend === 'up' ? 'Growing' : 'Declining', trend: analytics.trend },
                ].map(item => (
                    <div key={item.label} className="text-center p-4 bg-gradient-to-r from-gray-50 to-purple-50 dark:from-slate-700 dark:to-slate-600 rounded-xl border border-gray-100 dark:border-slate-600">
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">{item.label}</p>
                        <p className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">{item.value}</p>
                        <div className="flex items-center justify-center space-x-1">
                            {item.trend !== 'neutral' && (
                                item.trend === 'up'
                                    ? <TrendingUp className="w-3 h-3 text-emerald-600" />
                                    : <TrendingDown className="w-3 h-3 text-red-600" />
                            )}
                            <span className={`text-xs font-bold ${
                                item.trend === 'up'
                                    ? 'text-emerald-600 dark:text-emerald-400'
                                    : item.trend === 'down'
                                        ? 'text-red-600 dark:text-red-400'
                                        : 'text-gray-600 dark:text-gray-400'
                            }`}
                            >
                                {item.change}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
