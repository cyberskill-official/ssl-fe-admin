import { TrendingDown, TrendingUp } from 'lucide-react';
import * as React from 'react';

interface I_StatsCardProps {
    title: string;
    value: string | number;
    change: string;
    subtitle: string;
    icon: React.ElementType;
    color: string;
    bgColor: string;
    gradient?: string;
    trend?: 'up' | 'down';
    loading?: boolean;
    percentage?: number;
}

function StatsCard({
    title,
    value,
    change,
    subtitle,
    icon: Icon,
    color,
    bgColor,
    gradient = 'from-purple-600 to-pink-600',
    trend = 'up',
    loading = false,
    percentage,
}: I_StatsCardProps) {
    // Calculate progress bar width
    const progressWidth = percentage !== undefined
        ? `${Math.min(100, Math.max(0, percentage))}%`
        : trend === 'up' ? '75%' : '45%';

    return (
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-6 rounded-2xl shadow-xl border border-white/20 dark:border-slate-700/20 hover:shadow-2xl transition-all duration-300 group relative">
            {/* Loading overlay */}
            {loading && (
                <div className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            )}
            <div className="flex items-center justify-between mb-6">
                <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-2 uppercase tracking-wide">{title}</p>
                    <p className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-purple-800 to-pink-800 dark:from-white dark:via-purple-200 dark:to-pink-200 bg-clip-text text-transparent mb-3">
                        {value}
                    </p>
                    <div className="flex items-center space-x-2 mb-2">
                        <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-bold ${
                            trend === 'up'
                                ? 'bg-gradient-to-r from-emerald-100 to-teal-100 dark:from-emerald-900/50 dark:to-teal-900/50 text-emerald-700 dark:text-emerald-300'
                                : 'bg-gradient-to-r from-red-100 to-pink-100 dark:from-red-900/50 dark:to-pink-900/50 text-red-700 dark:text-red-300'
                        }`}
                        >
                            {trend === 'up'
                                ? (
                                        <TrendingUp className="w-3 h-3" />
                                    )
                                : (
                                        <TrendingDown className="w-3 h-3" />
                                    )}
                            <span>{change}</span>
                        </div>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{subtitle}</p>
                </div>
                <div className={`${bgColor} dark:bg-slate-700/50 p-4 rounded-2xl shadow-lg group-hover:shadow-xl transition-all duration-300 transform group-hover:scale-110`}>
                    <Icon className={`h-8 w-8 ${color} dark:text-white`} />
                </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 dark:bg-slate-600 rounded-full h-2 overflow-hidden">
                <div
                    className={`h-2 bg-gradient-to-r ${gradient} rounded-full transition-all duration-1000 ease-out ${loading ? 'animate-pulse' : ''}`}
                    style={{
                        width: progressWidth,
                        animation: loading ? 'pulse 2s infinite' : 'progress 2s ease-out',
                    }}
                >
                </div>
            </div>

            <style>
                {`
                @keyframes progress {
                    from { width: 0%; }
                    to { width: ${progressWidth}; }
                }
            `}
            </style>
        </div>
    );
}

export default React.memo(StatsCard);
