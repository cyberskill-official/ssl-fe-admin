'use client';

import type { DateRange } from 'react-day-picker';

import { CalendarIcon } from 'lucide-react';
import * as React from 'react';
import { useId } from 'react';

import { Button } from './button';
import { Calendar } from './calendar';
import { Label } from './label';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from './popover';

export function DatePicker({ label, value, onChange, mode = 'single', minDate, maxDate }: { label: string; id?: string; value: Date | DateRange | undefined; onChange: (date: Date | DateRange | undefined) => void; mode?: 'single' | 'range'; minDate?: Date; maxDate?: Date }) {
    const id = useId();
    const [open, setOpen] = React.useState(false);

    // Create disabled function based on min/max dates
    const isDateDisabled = React.useCallback((date: Date) => {
        if (minDate && date < minDate) {
            return true;
        }
        if (maxDate && date > maxDate) {
            return true;
        }
        return false;
    }, [minDate, maxDate]);

    return (
        <div className="flex flex-col gap-3">
            {label && (
                <Label htmlFor={id} className="px-1 text-purple-600 dark:text-purple-400">
                    {label}
                </Label>
            )}
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        id={id}
                        className="w-full justify-between font-normal border-purple-300 dark:border-purple-600 focus:border-purple-500 dark:focus:border-purple-400"
                    >
                        {mode === 'range'
                            ? (value && typeof value === 'object' && 'from' in value && value.from
                                    ? `${value.from.toLocaleDateString()}${value.to ? ` - ${value.to.toLocaleDateString()}` : ''}`
                                    : 'Select date')
                            : value && value instanceof Date
                                ? value.toLocaleDateString()
                                : 'Select date'}
                        <CalendarIcon className="h-4 w-4" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                    {mode === 'range'
                        ? (
                                <Calendar
                                    mode="range"
                                    selected={value as DateRange | undefined}
                                    captionLayout="dropdown"
                                    required={false}
                                    fromDate={minDate}
                                    toDate={maxDate}
                                    disabled={isDateDisabled}
                                    onSelect={(date: DateRange | undefined) => {
                                        onChange(date);
                                        setOpen(false);
                                    }}
                                />
                            )
                        : (
                                <Calendar
                                    mode="single"
                                    selected={value as Date | undefined}
                                    captionLayout="dropdown"
                                    fromDate={minDate}
                                    toDate={maxDate}
                                    disabled={isDateDisabled}
                                    onSelect={(date: Date | undefined) => {
                                        onChange(date);
                                        setOpen(false);
                                    }}
                                />
                            )}
                </PopoverContent>
            </Popover>
        </div>
    );
}
