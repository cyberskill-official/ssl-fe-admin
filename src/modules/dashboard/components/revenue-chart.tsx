import type { ComponentType } from 'react';

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

import type { T_DashboardActivityPoint } from '#shared/graphql';

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

type ChartType = 'line' | 'bar' | 'doughnut';
type DateRange = '7d' | '30d' | '90d' | '6m' | '1y';
interface I_ChartDataPayload {
    labels: string[];
    datasets: Array<Record<string, unknown>>;
}
interface I_ChartComponentProps {
    data: I_ChartDataPayload;
    options: Record<string, unknown>;
    height: number;
}

const BarComponent = Bar as unknown as ComponentType<I_ChartComponentProps>;
const DoughnutComponent = Doughnut as unknown as ComponentType<I_ChartComponentProps>;
const LineComponent = Line as unknown as ComponentType<I_ChartComponentProps>;

interface I_RevenueChartProps {
    type?: ChartType;
    height?: number;
    activity: T_DashboardActivityPoint[];
    counts: {
        activeAdsCount: number;
        totalBlogs: number;
        paidUsersCount: number;
        promoUsersCount: number;
    };
    loading?: boolean;
}

const DATE_RANGE_DAYS: Record<DateRange, number> = {
    '7d': 7,
    '30d': 30,
    '90d': 90,
    '6m': 180,
    '1y': 365,
};

function formatPointLabel(point: T_DashboardActivityPoint, range: DateRange): string {
    if (point.label && (range === '6m' || range === '1y')) {
        return point.label;
    }

    if (!point.date) {
        return '';
    }

    return new Date(`${point.date}T00:00:00`).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
    });
}

function sum(values: number[]): number {
    return values.reduce((total, value) => total + value, 0);
}

function average(values: number[]): number {
    return values.length > 0 ? sum(values) / values.length : 0;
}

function calculateGrowthRate(values: number[]): number {
    if (values.length < 2) {
        return 0;
    }

    const midpoint = Math.floor(values.length / 2);
    const firstAverage = average(values.slice(0, midpoint));
    const secondAverage = average(values.slice(midpoint));

    if (firstAverage === 0) {
        return secondAverage > 0 ? 100 : 0;
    }

    return ((secondAverage - firstAverage) / firstAverage) * 100;
}

function safePercentage(value: number, total: number): number {
    return total > 0 ? (value / total) * 100 : 0;
}

