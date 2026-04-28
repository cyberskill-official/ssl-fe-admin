import { Check, ChevronDown, ChevronRight, Globe, MapPin, Save } from 'lucide-react';
import { motion } from 'motion/react';
import { useMemo, useState } from 'react';

import type { Input_CreatePricing, Input_UpdatePricing, T_Country, T_Currency, T_Pricing, T_State } from '#shared/graphql';

import { Badge, Button, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '#shared/component';
import { E_PricingType as PricingType } from '#shared/graphql';
import { useTranslate } from '#shared/i18n';
import { cn } from '#shared/util';

interface I_PricingCountryConfigProps {
    countries: T_Country[];
    states: T_State[];
    currencies: T_Currency[];
    existingPrices: T_Pricing[];
    onSaveCountryPrice: (data: Input_CreatePricing | Input_UpdatePricing, existingId?: string) => Promise<void>;
    saving?: boolean;
}

interface I_CountryPriceForm {
    currencyId: string;
    membershipPrice: string;
    announcementPrice: string;
    taxRate: string;
}

interface I_StatePriceForm {
    membershipPrice: string;
    announcementPrice: string;
    taxRate: string;
}

export function PricingCountryConfig({
    countries,
    states,
    currencies,
    existingPrices,
    onSaveCountryPrice,
    saving,
}: I_PricingCountryConfigProps) {
    const { t } = useTranslate('pricing');
    const [expandedCountries, setExpandedCountries] = useState<Set<string>>(() => new Set());
    const [editingCountry, setEditingCountry] = useState<string | null>(null);
    const [editingState, setEditingState] = useState<string | null>(null);

    // Form states for each country/state
    const [countryForms, setCountryForms] = useState<Record<string, I_CountryPriceForm>>({});
    const [stateForms, setStateForms] = useState<Record<string, I_StatePriceForm>>({});

    // Group states by country
    const statesByCountry = useMemo(() => {
        const grouped: Record<string, T_State[]> = {};
        states.forEach((state) => {
            if (state?.countryId) {
                if (!grouped[state.countryId]) {
                    grouped[state.countryId] = [];
                }
                grouped[state.countryId]!.push(state);
            }
        });
        return grouped;
    }, [states]);

    // Check if a country has complete pricing (both membership and announcement)
    const getCountryPricingStatus = (countryId: string) => {
        const countryPrices = existingPrices.filter(
            p => p?.countryId === countryId && !p?.stateId,
        );

        const hasMembership = countryPrices.some(p => p?.type === PricingType.MEMBERSHIP);
        const hasAnnouncement = countryPrices.some(p => p?.type === PricingType.ANNOUNCEMENT);

        const membershipPrice = countryPrices.find(p => p?.type === PricingType.MEMBERSHIP);
        const announcementPrice = countryPrices.find(p => p?.type === PricingType.ANNOUNCEMENT);

        return {
            isComplete: hasMembership && hasAnnouncement,
            hasMembership,
            hasAnnouncement,
            membershipPrice,
            announcementPrice,
            currency: membershipPrice?.currency || announcementPrice?.currency,
            taxRate: membershipPrice?.taxRate ?? announcementPrice?.taxRate,
        };
    };

    // Get state pricing or inherit from country
    const getStatePricingStatus = (stateId: string, countryId: string) => {
        const statePrices = existingPrices.filter(
            p => p?.stateId === stateId,
        );

        const hasMembership = statePrices.some(p => p?.type === PricingType.MEMBERSHIP);
        const hasAnnouncement = statePrices.some(p => p?.type === PricingType.ANNOUNCEMENT);

        const membershipPrice = statePrices.find(p => p?.type === PricingType.MEMBERSHIP);
        const announcementPrice = statePrices.find(p => p?.type === PricingType.ANNOUNCEMENT);

        // Inherit from country if not set at state level
        const countryStatus = getCountryPricingStatus(countryId);

        return {
            isComplete: hasMembership && hasAnnouncement,
            hasMembership,
            hasAnnouncement,
            membershipPrice: membershipPrice || countryStatus.membershipPrice,
            announcementPrice: announcementPrice || countryStatus.announcementPrice,
            isInherited: !hasMembership && !hasAnnouncement,
            taxRate: membershipPrice?.taxRate ?? announcementPrice?.taxRate ?? countryStatus.taxRate,
        };
    };

    const toggleCountryExpand = (countryId: string) => {
        const newExpanded = new Set(expandedCountries);
        if (newExpanded.has(countryId)) {
            newExpanded.delete(countryId);
        }
        else {
            newExpanded.add(countryId);
        }
        setExpandedCountries(newExpanded);
    };

    const startEditCountry = (countryId: string) => {
        const status = getCountryPricingStatus(countryId);
        setEditingCountry(countryId);

        // Pre-fill form with existing data
        setCountryForms({
            ...countryForms,
            [countryId]: {
                currencyId: status.currency?.id || '',
                membershipPrice: status.membershipPrice?.price?.toString() || '',
                announcementPrice: status.announcementPrice?.price?.toString() || '',
                taxRate: (status.taxRate ?? 0).toString(),
            },
        });
    };

    const startEditState = (stateId: string, countryId: string) => {
        const status = getStatePricingStatus(stateId, countryId);
        setEditingState(stateId);

        // Pre-fill form with existing data
        setStateForms({
            ...stateForms,
            [stateId]: {
                membershipPrice: status.membershipPrice?.price?.toString() || '',
                announcementPrice: status.announcementPrice?.price?.toString() || '',
                taxRate: (status.taxRate ?? 0).toString(),
            },
        });
    };

    const saveCountryPrice = async (countryId: string) => {
        const form = countryForms[countryId];
        if (!form)
            return;

        const status = getCountryPricingStatus(countryId);

        // Save both membership and announcement prices
        const baseData = {
            countryId,
            currencyId: form.currencyId,
            taxRate: Number.parseFloat(form.taxRate),
            isActive: true,
        };

        // Save membership
        if (status.membershipPrice?.id) {
            await onSaveCountryPrice({
                ...baseData,
                type: PricingType.MEMBERSHIP,
                price: Number.parseFloat(form.membershipPrice),
            }, status.membershipPrice.id);
        }
        else {
            await onSaveCountryPrice({
                ...baseData,
                type: PricingType.MEMBERSHIP,
                price: Number.parseFloat(form.membershipPrice),
            });
        }

        // Save announcement
        if (status.announcementPrice?.id) {
            await onSaveCountryPrice({
                ...baseData,
                type: PricingType.ANNOUNCEMENT,
                price: Number.parseFloat(form.announcementPrice),
            }, status.announcementPrice.id);
        }
        else {
            await onSaveCountryPrice({
                ...baseData,
                type: PricingType.ANNOUNCEMENT,
                price: Number.parseFloat(form.announcementPrice),
            });
        }

        setEditingCountry(null);
    };

    const saveStatePrice = async (stateId: string, countryId: string) => {
        const form = stateForms[stateId];
        if (!form)
            return;

        const countryStatus = getCountryPricingStatus(countryId);

        const baseData = {
            countryId,
            stateId,
            currencyId: countryStatus.currency?.id || '',
            taxRate: Number.parseFloat(form.taxRate),
            isActive: true,
        };

        // Save membership
        const existingMembership = existingPrices.find(
            p => p?.stateId === stateId && p?.type === PricingType.MEMBERSHIP,
        );

        if (existingMembership?.id) {
            await onSaveCountryPrice({
                ...baseData,
                type: PricingType.MEMBERSHIP,
                price: Number.parseFloat(form.membershipPrice),
            }, existingMembership.id);
        }
        else {
            await onSaveCountryPrice({
                ...baseData,
                type: PricingType.MEMBERSHIP,
                price: Number.parseFloat(form.membershipPrice),
            });
        }

        // Save announcement
        const existingAnnouncement = existingPrices.find(
            p => p?.stateId === stateId && p?.type === PricingType.ANNOUNCEMENT,
        );

        if (existingAnnouncement?.id) {
            await onSaveCountryPrice({
                ...baseData,
                type: PricingType.ANNOUNCEMENT,
                price: Number.parseFloat(form.announcementPrice),
            }, existingAnnouncement.id);
        }
        else {
            await onSaveCountryPrice({
                ...baseData,
                type: PricingType.ANNOUNCEMENT,
                price: Number.parseFloat(form.announcementPrice),
            });
        }

        setEditingState(null);
    };

    const updateCountryForm = (countryId: string, field: keyof I_CountryPriceForm, value: string) => {
        setCountryForms(prev => ({
            ...prev,
            [countryId]: {
                ...prev[countryId],
                [field]: value,
            } as I_CountryPriceForm,
        }));
    };

    const updateStateForm = (stateId: string, field: keyof I_StatePriceForm, value: string) => {
        setStateForms(prev => ({
            ...prev,
            [stateId]: {
                ...prev[stateId],
                [field]: value,
            } as I_StatePriceForm,
        }));
    };

    // Calculate summary stats
    const summary = useMemo(() => {
        const total = countries.length;
        const configured = countries.filter((c) => {
            if (!c?.id)
                return false;
            const countryPrices = existingPrices.filter(
                p => p?.countryId === c.id && !p?.stateId,
            );
            const hasMembership = countryPrices.some(p => p?.type === PricingType.MEMBERSHIP);
            const hasAnnouncement = countryPrices.some(p => p?.type === PricingType.ANNOUNCEMENT);
            return hasMembership && hasAnnouncement;
        }).length;
        const percentage = total > 0 ? (configured / total) * 100 : 0;

        return { total, configured, remaining: total - configured, percentage };
    }, [countries, existingPrices]);

    return (
        <div className="space-y-6">
            {/* Summary Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/50 dark:to-blue-950/50 rounded-2xl p-6 border border-purple-200 dark:border-purple-800"
            >
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                            {t('country-pricing-configuration')}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                            Configure pricing for all countries to ensure complete coverage
                        </p>
                    </div>
                    <div className="text-right">
                        <div className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                            {summary.configured}
                            /
                            {summary.total}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                            {summary.percentage.toFixed(0)}
                            % Complete
                        </div>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${summary.percentage}%` }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                        className="h-full bg-gradient-to-r from-purple-600 to-blue-600"
                    />
                </div>

                {summary.remaining > 0 && (
                    <p className="text-sm text-orange-600 dark:text-orange-400 mt-3">
                        ⚠️
                        {' '}
                        {summary.remaining}
                        {' '}
                        {summary.remaining === 1 ? 'country' : 'countries'}
                        {' '}
                        still need configuration
                    </p>
                )}
            </motion.div>

            {/* Country List */}
            <div className="space-y-3">
                {countries.map((country, index) => {
                    if (!country?.id)
                        return null;

                    const status = getCountryPricingStatus(country.id);
                    const isExpanded = expandedCountries.has(country.id);
                    const isEditing = editingCountry === country.id;
                    const countryStates = statesByCountry[country.id] || [];
                    const hasStates = countryStates.length > 0;

                    return (
                        <motion.div
                            key={country.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.02 }}
                            className={cn(
                                'bg-white dark:bg-gray-800 rounded-xl border-2 transition-all duration-200',
                                status.isComplete
                                    ? 'border-green-300 dark:border-green-700'
                                    : 'border-gray-200 dark:border-gray-700',
                            )}
                        >
                            {/* Country Header */}
                            <div className="p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3 flex-1">
                                        {/* Expand/Collapse Button (if has states) */}
                                        {hasStates && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => toggleCountryExpand(country.id!)}
                                                className="p-1 h-6 w-6"
                                            >
                                                {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                            </Button>
                                        )}

                                        {/* Status Indicator */}
                                        <div className={cn(
                                            'w-8 h-8 rounded-full flex items-center justify-center',
                                            status.isComplete
                                                ? 'bg-green-100 dark:bg-green-900/30'
                                                : 'bg-gray-100 dark:bg-gray-700',
                                        )}
                                        >
                                            {status.isComplete
                                                ? <Check className="text-green-600 dark:text-green-400" size={20} />
                                                : <Globe className="text-gray-400" size={20} />}
                                        </div>

                                        {/* Country Name */}
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold text-gray-900 dark:text-gray-100">
                                                    {country.emoji}
                                                    {' '}
                                                    {country.name}
                                                </span>
                                                {hasStates && (
                                                    <Badge variant="outline" className="text-xs">
                                                        {countryStates.length}
                                                        {' '}
                                                        states
                                                    </Badge>
                                                )}
                                            </div>
                                            {status.isComplete && !isEditing && (
                                                <div className="flex gap-4 mt-1 text-xs text-gray-600 dark:text-gray-400">
                                                    <span>
                                                        {status.currency?.symbol}
                                                        {' '}
                                                        (
                                                        {status.currency?.code}
                                                        )
                                                    </span>
                                                    <span>
                                                        Membership:
                                                        {' '}
                                                        {status.currency?.symbol}
                                                        {status.membershipPrice?.price?.toFixed(2)}
                                                    </span>
                                                    <span>
                                                        Announcement:
                                                        {' '}
                                                        {status.currency?.symbol}
                                                        {status.announcementPrice?.price?.toFixed(2)}
                                                    </span>
                                                    <span>
                                                        Tax:
                                                        {' '}
                                                        {status.taxRate}
                                                        %
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Action Button */}
                                        {!isEditing && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => startEditCountry(country.id!)}
                                                className={cn(
                                                    status.isComplete
                                                        ? 'border-green-300 dark:border-green-700 hover:bg-green-50 dark:hover:bg-green-900/20'
                                                        : 'border-orange-300 dark:border-orange-700 hover:bg-orange-50 dark:hover:bg-orange-900/20',
                                                )}
                                            >
                                                {status.isComplete ? 'Edit' : 'Configure'}
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                {/* Edit Form */}
                                {isEditing && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="mt-4 grid grid-cols-5 gap-3"
                                    >
                                        <div>
                                            <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">Currency</label>
                                            <Select
                                                value={countryForms[country.id]?.currencyId || ''}
                                                onValueChange={value => updateCountryForm(country.id!, 'currencyId', value)}
                                            >
                                                <SelectTrigger className="h-9">
                                                    <SelectValue placeholder="Select" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {currencies.map(currency => currency && (
                                                        <SelectItem key={currency.id} value={currency.id!}>
                                                            {currency.symbol}
                                                            {' '}
                                                            {currency.code}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">Membership Price</label>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                value={countryForms[country.id]?.membershipPrice || ''}
                                                onChange={e => updateCountryForm(country.id!, 'membershipPrice', e.target.value)}
                                                className="h-9"
                                                placeholder="0.00"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">Announcement Price</label>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                value={countryForms[country.id]?.announcementPrice || ''}
                                                onChange={e => updateCountryForm(country.id!, 'announcementPrice', e.target.value)}
                                                className="h-9"
                                                placeholder="0.00"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">Tax Rate (%)</label>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                value={countryForms[country.id]?.taxRate || ''}
                                                onChange={e => updateCountryForm(country.id!, 'taxRate', e.target.value)}
                                                className="h-9"
                                                placeholder="0.00"
                                            />
                                        </div>
                                        <div className="flex items-end gap-2">
                                            <Button
                                                size="sm"
                                                onClick={() => saveCountryPrice(country.id!)}
                                                disabled={saving}
                                                className="h-9 bg-green-600 hover:bg-green-700"
                                            >
                                                <Save size={14} className="mr-1" />
                                                Save
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => setEditingCountry(null)}
                                                disabled={saving}
                                                className="h-9"
                                            >
                                                Cancel
                                            </Button>
                                        </div>
                                    </motion.div>
                                )}
                            </div>

                            {/* States List (if expanded) */}
                            {isExpanded && hasStates && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50"
                                >
                                    <div className="p-4 space-y-2">
                                        <div className="text-xs text-gray-600 dark:text-gray-400 mb-3 flex items-center gap-2">
                                            <MapPin size={12} />
                                            States/Provinces - Configure specific pricing or inherit from country level
                                        </div>
                                        {countryStates.map((state) => {
                                            if (!state?.id)
                                                return null;

                                            const stateStatus = getStatePricingStatus(state.id, country.id!);
                                            const isEditingState = editingState === state.id;

                                            return (
                                                <div
                                                    key={state.id}
                                                    className={cn(
                                                        'bg-white dark:bg-gray-800 rounded-lg p-3 border',
                                                        stateStatus.isInherited
                                                            ? 'border-gray-200 dark:border-gray-700'
                                                            : 'border-blue-300 dark:border-blue-700',
                                                    )}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                                    {state.name}
                                                                </span>
                                                                {stateStatus.isInherited && (
                                                                    <Badge variant="outline" className="text-xs">
                                                                        Inherited from country
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                            {!isEditingState && (
                                                                <div className="flex gap-3 mt-1 text-xs text-gray-600 dark:text-gray-400">
                                                                    <span>
                                                                        Membership:
                                                                        {' '}
                                                                        {status.currency?.symbol}
                                                                        {stateStatus.membershipPrice?.price?.toFixed(2)}
                                                                    </span>
                                                                    <span>
                                                                        Announcement:
                                                                        {' '}
                                                                        {status.currency?.symbol}
                                                                        {stateStatus.announcementPrice?.price?.toFixed(2)}
                                                                    </span>
                                                                    <span>
                                                                        Tax:
                                                                        {' '}
                                                                        {stateStatus.taxRate}
                                                                        %
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                        {!isEditingState && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => startEditState(state.id!, country.id!)}
                                                                className="h-8 text-xs"
                                                            >
                                                                {stateStatus.isInherited ? 'Set Custom' : 'Edit'}
                                                            </Button>
                                                        )}
                                                    </div>

                                                    {/* State Edit Form */}
                                                    {isEditingState && (
                                                        <motion.div
                                                            initial={{ opacity: 0, height: 0 }}
                                                            animate={{ opacity: 1, height: 'auto' }}
                                                            className="mt-3 grid grid-cols-4 gap-2"
                                                        >
                                                            <div>
                                                                <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">Membership</label>
                                                                <Input
                                                                    type="number"
                                                                    step="0.01"
                                                                    value={stateForms[state.id]?.membershipPrice || ''}
                                                                    onChange={e => updateStateForm(state.id!, 'membershipPrice', e.target.value)}
                                                                    className="h-8 text-sm"
                                                                    placeholder="0.00"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">Announcement</label>
                                                                <Input
                                                                    type="number"
                                                                    step="0.01"
                                                                    value={stateForms[state.id]?.announcementPrice || ''}
                                                                    onChange={e => updateStateForm(state.id!, 'announcementPrice', e.target.value)}
                                                                    className="h-8 text-sm"
                                                                    placeholder="0.00"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">Tax (%)</label>
                                                                <Input
                                                                    type="number"
                                                                    step="0.01"
                                                                    value={stateForms[state.id]?.taxRate || ''}
                                                                    onChange={e => updateStateForm(state.id!, 'taxRate', e.target.value)}
                                                                    className="h-8 text-sm"
                                                                    placeholder="0.00"
                                                                />
                                                            </div>
                                                            <div className="flex items-end gap-1">
                                                                <Button
                                                                    size="sm"
                                                                    onClick={() => saveStatePrice(state.id!, country.id!)}
                                                                    disabled={saving}
                                                                    className="h-8 text-xs bg-blue-600 hover:bg-blue-700"
                                                                >
                                                                    <Save size={12} className="mr-1" />
                                                                    Save
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() => setEditingState(null)}
                                                                    disabled={saving}
                                                                    className="h-8 text-xs"
                                                                >
                                                                    Cancel
                                                                </Button>
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </motion.div>
                            )}
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
