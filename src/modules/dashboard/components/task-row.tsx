import { Clock, Edit, Trash2, User } from 'lucide-react';
import * as React from 'react';

import { Button } from '#shared/component';

interface I_TaskData {
    title: string;
    lastUpdated: string;
    status: string;
    priority: string;
    assignee: string;
    statusColor: string;
    priorityColor: string;
    icon: React.ElementType;
}

interface I_TaskRowProps {
    task: I_TaskData;
    statusColor: string;
    priorityColor: string;
    icon: React.ElementType;
}

function TaskRow({ task, statusColor, priorityColor, icon: Icon }: I_TaskRowProps) {
    return (
        <div className="bg-white/60 dark:bg-slate-700/60 backdrop-blur-sm p-6 rounded-2xl border border-white/20 dark:border-slate-600/20 hover:bg-white/80 dark:hover:bg-slate-700/80 hover:shadow-lg transition-all duration-300 group">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 flex-1">
                    {/* Task Icon */}
                    <div className="p-3 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/50 dark:to-pink-900/50 rounded-xl shadow-sm group-hover:shadow-md transition-all duration-300">
                        <Icon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                    </div>

                    {/* Task Details */}
                    <div className="flex-1 min-w-0">
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors duration-200">
                            {task.title}
                        </h4>
                        <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-300">
                            <div className="flex items-center space-x-1">
                                <Clock className="w-4 h-4" />
                                <span>
                                    Updated:
                                    {task.lastUpdated}
                                </span>
                            </div>
                            <div className="flex items-center space-x-1">
                                <User className="w-4 h-4" />
                                <span>{task.assignee}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Status and Actions */}
                <div className="flex items-center space-x-4">
                    {/* Status Badge */}
                    <span className={`px-3 py-1.5 rounded-full text-xs font-bold shadow-sm ${statusColor}`}>
                        {task.status}
                    </span>

                    {/* Priority Badge */}
                    <span className={`px-3 py-1.5 rounded-full text-xs font-bold shadow-sm ${priorityColor}`}>
                        {task.priority}
                    </span>

                    {/* Action Buttons */}
                    <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/50 hover:text-blue-700 dark:hover:text-blue-300 rounded-xl transition-all duration-200"
                        >
                            <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/50 hover:text-red-700 dark:hover:text-red-300 rounded-xl transition-all duration-200"
                        >
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default React.memo(TaskRow);
