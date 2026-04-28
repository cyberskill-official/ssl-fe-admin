import { ChevronDown, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { cn } from '#shared/util';

interface Option {
    id: string;
    name: string;
    searchText?: string;
}

interface AutocompleteSelectProps {
    options: Option[];
    value?: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    disabled?: boolean;
    error?: boolean;
    onClear?: () => void;
}

export function AutocompleteSelect({
    options,
    value,
    onChange,
    placeholder = 'Type to search...',
    className,
    disabled = false,
    error = false,
    onClear,
}: AutocompleteSelectProps) {
    const currentSelectedOption = options.find(opt => opt.id === value) || null;
    const [searchTerm, setSearchTerm] = useState<string>(() => currentSelectedOption?.name || '');
    const [showDropdown, setShowDropdown] = useState<boolean>(false);
    const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);

    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const filteredOptions = options.filter((option) => {
        const searchLower = searchTerm.toLowerCase();
        const nameLower = option.name.toLowerCase();
        const searchTextLower = option.searchText?.toLowerCase() || '';
        return nameLower.includes(searchLower) || searchTextLower.includes(searchLower);
    });

    useEffect(() => {
        if (!showDropdown) {
            const newName = currentSelectedOption?.name || '';
            if (searchTerm !== newName) {
                // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect
                setSearchTerm(newName);
            }
        }
    }, [currentSelectedOption?.name, showDropdown, searchTerm]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
                if (!currentSelectedOption) {
                    setSearchTerm('');
                }
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [currentSelectedOption]);

    const handleInputFocus = () => {
        if (disabled) {
            return;
        }
        setShowDropdown(true);
        setSearchTerm(currentSelectedOption?.name || '');
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
        setHighlightedIndex(-1); // Reset highlight when typing
    };

    const handleOptionSelect = (option: Option) => {
        setSearchTerm(option.name);
        setShowDropdown(false);
        setHighlightedIndex(-1);
        onChange(option.id);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!showDropdown) {
            return;
        }

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setHighlightedIndex(prev =>
                    prev < filteredOptions.length - 1 ? prev + 1 : 0,
                );
                break;
            case 'ArrowUp':
                e.preventDefault();
                setHighlightedIndex(prev =>
                    prev > 0 ? prev - 1 : filteredOptions.length - 1,
                );
                break;
            case 'Enter':
                e.preventDefault();
                if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
                    handleOptionSelect(filteredOptions[highlightedIndex]);
                }
                break;
            case 'Escape':
                setShowDropdown(false);
                setHighlightedIndex(-1);
                break;
        }
    };

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        setSearchTerm('');
        onChange('');
        onClear?.();
        inputRef.current?.focus();
    };

    const displayValue = showDropdown ? searchTerm : (currentSelectedOption?.name || '');

    return (
        <div ref={containerRef} className="relative">
            <div className="relative">
                <input
                    ref={inputRef}
                    type="text"
                    className={cn(
                        'w-full px-3 py-2 pr-8 border rounded-md bg-white dark:bg-gray-800',
                        'text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400',
                        'focus:outline-none focus:ring-2 focus:ring-offset-0',
                        error
                            ? 'border-red-500 focus:border-red-500 focus:ring-red-500 dark:border-red-400 dark:focus:border-red-400 dark:focus:ring-red-400'
                            : 'border-gray-300 dark:border-gray-600 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-purple-500 dark:focus:ring-purple-400',
                        disabled && 'opacity-50 cursor-not-allowed',
                        className,
                    )}
                    value={displayValue}
                    onChange={handleInputChange}
                    onFocus={handleInputFocus}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    disabled={disabled}
                    autoComplete="off"
                />
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
                    {currentSelectedOption && !disabled && (
                        <button
                            type="button"
                            onClick={handleClear}
                            className="p-0.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    )}
                    <ChevronDown
                        className={cn(
                            'w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform',
                            showDropdown && 'transform rotate-180',
                        )}
                    />
                </div>
            </div>

            {showDropdown && filteredOptions.length > 0 && (
                <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {filteredOptions.length > 10 && (
                        <div className="sticky top-0 bg-gray-50 dark:bg-gray-700 px-3 py-1 text-xs text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-600">
                            {filteredOptions.length}
                            {' '}
                            results found. Continue typing to narrow down...
                        </div>
                    )}
                    {filteredOptions.map((option, index) => (
                        <div
                            key={option.id}
                            className={cn(
                                'px-3 py-2 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-b-0',
                                'hover:bg-gray-50 dark:hover:bg-gray-700',
                                'text-gray-900 dark:text-gray-100',
                                currentSelectedOption?.id === option.id && 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300',
                                index === highlightedIndex && 'bg-blue-50 dark:bg-blue-900/20',
                            )}
                            onClick={() => handleOptionSelect(option)}
                            onMouseEnter={() => setHighlightedIndex(index)}
                        >
                            {option.name}
                        </div>
                    ))}
                </div>
            )}

            {showDropdown && filteredOptions.length === 0 && searchTerm && (
                <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg">
                    <div className="px-3 py-2 text-gray-500 dark:text-gray-400 text-sm">
                        No options found
                    </div>
                </div>
            )}
        </div>
    );
}
