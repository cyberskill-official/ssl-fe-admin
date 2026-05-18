import { Clock, CreditCard, Filter, Globe, Search, Users, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { useGetCountries } from '#modules/location/country/country.hook';
import { AutocompleteSelect, Button, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '#shared/component';
import { useTranslate } from '#shared/i18n';

interface I_UserSearchFilters {
    username: string;
    email: string;
    country: string;
    isActive: string;
    membershipStatus: string;
    userStatus: string;
}

interface I_UserSearchProps {
    filters: I_UserSearchFilters;
    onFiltersChange: (filters: Partial<I_UserSearchFilters>) => void;
    onClear: () => void;
    loading?: boolean;
}

export function UserSearch({ filters, onFiltersChange, onClear, loading }: I_UserSearchProps) {
    const { t } = useTranslate('user');
    const { countries } = useGetCountries({ isDel: false }, { pagination: false });

    const [localUsername, setLocalUsername] = useState(filters.username);
    const [localEmail, setLocalEmail] = useState(filters.email);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (localUsername !== filters.username) {
                onFiltersChange({ username: localUsername });
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [localUsername, filters.username, onFiltersChange]);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (localEmail !== filters.email) {
                onFiltersChange({ email: localEmail });
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [localEmail, filters.email, onFiltersChange]);

    // Only reset local state when filters are explicitly cleared (e.g. onClear button).
    // Do NOT sync when debounce fires — that triggers a race condition that resets the input.
    useEffect(() => {
        if (filters.username === '') {
            // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect
            setLocalUsername('');
        }
    }, [filters.username]);

    useEffect(() => {
        if (filters.email === '') {
            // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect
            setLocalEmail('');
        }
    }, [filters.email]);

    const handleInputChange = useCallback((field: keyof I_UserSearchFilters, value: string | boolean) => {
        onFiltersChange({ [field]: value });
    }, [onFiltersChange]);

    const hasActiveFilters = Object.entries(filters).some(([key, value]) => {
        if (key === 'username' || key === 'email') {
            return value !== '';
        }
        if (key === 'userStatus') {
            return value !== 'all';
        }
        return value !== 'all';
    });

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                    <Search className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {t('search-filters')}
                </h3>
                <div className="ml-auto flex items-center gap-2">
                    {hasActiveFilters && (
                        <span className="text-xs bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-2 py-1 rounded-full">
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                {/* Username Search */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                        <Users className="h-3 w-3" />
                        {t('username')}
                    </label>
                    <Input
                        placeholder={t('search-by-username')}
                        value={localUsername}
                        onChange={e => setLocalUsername(e.target.value)}
                        className="h-9"
                        disabled={loading}
                    />
                </div>

                {/* Email Search */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                        <Search className="h-3 w-3" />
                        {t('email')}
                    </label>
                    <Input
                        placeholder={t('search-by-email')}
                        value={localEmail}
                        onChange={e => setLocalEmail(e.target.value)}
                        className="h-9"
                        disabled={loading}
                    />
                </div>

                {/* Country Filter */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                        <Globe className="h-3 w-3" />
                        {t('country')}
                    </label>
                    <AutocompleteSelect
                        options={[
                            { id: 'all', name: t('all-countries') },
                            ...countries
                                .filter(c => c && c.id)
                                .map(c => ({ id: c!.id!, name: c!.name || '' })),
                        ]}
                        value={filters.country}
                        onChange={value => handleInputChange('country', value)}
                        placeholder={t('all-countries')}
                        disabled={loading}
                        onClear={() => handleInputChange('country', 'all')}
                    />
                </div>

                {/* Account Status Filter */}

                {/* Membership Status Filter */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                        <CreditCard className="h-3 w-3" />
                        {t('membership')}
                    </label>
                    <Select
                        value={filters.membershipStatus}
                        onValueChange={value => handleInputChange('membershipStatus', value)}
                        disabled={loading}
                    >
                        <SelectTrigger className="h-9">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">{t('all-memberships')}</SelectItem>
                            <SelectItem value="paid">
                                <div className="flex items-center gap-2">
                                    <CreditCard className="h-3 w-3 text-green-600" />
                                    {t('paid-members')}
                                </div>
                            </SelectItem>
                            <SelectItem value="free">
                                <div className="flex items-center gap-2">
                                    <Clock className="h-3 w-3 text-gray-600" />
                                    {t('free-members')}
                                </div>
                            </SelectItem>
                            <SelectItem value="promo">
                                <div className="flex items-center gap-2">
                                    <CreditCard className="h-3 w-3 text-purple-600" />
                                    {t('promo-members')}
                                </div>
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* User Status Filter */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                        <Filter className="h-3 w-3" />
                        {t('user-status')}
                    </label>
                    <Select
                        value={filters.userStatus}
                        onValueChange={value => handleInputChange('userStatus', value)}
                        disabled={loading}
                    >
                        <SelectTrigger className="h-9">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">
                                <div className="flex items-center gap-2">
                                    <Users className="h-3 w-3" />
                                    {t('all-users')}
                                </div>
                            </SelectItem>
                            <SelectItem value="deactivated">
                                <div className="flex items-center gap-2">
                                    <X className="h-3 w-3 text-red-600" />
                                    {t('deactivated-users')}
                                </div>
                            </SelectItem>
                            <SelectItem value="blocked">
                                <div className="flex items-center gap-2">
                                    <X className="h-3 w-3 text-orange-600" />
                                    {t('blocked-users')}
                                </div>
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Search Results Info */}
            {hasActiveFilters && (
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
                        <Filter className="h-4 w-4" />
                        <span>
                            {t('active-filters')}
                            :
                        </span>
                        <div className="flex flex-wrap gap-1">
                            {filters.username && (
                                <span className="bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 px-2 py-1 rounded text-xs">
                                    {t('username')}
                                    :
                                    {' '}
                                    "
                                    {filters.username}
                                    "
                                </span>
                            )}
                            {filters.email && (
                                <span className="bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 px-2 py-1 rounded text-xs">
                                    {t('email')}
                                    :
                                    {' '}
                                    "
                                    {filters.email}
                                    "
                                </span>
                            )}
                            {filters.country && filters.country !== 'all' && (
                                <span className="bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 px-2 py-1 rounded text-xs">
                                    {t('country')}
                                    :
                                    {' '}
                                    {filters.country}
                                </span>
                            )}
                            {filters.isActive !== 'all' && (
                                <span className="bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 px-2 py-1 rounded text-xs">
                                    {t('status')}
                                    :
                                    {' '}
                                    {t(filters.isActive)}
                                </span>
                            )}
                            {filters.membershipStatus !== 'all' && (
                                <span className="bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 px-2 py-1 rounded text-xs">
                                    {t('membership')}
                                    :
                                    {' '}
                                    {t(filters.membershipStatus === 'paid' ? 'paid-members' : filters.membershipStatus === 'promo' ? 'promo-members' : 'free-members')}
                                </span>
                            )}
                            {filters.userStatus !== 'all' && (
                                <span className={`px-2 py-1 rounded text-xs ${filters.userStatus === 'blocked' ? 'bg-orange-100 dark:bg-orange-800 text-orange-800 dark:text-orange-200' : 'bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-200'}`}>
                                    {t('user-status')}
                                    :
                                    {' '}
                                    {t(filters.userStatus === 'deactivated' ? 'deactivated-users' : 'blocked-users')}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
