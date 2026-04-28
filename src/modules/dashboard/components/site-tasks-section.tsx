import type { LucideIcon } from 'lucide-react';

import { Clock, Target } from 'lucide-react';

import { Button } from '#shared/component';

import TaskRow from './task-row';

export interface I_TaskItem {
    id: string;
    title: string;
    lastUpdated: string;
    status: string;
    priority: string;
    assignee: string;
    statusColor: string;
    priorityColor: string;
    icon: LucideIcon;
}

interface I_SiteTasksSectionProps {
    tasks: I_TaskItem[];
}

export function SiteTasksSection({ tasks }: I_SiteTasksSectionProps) {
    return (
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 dark:border-slate-700/20">
            <div className="p-8 border-b border-white/20 dark:border-slate-700/20 bg-gradient-to-r from-white/80 to-purple-50/80 dark:from-slate-800/80 dark:to-slate-700/80">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl">
                            <Target className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-emerald-800 to-teal-800 dark:from-white dark:via-emerald-200 dark:to-teal-200 bg-clip-text text-transparent">
                            Site Tasks
                        </h3>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center whitespace-nowrap px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                    >
                        + Add New Task
                    </Button>
                </div>
            </div>
            <div className="p-8">
                <div className="space-y-4">
                    {tasks.map((task, index) => (
                        <div
                            key={task.id}
                            className="transform hover:scale-[1.02] transition-all duration-300"
                            style={{ animationDelay: `${index * 100}ms` }}
                        >
                            <TaskRow
                                task={task}
                                statusColor={task.statusColor}
                                priorityColor={task.priorityColor}
                                icon={task.icon}
                            />
                        </div>
                    ))}
                </div>
                <div className="mt-8 text-center">
                    <div className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-gray-50 to-purple-50 dark:from-slate-700 dark:to-slate-600 rounded-xl">
                        <Clock className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                        <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">
                            Showing
                            {' '}
                            {tasks.length}
                            {' '}
                            active tasks
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
