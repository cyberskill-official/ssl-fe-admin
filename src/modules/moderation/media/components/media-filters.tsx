import { Grid, List, Search } from 'lucide-react';

import { Button, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '#shared/component';

interface MediaFiltersProps {
    searchTerm: string;
    statusFilter: string;
    viewMode: 'grid' | 'list';
    limit: number;
    onSearchChange: (value: string) => void;
    onStatusChange: (value: string) => void;
    onViewModeChange: (mode: 'grid' | 'list') => void;
    onLimitChange: (limit: number) => void;
}

export function MediaFilters({
    searchTerm,
    statusFilter,
    viewMode,
    limit,
    onSearchChange,
    onStatusChange,
    onViewModeChange,
    onLimitChange,
}: MediaFiltersProps) {
    return (
        <div className="mt-6 flex flex-col sm:flex-row gap-4 items-center">
            <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                    value={searchTerm}
                    onChange={e => onSearchChange(e.target.value)}
                    placeholder="Search by username..."
                    className="pl-10 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-gray-200 dark:border-gray-600"
                />
            </div>

            <Select value={statusFilter} onValueChange={onStatusChange}>
                <SelectTrigger className="w-48 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
                    <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Content</SelectItem>
                    <SelectItem value="pending">Pending Review</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
            </Select>

            <div className="flex bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-lg p-1">
                <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => onViewModeChange('grid')}
                    className="rounded-md"
                >
                    <Grid className="w-4 h-4" />
                </Button>
                <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => onViewModeChange('list')}
                    className="rounded-md"
                >
                    <List className="w-4 h-4" />
                </Button>
            </div>

            <Select
                value={limit.toString()}
                onValueChange={(value: string) => onLimitChange(Number.parseInt(value))}
            >
                <SelectTrigger className="w-32 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="20">20 items</SelectItem>
                    <SelectItem value="50">50 items</SelectItem>
                    <SelectItem value="100">100 items</SelectItem>
                    <SelectItem value="200">200 items</SelectItem>
                </SelectContent>
            </Select>
        </div>
    );
}
