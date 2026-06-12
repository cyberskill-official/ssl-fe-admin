import type { LucideIcon } from 'lucide-react';

import StatsCard from './stats-card';

export interface I_StatItem {
    id: string;
    title: string;
    value: string;
    change: string;
    subtitle: string;
    icon: LucideIcon;
    color: string;
    bgColor: string;
    gradient: string;
    trend: 'down' | 'neutral' | 'up';
    loading: boolean;
    percentage: number;
}

interface I_DashboardStatsGridProps {
    stats: I_StatItem[];
}

export function DashboardStatsGrid({ stats }: I_DashboardStatsGridProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
                <div
                    key={stat.id}
                    className="transform hover:scale-105 transition-all duration-300"
                    style={{ animationDelay: `${index * 100}ms` }}
                >
                    <StatsCard
                        title={stat.title}
                        value={stat.value}
                        change={stat.change}
                        subtitle={stat.subtitle}
                        icon={stat.icon}
                        color={stat.color}
                        bgColor={stat.bgColor}
                        gradient={stat.gradient}
                        trend={stat.trend === 'neutral' ? undefined : stat.trend}
                        loading={stat.loading}
                        percentage={stat.percentage}
                    />
                </div>
            ))}
        </div>
    );
}