export function RevenueChart({ type = 'line', height = 320, activity, counts, loading = false }: I_RevenueChartProps) {
    const [chartType, setChartType] = useState<ChartType>(type);
    const [dateRange, setDateRange] = useState<DateRange>('6m');
    const [showAnalytics, setShowAnalytics] = useState(false);

    const selectedActivity = useMemo(() => {
        const days = DATE_RANGE_DAYS[dateRange];
        return activity.slice(-days);
    }, [activity, dateRange]);

    const labels = useMemo(() => {
        return selectedActivity.map(point => formatPointLabel(point, dateRange));
    }, [dateRange, selectedActivity]);

    const totalActivity = useMemo(() => {
        return selectedActivity.map(point => point.totalActivity ?? 0);
    }, [selectedActivity]);

    const userRegistrations = useMemo(() => {
        return selectedActivity.map(point => point.userRegistrations ?? 0);
    }, [selectedActivity]);

    const contentPublished = useMemo(() => {
        return selectedActivity.map(point => point.contentPublished ?? 0);
    }, [selectedActivity]);

    const lineData = useMemo((): I_ChartDataPayload => ({
        labels,
        datasets: [
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
                pointRadius: dateRange === '7d' || dateRange === '30d' ? 4 : 2,
                pointHoverRadius: 6,
            },
            {
                label: 'User Registrations',
                data: userRegistrations,
                borderColor: 'rgb(59, 130, 246)',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                fill: false,
                tension: 0.4,
                pointBackgroundColor: 'rgb(59, 130, 246)',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: dateRange === '7d' || dateRange === '30d' ? 3 : 1,
                pointHoverRadius: 5,
            },
            {
                label: 'Content Published',
                data: contentPublished,
                borderColor: 'rgb(16, 185, 129)',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                fill: false,
                tension: 0.4,
                pointBackgroundColor: 'rgb(16, 185, 129)',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: dateRange === '7d' || dateRange === '30d' ? 3 : 1,
                pointHoverRadius: 5,
            },
        ],
    }), [contentPublished, dateRange, labels, totalActivity, userRegistrations]);

    const barData = useMemo((): I_ChartDataPayload => ({
        labels,
        datasets: [{
            label: 'Total Revenue (EUR)',
            data: totalActivity,
            backgroundColor: 'rgba(147, 51, 234, 0.8)',
            borderColor: 'rgb(147, 51, 234)',
            borderWidth: 2,
            borderRadius: 8,
            borderSkipped: false,
        }],
    }), [labels, totalActivity]);

    const doughnutData = useMemo((): I_ChartDataPayload => ({
        labels: ['Paying Users', 'Active Ads', 'Blog Posts'],
        datasets: [{
            data: [
                counts.paidUsersCount + counts.promoUsersCount,
                counts.activeAdsCount,
                counts.totalBlogs,
            ],
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
    }), [counts.activeAdsCount, counts.paidUsersCount, counts.promoUsersCount, counts.totalBlogs]);

    const analytics = useMemo(() => {
        const totalSum = sum(totalActivity);
        const userSum = sum(userRegistrations);
        const contentSum = sum(contentPublished);
        const avgDaily = average(totalActivity);
        const avgUsers = average(userRegistrations);
        const avgContent = average(contentPublished);
        const growthRate = calculateGrowthRate(totalActivity);
        const trend = growthRate > 0 ? 'up' : growthRate < 0 ? 'down' : 'neutral';
        const forecast = Math.round(avgDaily * (1 + (growthRate / 100)));

        return {
            totalSum,
            userSum,
            contentSum,
            avgDaily,
            avgUsers,
            avgContent,
            growthRate,
            trend,
            forecast: Number.isFinite(forecast) ? Math.max(forecast, 0) : 0,
        };
    }, [contentPublished, totalActivity, userRegistrations]);

    const cartesianOptions: Record<string, unknown> = {
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
            },
        },
        scales: {
            x: {
                grid: {
                    color: 'rgba(156, 163, 175, 0.1)',
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
                },
                ticks: {
                    color: 'rgb(107, 114, 128)',
                    font: {
                        size: 12,
                        weight: 'normal' as const,
                    },
                    callback(value: number | string) {
                        return value.toLocaleString();
                    },
                },
            },
        },
        interaction: {
            intersect: false,
            mode: 'index' as const,
        },
    };

    const doughnutOptions: Record<string, unknown> = {
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
            },
        },
    };

    const renderChart = () => {
        switch (chartType) {
            case 'bar':
                return <BarComponent data={barData} options={cartesianOptions} height={height} />;
            case 'doughnut':
                return <DoughnutComponent data={doughnutData} options={doughnutOptions} height={height} />;
            case 'line':
            default:
                return <LineComponent data={lineData} options={cartesianOptions} height={height} />;
        }
    };

    const exportData = () => {
        const csvContent = [
            ['Date', 'Total Activity', 'User Activity', 'Content Activity'],
            ...selectedActivity.map(point => [
                point.date ?? '',
                point.totalActivity ?? 0,
                point.userRegistrations ?? 0,
                point.contentPublished ?? 0,
            ]),
        ].map(row => row.join(',')).join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `activity-data-${dateRange}-${new Date().toISOString().split('T')[0]}.csv`;
        anchor.click();
        window.URL.revokeObjectURL(url);
    };

    const dateRangeOptions: Array<{ value: DateRange; label: string }> = [
        { value: '7d', label: '7 Days' },
        { value: '30d', label: '30 Days' },
        { value: '90d', label: '90 Days' },
        { value: '6m', label: '6 Months' },
        { value: '1y', label: '1 Year' },
    ];

    return (
        <div className="w-full h-full">
            {loading && (
                <div className="absolute top-0 right-0 z-10 px-3 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 text-xs font-medium rounded-lg">
                    Loading data...
                </div>
            )}

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
                <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <div className="flex bg-white/60 dark:bg-slate-700/60 rounded-lg border border-gray-200 dark:border-slate-600">
                        {dateRangeOptions.map(option => (
                            <button
                                type="button"
                                key={option.value}
                                onClick={() => setDateRange(option.value)}
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

                <div className="flex items-center space-x-2">
                    {[
                        { type: 'line' as const, label: 'Line', icon: LineChart },
                        { type: 'bar' as const, label: 'Bar', icon: BarChart3 },
                        { type: 'doughnut' as const, label: 'Breakdown', icon: PieChart },
                    ].map(chart => (
                        <button
                            type="button"
                            key={chart.type}
                            onClick={() => setChartType(chart.type)}
                            className={`p-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                                chartType === chart.type
                                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                                    : 'bg-white/60 dark:bg-slate-700/60 text-gray-600 dark:text-gray-300 hover:bg-white/80 dark:hover:bg-slate-700/80 border border-gray-200 dark:border-slate-600'
                            }`}
                            title={chart.label}
                        >
                            <chart.icon className="w-4 h-4" />
                        </button>
                    ))}

                    <button
                        type="button"
                        onClick={exportData}
                        className="p-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
                        title="Export Data"
                    >
                        <Download className="w-4 h-4" />
                    </button>

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

            <div className="relative" style={{ height: `${height}px` }}>
                {renderChart()}
            </div>

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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">Activity Breakdown</h5>
                            <div className="space-y-3">
                                {[
                                    { name: 'User Activity', value: analytics.userSum, percentage: safePercentage(analytics.userSum, analytics.totalSum), color: 'from-blue-500 to-cyan-500' },
                                    { name: 'Content Activity', value: analytics.contentSum, percentage: safePercentage(analytics.contentSum, analytics.totalSum), color: 'from-emerald-500 to-teal-500' },
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
                                            {item.percentage.toFixed(1)}
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
                                    { metric: 'Avg User Activity', value: Math.round(analytics.avgUsers).toLocaleString(), trend: analytics.trend },
                                    { metric: 'Avg Content Activity', value: Math.round(analytics.avgContent).toLocaleString(), trend: analytics.trend },
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
