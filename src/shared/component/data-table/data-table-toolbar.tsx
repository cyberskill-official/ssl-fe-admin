import type { Table } from '@tanstack/react-table';

import { Settings2 } from 'lucide-react';

import { Button } from '#shared/component/button';
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '#shared/component/dropdown-menu';
import { Input } from '#shared/component/input';

interface I_DataTableToolbarProps<TData> {
    table: Table<TData>;
    searchKey?: string;
    searchPlaceholder?: string;
    showColumnVisibility?: boolean;
    searchValue?: string;
    onSearchChange?: (value: string) => void;
}

export function DataTableToolbar<TData>({
    table,
    searchKey,
    searchPlaceholder = 'Search...',
    showColumnVisibility = true,
    searchValue,
    onSearchChange,
}: I_DataTableToolbarProps<TData>) {
    const isFiltered = table.getState().columnFilters.length > 0;

    return (
        <div className="flex items-center justify-between py-4">
            <div className="flex flex-1 items-center space-x-2">
                {searchKey && (
                    <Input
                        placeholder={searchPlaceholder}
                        value={searchValue ?? (table.getColumn(searchKey)?.getFilterValue() as string) ?? ''}
                        onChange={(event) => {
                            onSearchChange
                                ? onSearchChange(event.target.value)
                                : table.getColumn(searchKey)?.setFilterValue(event.target.value);
                        }}
                        className="h-8 w-[150px] lg:w-[250px]"
                    />
                )}
                {isFiltered && (
                    <Button
                        variant="ghost"
                        onClick={() => table.resetColumnFilters()}
                        className="h-8 px-2 lg:px-3"
                    >
                        Reset
                        <span className="sr-only">Reset filters</span>
                    </Button>
                )}
            </div>
            {showColumnVisibility && (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="outline"
                            size="sm"
                            className="ml-auto hidden h-8 lg:flex"
                        >
                            <Settings2 className="mr-2 h-4 w-4" />
                            View
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-[150px]">
                        <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {table
                            .getAllColumns()
                            .filter(
                                column =>
                                    typeof column.accessorFn !== 'undefined' && column.getCanHide(),
                            )
                            .map((column) => {
                                return (
                                    <DropdownMenuCheckboxItem
                                        key={column.id}
                                        className="capitalize"
                                        checked={column.getIsVisible()}
                                        onCheckedChange={value => column.toggleVisibility(!!value)}
                                    >
                                        {column.id}
                                    </DropdownMenuCheckboxItem>
                                );
                            })}
                    </DropdownMenuContent>
                </DropdownMenu>
            )}
        </div>
    );
}
