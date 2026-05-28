'use client';

import type {
    ColumnDef,
    ColumnFiltersState,
    RowSelectionState,
    SortingState,
    VisibilityState,
} from '@tanstack/react-table';

import {
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from '@tanstack/react-table';
import * as React from 'react';

import {
    TableCell,
    TableHead,
    TableRow,
} from '#shared/component/table';

import { DataTablePagination } from './data-table-pagination';
import { DataTableToolbar } from './data-table-toolbar';

interface I_DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
    searchKey?: string;
    searchPlaceholder?: string;
    showPagination?: boolean;
    showToolbar?: boolean;
    showColumnVisibility?: boolean;
    showRowSelection?: boolean;
    pageSize?: number;
    pageSizeOptions?: number[];
    className?: string;
    onRowSelectionChange?: (selection: RowSelectionState) => void;
    selectedRows?: RowSelectionState;
    page?: number;
    totalItems?: number;
    onPageChange?: (page: number) => void;
    onPageSizeChange?: (size: number) => void;
    searchValue?: string;
    onSearchChange?: (value: string) => void;
}

export function DataTable<TData, TValue>({
    columns,
    data,
    searchKey,
    searchPlaceholder = 'Search...',
    showPagination = true,
    showToolbar = true,
    showColumnVisibility = true,
    pageSize = 10,
    pageSizeOptions,
    className,
    onRowSelectionChange,
    selectedRows,
    page,
    totalItems,
    onPageChange,
    onPageSizeChange,
    searchValue,
    onSearchChange,
}: I_DataTableProps<TData, TValue>) {
    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
    const [rowSelection, setRowSelection] = React.useState<RowSelectionState>(selectedRows || {});
    const [internalPage, setInternalPage] = React.useState(1);
    const [internalPageSize, setInternalPageSize] = React.useState(pageSize);

    const currentPage = page ?? internalPage;
    const currentPageSize = pageSize ?? internalPageSize;

    const table = useReactTable({
        data,
        columns,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: (updater) => {
            const newSelection = typeof updater === 'function' ? updater(rowSelection) : updater;
            setRowSelection(newSelection);
            onRowSelectionChange?.(newSelection);
        },
        state: {
            sorting,
            columnFilters,
            columnVisibility,
            rowSelection,
            pagination: {
                pageIndex: currentPage - 1,
                pageSize: currentPageSize,
            },
        },
    });

    return (
        <div className={className}>
            {showToolbar && (
                <DataTableToolbar
                    table={table}
                    searchKey={searchKey}
                    searchPlaceholder={searchPlaceholder}
                    showColumnVisibility={showColumnVisibility}
                    searchValue={searchValue}
                    onSearchChange={onSearchChange}
                />
            )}
            <div className="w-full overflow-x-auto rounded-2xl shadow-xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-md glassmorphism border border-gray-200 dark:border-gray-700 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 dark:scrollbar-thumb-gray-700 dark:scrollbar-track-gray-900">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                        {table.getHeaderGroups().map(headerGroup => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map(header => (
                                    <TableHead key={header.id}>
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(
                                                    header.column.columnDef.header,
                                                    header.getContext(),
                                                )}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {table.getRowModel().rows?.length
                            ? (
                                    table.getRowModel().rows.map((row, idx) => (
                                        <TableRow
                                            key={row.id || idx}
                                            className="transition-colors duration-200 hover:bg-purple-100/40 dark:hover:bg-purple-900/30 rounded-xl text-gray-900 dark:text-gray-100"
                                            style={
                                                idx < 10
                                                    ? {
                                                            animation: `fadeInUp 0.4s ${idx * 0.03}s both`,
                                                            willChange: 'transform, opacity',
                                                        }
                                                    : undefined
                                            }
                                        >
                                            {row.getVisibleCells().map(cell => (
                                                <TableCell key={cell.id}>
                                                    {flexRender(
                                                        cell.column.columnDef.cell,
                                                        cell.getContext(),
                                                    )}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))
                                )
                            : (
                                    <TableRow>
                                        <TableCell
                                            colSpan={columns.length}
                                            className="h-24 text-center"
                                        >
                                            No results.
                                        </TableCell>
                                    </TableRow>
                                )}
                    </tbody>
                </table>
            </div>
            {showPagination && (
                <DataTablePagination
                    table={table}
                    pageSizeOptions={pageSizeOptions}
                    page={currentPage}
                    pageSize={currentPageSize}
                    totalItems={totalItems}
                    onPageChange={onPageChange ?? setInternalPage}
                    onPageSizeChange={onPageSizeChange ?? setInternalPageSize}
                />
            )}
        </div>
    );
}
