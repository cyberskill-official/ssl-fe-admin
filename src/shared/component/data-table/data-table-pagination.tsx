import type { Table } from '@tanstack/react-table';

import {
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
} from 'lucide-react';

import { Button } from '#shared/component/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '#shared/component/select';

interface I_DataTablePaginationProps<TData> {
    table: Table<TData>;
    pageSizeOptions?: number[];
    page?: number;
    pageSize?: number;
    totalItems?: number;
    onPageChange?: (page: number) => void;
    onPageSizeChange?: (size: number) => void;
}

const defaultPageSizeOptions = [10, 20, 30, 40, 50];

export function DataTablePagination<TData>({
    table,
    pageSizeOptions = defaultPageSizeOptions,
    page,
    pageSize,
    totalItems,
    onPageChange,
    onPageSizeChange,
}: I_DataTablePaginationProps<TData>) {
    // Use controlled or fallback to table state
    const currentPage = page ?? table.getState().pagination.pageIndex + 1;
    const currentPageSize = pageSize ?? table.getState().pagination.pageSize;
    const total = totalItems ?? table.getFilteredRowModel().rows.length;
    const pageCount = Math.ceil(total / currentPageSize) || 1;

    return (
        <div className="flex items-center justify-between px-4 py-2 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 rounded-b-2xl text-gray-900 dark:text-gray-100">
            <div className="flex-1 text-sm text-muted-foreground">
                {table.getFilteredSelectedRowModel().rows.length > 0
                    ? (
                            <>
                                {table.getFilteredSelectedRowModel().rows.length}
                                {' '}
                                of
                                {' '}
                                {total}
                                {' '}
                                row(s) selected.
                            </>
                        )
                    : (
                            <>
                                Showing
                                {' '}
                                {Math.min((currentPage - 1) * currentPageSize + 1, total)}
                                {' '}
                                to
                                {' '}
                                {Math.min(currentPage * currentPageSize, total)}
                                {' '}
                                of
                                {' '}
                                {total}
                                {' '}
                                entries
                            </>
                        )}
            </div>
            <div className="flex items-center space-x-6 lg:space-x-8">
                <div className="flex items-center space-x-2">
                    <p className="text-sm font-medium">Rows per page</p>
                    <Select
                        value={`${currentPageSize}`}
                        onValueChange={(value) => {
                            onPageSizeChange ? onPageSizeChange(Number(value)) : table.setPageSize(Number(value));
                        }}
                    >
                        <SelectTrigger className="h-8 w-[70px]">
                            <SelectValue placeholder={currentPageSize} />
                        </SelectTrigger>
                        <SelectContent side="top">
                            {pageSizeOptions.map(pageSize => (
                                <SelectItem key={pageSize} value={`${pageSize}`}>
                                    {pageSize}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex w-[100px] items-center justify-center text-sm font-medium">
                    Page
                    {' '}
                    {currentPage}
                    {' '}
                    of
                    {' '}
                    {pageCount}
                </div>
                <div className="flex items-center space-x-2">
                    <Button
                        variant="outline"
                        size="icon"
                        className="hidden h-8 w-8 lg:flex"
                        onClick={() => onPageChange ? onPageChange(1) : table.setPageIndex(0)}
                        disabled={currentPage === 1}
                    >
                        <span className="sr-only">Go to first page</span>
                        <ChevronsLeft className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onPageChange ? onPageChange(currentPage - 1) : table.previousPage()}
                        disabled={currentPage === 1}
                    >
                        <span className="sr-only">Go to previous page</span>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onPageChange ? onPageChange(currentPage + 1) : table.nextPage()}
                        disabled={currentPage === pageCount}
                    >
                        <span className="sr-only">Go to next page</span>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        className="hidden h-8 w-8 lg:flex"
                        onClick={() => onPageChange ? onPageChange(pageCount) : table.setPageIndex(pageCount - 1)}
                        disabled={currentPage === pageCount}
                    >
                        <span className="sr-only">Go to last page</span>
                        <ChevronsRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
