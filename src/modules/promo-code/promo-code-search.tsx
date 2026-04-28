import { Filter, Search, Sparkles, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { Button, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '#shared/component';
import { useTranslate } from '#shared/i18n';

interface I_PromoCodeSearchFilters {
    code: string;
    isActive: string;
    benefit: string;
    isLimit: string;
}

interface I_PromoCodeSearchProps {
    filters: I_PromoCodeSearchFilters;
    onFiltersChange: (filters: Partial<I_PromoCodeSearchFilters>) => void;
    onClear: () => void;
    loading?: boolean;
}

export function PromoCodeSearch({ filters, onFiltersChange, onClear, loading }: I_PromoCodeSearchProps) {
    const { t } = useTranslate('promoCodes');

    const [localCode, setLocalCode] = useState(filters.code);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (localCode !== filters.code) {
                onFiltersChange({ code: localCode });
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [localCode, filters.code, onFiltersChange]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect
        setLocalCode(filters.code);
    }, [filters.code]);

    const handleInputChange = useCallback((field: keyof I_PromoCodeSearchFilters, value: string | boolean) => {
        onFiltersChange({ [field]: value });
    }, [onFiltersChange]);

    const hasActiveFilters = Object.entries(filters).some(([key, value]) => {
        if (key === 'code') {
            return value !== '';
        }
        return value !== 'all';
    });

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                    <Search className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {t('search-filters')}
                </h3>
                <div className="ml-auto flex items-center gap-2">
                    {hasActiveFilters && (
                        <span className="text-xs bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 px-2 py-1 rounded-full">
                            {t('filters-active')}
                        </span>
                    )}
                    {hasActiveFilters && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onClear}
                            className="h-8 px-3 text-xs"
                        >
                            <X className="h-3 w-3 mr-1" />
                            {t('clear-all')}
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Code Search - supports partial matching */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                        <Sparkles className="h-3 w-3" />
                        {t('code')}
                    </label>
                    <Input
                        placeholder={t('search-by-code')}
                        value={localCode}
                        onChange={e => setLocalCode(e.target.value)}
                        className="h-9"
                        disabled={loading}
                    />
                </div>

                {/* Active Status Filter */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                        <Filter className="h-3 w-3" />
                        {t('status')}
                    </label>
                    <Select
                        value={filters.isActive}
                        onValueChange={value => handleInputChange('isActive', value)}
                        disabled={loading}
                    >
                        <SelectTrigger className="h-9">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">{t('all-statuses')}</SelectItem>
                            <SelectItem value="true">
                                <div className="flex items-center gap-2">
                                    <span className="h-2 w-2 rounded-full bg-green-500" />
                                    {t('active')}
                                </div>
                            </SelectItem>
                            <SelectItem value="false">
                                <div className="flex items-center gap-2">
                                    <span className="h-2 w-2 rounded-full bg-gray-400" />
                                    {t('inactive')}
                                </div>
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Active Filters Info */}
            {hasActiveFilters && (
                <div className="mt-4 p-3 bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-800 rounded-lg">
                    <div className="flex items-center gap-2 text-sm text-purple-700 dark:text-purple-300">
                        <Filter className="h-4 w-4" />
                        <span>
                            {t('active-filters')}
                            :
                        </span>
                        <div className="flex flex-wrap gap-1">
                            {filters.code && (
                                <span className="bg-purple-100 dark:bg-purple-800 text-purple-800 dark:text-purple-200 px-2 py-1 rounded text-xs">
                                    {t('code')}
                                    :
                                    {' '}
                                    "
                                    {filters.code}
                                    "
                                </span>
                            )}
                            {filters.isActive !== 'all' && (
                                <span className={`px-2 py-1 rounded text-xs ${filters.isActive === 'true' ? 'bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200' : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200'}`}>
                                    {t('status')}
                                    :
                                    {' '}
                                    {filters.isActive === 'true' ? t('active') : t('inactive')}
                                </span>
                            )}
                            {filters.benefit !== 'all' && (
                                <span className="bg-purple-100 dark:bg-purple-800 text-purple-800 dark:text-purple-200 px-2 py-1 rounded text-xs">
                                    {t('benefit')}
                                    :
                                    {' '}
                                    {filters.benefit === 'lifetime' ? t('lifetime-benefit') : `${filters.benefit} ${filters.benefit === '1' ? t('month') : t('months')}`}
                                </span>
                            )}
                            {filters.isLimit !== 'all' && (
                                <span className={`px-2 py-1 rounded text-xs ${filters.isLimit === 'true' ? 'bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200' : 'bg-purple-100 dark:bg-purple-800 text-purple-800 dark:text-purple-200'}`}>
                                    {t('usage-limit')}
                                    :
                                    {' '}
                                    {filters.isLimit === 'true' ? t('limited') : t('unlimited')}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
