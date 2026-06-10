import {
    ChevronLeftIcon,
    ChevronRightIcon,
    MoreHorizontalIcon,
} from 'lucide-react';
import * as React from 'react';

import { cn } from '#shared/util';

import { buttonVariants } from './button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';

export interface I_PaginationProps {
    total: number;
    page: number;
    limit: number;
    onPageChange?: (page: number) => void;
    onLimitChange?: (limit: number) => void;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    totalPages: number;
    className?: string;
    style?: React.CSSProperties;
    sticky?: boolean;
    pageSizeOptions?: readonly number[];
}

export function Pagination({
    total,
    page,
    limit,
    onPageChange,
    onLimitChange,
    hasNextPage,
    hasPrevPage,
    totalPages,
    className,
    style,
    sticky = true,
    pageSizeOptions = [10, 25, 50, 100, 500, 1000],
}: I_PaginationProps) {
    const start = total === 0 ? 0 : (page - 1) * limit + 1;
    const end = Math.min(page * limit, total);
    const _generatePaginationItems = () => {
        const items = [];
        const maxVisiblePages = 5;
        if (totalPages <= maxVisiblePages) {
            for (let i = 1; i <= totalPages; i++) items.push(i);
        }
        else {
            items.push(1);
            if (page > 3)
                items.push('ellipsis-start');
            const start = Math.max(2, page - 1);
            const end = Math.min(totalPages - 1, page + 1);
            for (let i = start; i <= end; i++) {
                if (i !== 1 && i !== totalPages)
                    items.push(i);
            }
            if (page < totalPages - 2)
                items.push('ellipsis-end');
            if (totalPages > 1)
                items.push(totalPages);
        }
        return items;
    };
    return (
        <div
            className={cn(
                'w-full bg-white dark:bg-slate-800 border-t dark:border-slate-700 flex items-center justify-between px-4 py-2',
                sticky && 'sticky bottom-0 z-10',
                className,
            )}
            style={style}
        >
            <div className="text-sm text-muted-foreground dark:text-slate-400">
                {total === 0
                    ? 'No results'
                    : `Showing ${start}–${end} of ${total}`}
            </div>
            <div className="flex items-center gap-4">
                {onLimitChange && (
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground dark:text-slate-400">Show</span>
                        <Select value={limit.toString()} onValueChange={v => onLimitChange(Number.parseInt(v))}>
                            <SelectTrigger className="w-20 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-200">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="dark:bg-slate-800 dark:border-slate-700">
                                {pageSizeOptions.map(option => (
                                    <SelectItem key={option} value={String(option)} className="dark:text-slate-200 dark:hover:bg-slate-700">
                                        {option}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <span className="text-sm text-muted-foreground dark:text-slate-400">per page</span>
                    </div>
                )}
                {onPageChange && (
                    <nav role="navigation" aria-label="pagination" className="flex w-auto justify-center">
                        <ul className="flex flex-row items-center gap-1">
                            <li>
                                <a
                                    aria-label="Go to previous page"
                                    className={cn(
                                        buttonVariants({ variant: 'ghost', size: 'icon' }),
                                        'dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-slate-100',
                                        !hasPrevPage && 'pointer-events-none opacity-50',
                                    )}
                                    href="#"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        if (hasPrevPage)
                                            onPageChange(page - 1);
                                    }}
                                >
                                    <ChevronLeftIcon />
                                </a>
                            </li>
                            {_generatePaginationItems().map(item => (
                                <li key={item}>
                                    {item === 'ellipsis-start' || item === 'ellipsis-end'
                                        ? (
                                                <span className="flex size-9 items-center justify-center text-slate-400 dark:text-slate-500">
                                                    <MoreHorizontalIcon className="size-4" />
                                                </span>
                                            )
                                        : (
                                                <a
                                                    href="#"
                                                    aria-current={page === item ? 'page' : undefined}
                                                    className={cn(
                                                        buttonVariants({
                                                            variant: page === item ? 'outline' : 'ghost',
                                                            size: 'icon',
                                                        }),
                                                        'dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-slate-100',
                                                        page === item && 'border-primary dark:border-blue-400 dark:bg-blue-900/50',
                                                    )}
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        if (page !== item)
                                                            onPageChange(item as number);
                                                    }}
                                                >
                                                    {item}
                                                </a>
                                            )}
                                </li>
                            ))}
                            <li>
                                <a
                                    aria-label="Go to next page"
                                    className={cn(
                                        buttonVariants({ variant: 'ghost', size: 'icon' }),
                                        'dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-slate-100',
                                        !hasNextPage && 'pointer-events-none opacity-50',
                                    )}
                                    href="#"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        if (hasNextPage)
                                            onPageChange(page + 1);
                                    }}
                                >
                                    <ChevronRightIcon />
                                </a>
                            </li>
                        </ul>
                    </nav>
                )}
            </div>
        </div>
    );
}
