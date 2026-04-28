import { DollarSign, Loader2, Save, X } from 'lucide-react';
import { motion } from 'motion/react';
import { useCallback, useImperativeHandle, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';

import type { Input_CreatePricing, Input_UpdatePricing, T_Country, T_Currency, T_Pricing } from '#shared/graphql';

import { useGetCurrencies } from '#modules/currency';
import { useGetCountries } from '#modules/location/country/country.hook';
import { useGetStates } from '#modules/location/state';
import { Button, Drawer, DrawerContent, DrawerHeader, DrawerTitle, FloatLabel, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Switch } from '#shared/component';
import { E_PricingType } from '#shared/graphql';
import { useKeyboardShortcuts } from '#shared/hooks';
import { useTranslate } from '#shared/i18n';
import { E_FormMode } from '#shared/typescript';

import type { I_PriceFormData, I_PriceFormProps, I_PriceFormRef } from './pricing.type';

const FORM_DEFAULT_VALUES = {
    type: E_PricingType.MEMBERSHIP,
    countryId: '',
    stateId: 'none',
    currencyId: '',
    membershipPrice: '',
    announcementPrice: '',
    taxRate: '',
    isActive: true,
};

export function PriceForm({ ref, onCreateSubmit, onUpdateSubmit, creating, updating, existingPrices }: Omit<I_PriceFormProps, 'price' | 'mode' | 'onSubmit'> & {
    onCreateSubmit: (data: Input_CreatePricing) => void;
    onUpdateSubmit: (id: string, data: Input_UpdatePricing) => void;
    creating?: boolean;
    updating?: boolean;
    existingPrices?: T_Pricing[];
} & { ref?: React.RefObject<I_PriceFormRef | null> }) {
    const { t } = useTranslate('pricing');
    const [isOpen, setIsOpen] = useState(false);
    const [mode, setMode] = useState<E_FormMode>(E_FormMode.Create);
    const [currentPrice, setCurrentPrice] = useState<T_Pricing>();
    const [countrySearch, setCountrySearch] = useState('');
    const [stateSearch, setStateSearch] = useState('');

    const { countries } = useGetCountries(
        countrySearch.trim() ? { name: countrySearch } : {},
        { pagination: false },
    );

    const { currencies } = useGetCurrencies(
        { isDel: false },
        { pagination: false },
    );

    const {
        register,
        handleSubmit,
        reset,
        watch,
        setValue,
        trigger,
        formState: { errors },
    } = useForm<I_PriceFormData>({
        defaultValues: FORM_DEFAULT_VALUES,
    });

    const selectedCountryId = watch('countryId');
    const selectedStateId = watch('stateId');
    const selectedCurrencyId = watch('currencyId');
    const membershipPrice = watch('membershipPrice');
    const announcementPrice = watch('announcementPrice');

    const { states } = useGetStates(
        selectedCountryId && stateSearch.trim()
            ? { countryId: selectedCountryId, name: stateSearch }
            : selectedCountryId
                ? { countryId: selectedCountryId }
                : {},
        { pagination: false },
    );
    const taxRate = watch('taxRate');
    const isActive = watch('isActive');

    const availableCountries = useMemo(() => {
        if (mode === E_FormMode.Update) {
            return countries.filter((c): c is T_Country => Boolean(c));
        }

        const countriesWithPricing = new Map<string, Set<E_PricingType>>();

        existingPrices?.forEach((price) => {
            if (price?.countryId && price?.type) {
                if (!countriesWithPricing.has(price.countryId)) {
                    countriesWithPricing.set(price.countryId, new Set());
                }
                countriesWithPricing.get(price.countryId)?.add(price.type as E_PricingType);
            }
        });

        return countries.filter((c): c is T_Country => {
            if (!c?.id)
                return false;

            const pricingTypes = countriesWithPricing.get(c.id);
            if (!pricingTypes)
                return true;

            return pricingTypes.size < 2;
        });
    }, [countries, existingPrices, mode]);

    const selectedCountry = useMemo(() => {
        return countries.filter((c): c is T_Country => Boolean(c)).find(c => c.id === selectedCountryId);
    }, [countries, selectedCountryId]);

    const selectedCurrency = useMemo(() => {
        return currencies.filter((c): c is T_Currency => Boolean(c)).find(c => c.id === selectedCurrencyId);
    }, [currencies, selectedCurrencyId]);

    const calculatedTotal = useMemo(() => {
        const membershipPriceValue = Number.parseFloat(membershipPrice) || 0;
        const announcementPriceValue = Number.parseFloat(announcementPrice) || 0;
        const taxRateValue = Number.parseFloat(taxRate) || 0;

        const membershipTotal = membershipPriceValue + (membershipPriceValue * taxRateValue) / 100;
        const announcementTotal = announcementPriceValue + (announcementPriceValue * taxRateValue) / 100;

        return {
            membership: membershipTotal,
            announcement: announcementTotal,
        };
    }, [membershipPrice, announcementPrice, taxRate]);

    const currencySymbol = selectedCurrency?.symbol || '€';

    useImperativeHandle(ref, () => ({
        open: (price?: T_Pricing) => {
            setCurrentPrice(price);
            setMode(price ? E_FormMode.Update : E_FormMode.Create);

            if (price) {
                reset({
                    type: price.type || E_PricingType.MEMBERSHIP,
                    countryId: price.countryId || '',
                    stateId: price.stateId || 'none',
                    currencyId: price.currencyId || '',
                    membershipPrice: price.type === E_PricingType.MEMBERSHIP ? price.price?.toString() || '' : '',
                    announcementPrice: price.type === E_PricingType.ANNOUNCEMENT ? price.price?.toString() || '' : '',
                    taxRate: price.taxRate?.toString() || '',
                    isActive: price.isActive ?? true,
                });
            }
            else {
                reset(FORM_DEFAULT_VALUES);
            }

            setIsOpen(true);
        },
        close: () => {
            setIsOpen(false);
            setCurrentPrice(undefined);
            reset(FORM_DEFAULT_VALUES);
        },
    }), [reset]);

    useKeyboardShortcuts({
        isActive: isOpen,
        onEscape: () => setIsOpen(false),
    });

    const _handleSubmit = useCallback((data: I_PriceFormData) => {
        if (mode === E_FormMode.Create) {
            // Create TWO pricing records: one for membership, one for announcement
            const baseData = {
                countryId: data.countryId,
                stateId: data.stateId && data.stateId !== 'none' ? data.stateId : undefined,
                currencyId: data.currencyId,
                taxRate: Number.parseFloat(data.taxRate),
                isActive: data.isActive,
            };

            const membershipData = {
                ...baseData,
                type: E_PricingType.MEMBERSHIP,
                price: Number.parseFloat(data.membershipPrice),
            };

            const announcementData = {
                ...baseData,
                type: E_PricingType.ANNOUNCEMENT,
                price: Number.parseFloat(data.announcementPrice),
            };

            onCreateSubmit(membershipData);
            onCreateSubmit(announcementData);
        }
        else if (currentPrice?.id) {
            const submitData = {
                type: currentPrice.type as E_PricingType,
                countryId: data.countryId,
                stateId: data.stateId && data.stateId !== 'none' ? data.stateId : undefined,
                currencyId: data.currencyId,
                price: currentPrice.type === E_PricingType.MEMBERSHIP
                    ? Number.parseFloat(data.membershipPrice)
                    : Number.parseFloat(data.announcementPrice),
                taxRate: Number.parseFloat(data.taxRate),
                isActive: data.isActive,
            };
            onUpdateSubmit(currentPrice.id, submitData);
        }

        setIsOpen(false);
        setCurrentPrice(undefined);
        reset(FORM_DEFAULT_VALUES);
    }, [mode, currentPrice, onCreateSubmit, onUpdateSubmit, reset]);

    const _handleCancel = useCallback(() => {
        setIsOpen(false);
        setCurrentPrice(undefined);
        reset(FORM_DEFAULT_VALUES);
    }, [reset]);

    return (
        <Drawer direction="right" open={isOpen} onOpenChange={setIsOpen}>
            <DrawerContent className="max-w-md">
                <DrawerHeader className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/50 dark:to-blue-950/50 border-b border-purple-100 dark:border-purple-800">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg">
                                <DollarSign className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <DrawerTitle className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                                    {mode === E_FormMode.Update ? t('update-price') : t('add-new-price')}
                                </DrawerTitle>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                    {mode === E_FormMode.Update ? t('update-price-description') : t('add-new-price-description')}
                                </p>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={_handleCancel}
                            className="h-8 w-8 p-0 hover:bg-white/50 dark:hover:bg-gray-800/50"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </DrawerHeader>

                <form onSubmit={handleSubmit(_handleSubmit)} className="p-6 flex flex-col gap-6">
                    {/* Price Preview */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-700 dark:to-gray-600 p-6 rounded-xl border border-gray-200 dark:border-gray-600"
                    >
                        <div className="text-center">
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
                                {t('price-preview')}
                            </h3>
                            <div className="text-center space-y-3">
                                <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                    {selectedCountry?.name || t('select-country')}
                                </div>

                                {/* Membership Total */}
                                <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-lg">
                                    <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">{t('membership')}</div>
                                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                        {currencySymbol}
                                        {calculatedTotal.membership.toFixed(2)}
                                    </div>
                                </div>

                                {/* Announcement Total */}
                                <div className="bg-purple-50 dark:bg-purple-900/30 p-3 rounded-lg">
                                    <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">{t('announcement')}</div>
                                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                                        {currencySymbol}
                                        {calculatedTotal.announcement.toFixed(2)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Country Field */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <FloatLabel
                            label={t('country')}
                            error={errors.countryId?.message}
                        >
                            <Select
                                {...register('countryId')}
                                value={selectedCountryId}
                                onValueChange={(value) => {
                                    setValue('countryId', value);
                                    setValue('stateId', 'none'); // Reset state when country changes
                                    trigger('countryId');
                                    setStateSearch(''); // Clear state search
                                }}
                            >
                                <SelectTrigger
                                    className={`h-12 text-lg ${errors.countryId ? 'border-red-500 focus:border-red-500 focus:ring-red-500 dark:border-red-400 dark:focus:border-red-400 dark:focus:ring-red-400' : 'border-gray-300 dark:border-gray-600 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-purple-500 dark:focus:ring-purple-400'} bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100`}
                                    aria-invalid={!!errors.countryId}
                                >
                                    <SelectValue placeholder=" " />
                                </SelectTrigger>
                                <SelectContent className="max-h-96 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                                    {/* Search Input */}
                                    <div className="p-2 border-b border-gray-200 dark:border-gray-700">
                                        <Input
                                            placeholder="Search countries..."
                                            value={countrySearch}
                                            onChange={e => setCountrySearch(e.target.value)}
                                            className="h-8 text-sm"
                                        />
                                    </div>

                                    {/* Countries List */}
                                    <div className="max-h-80 overflow-y-auto">
                                        {availableCountries.length === 0
                                            ? (
                                                    <div className="p-3 text-sm text-gray-500 dark:text-gray-400 text-center">
                                                        No countries available (all have pricing set)
                                                    </div>
                                                )
                                            : (
                                                    availableCountries.map(country => (
                                                        country
                                                            ? (
                                                                    <SelectItem
                                                                        key={country.id}
                                                                        value={country.id ?? ''}
                                                                        className="py-2 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700"
                                                                    >
                                                                        {country.name}
                                                                    </SelectItem>
                                                                )
                                                            : null
                                                    ))
                                                )}
                                    </div>
                                </SelectContent>
                            </Select>
                        </FloatLabel>
                    </motion.div>

                    {/* State Field */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        <FloatLabel
                            label="State (Optional)"
                            error={errors.stateId?.message}
                        >
                            <Select
                                {...register('stateId')}
                                value={selectedStateId || 'none'}
                                onValueChange={(value) => {
                                    setValue('stateId', value || 'none');
                                    trigger('stateId');
                                }}
                                disabled={!selectedCountryId}
                            >
                                <SelectTrigger
                                    className={`h-12 text-lg ${errors.stateId ? 'border-red-500 focus:border-red-500 focus:ring-red-500 dark:border-red-400 dark:focus:border-red-400 dark:focus:ring-red-400' : 'border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400'} bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 ${!selectedCountryId ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    aria-invalid={!!errors.stateId}
                                >
                                    <SelectValue placeholder={selectedCountryId ? ' ' : 'Select country first'} />
                                </SelectTrigger>
                                <SelectContent className="max-h-96 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                                    {selectedCountryId
                                        ? (
                                                <>
                                                    {/* Search Input */}
                                                    <div className="p-2 border-b border-gray-200 dark:border-gray-700">
                                                        <Input
                                                            placeholder="Search states..."
                                                            value={stateSearch}
                                                            onChange={e => setStateSearch(e.target.value)}
                                                            className="h-8 text-sm"
                                                        />
                                                    </div>

                                                    {/* Optional/None Selection */}
                                                    <SelectItem
                                                        value="none"
                                                        className="py-2 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 italic"
                                                    >
                                                        No state selected
                                                    </SelectItem>

                                                    {/* States List */}
                                                    <div className="max-h-80 overflow-y-auto">
                                                        {states.length === 0
                                                            ? (
                                                                    <div className="p-3 text-sm text-gray-500 dark:text-gray-400 text-center">
                                                                        No states found
                                                                    </div>
                                                                )
                                                            : (
                                                                    states.map(state => (
                                                                        state
                                                                            ? (
                                                                                    <SelectItem
                                                                                        key={state.id}
                                                                                        value={state.id ?? ''}
                                                                                        className="py-2 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700"
                                                                                    >
                                                                                        {state.name}
                                                                                    </SelectItem>
                                                                                )
                                                                            : null
                                                                    ))
                                                                )}
                                                    </div>
                                                </>
                                            )
                                        : (
                                                <div className="p-3 text-sm text-gray-500 dark:text-gray-400 text-center">
                                                    Select a country first
                                                </div>
                                            )}
                                </SelectContent>
                            </Select>
                        </FloatLabel>
                    </motion.div>

                    {/* Currency Field */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.35 }}
                    >
                        <FloatLabel
                            label={t('currency')}
                            error={errors.currencyId?.message}
                        >
                            <Select
                                {...register('currencyId')}
                                value={selectedCurrencyId}
                                onValueChange={(value) => {
                                    setValue('currencyId', value);
                                    trigger('currencyId');
                                }}
                            >
                                <SelectTrigger
                                    className={`h-12 text-lg ${errors.currencyId ? 'border-red-500 focus:border-red-500 focus:ring-red-500 dark:border-red-400 dark:focus:border-red-400 dark:focus:ring-red-400' : 'border-gray-300 dark:border-gray-600 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-purple-500 dark:focus:ring-purple-400'} bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100`}
                                    aria-invalid={!!errors.currencyId}
                                >
                                    <SelectValue placeholder=" " />
                                </SelectTrigger>
                                <SelectContent className="max-h-96 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                                    {currencies.length === 0
                                        ? (
                                                <div className="p-3 text-sm text-gray-500 dark:text-gray-400 text-center">
                                                    No currencies found
                                                </div>
                                            )
                                        : (
                                                currencies.map(currency => (
                                                    currency
                                                        ? (
                                                                <SelectItem
                                                                    key={currency.id}
                                                                    value={currency.id ?? ''}
                                                                    className="py-2 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700"
                                                                >
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="font-medium">{currency.symbol}</span>
                                                                        <span>{currency.code}</span>
                                                                        <span className="text-gray-500">
                                                                            -
                                                                            {currency.name}
                                                                        </span>
                                                                    </div>
                                                                </SelectItem>
                                                            )
                                                        : null
                                                ))
                                            )}
                                </SelectContent>
                            </Select>
                        </FloatLabel>
                    </motion.div>

                    {/* Membership Price Field */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 }}
                    >
                        <FloatLabel
                            label={t('membership-price')}
                            error={errors.membershipPrice?.message}
                        >
                            <Input
                                {...register('membershipPrice', {
                                    required: t('price-required'),
                                    min: {
                                        value: 0,
                                        message: t('price-min-value'),
                                    },
                                })}
                                type="number"
                                step="0.01"
                                className={`h-12 text-lg ${errors.membershipPrice ? 'border-red-500 focus:border-red-500 focus:ring-red-500 dark:border-red-400 dark:focus:border-red-400 dark:focus:ring-red-400' : 'border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400'} bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100`}
                                aria-invalid={!!errors.membershipPrice}
                                aria-required="true"
                                placeholder="0.00"
                            />
                        </FloatLabel>
                    </motion.div>

                    {/* Announcement Price Field */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.45 }}
                    >
                        <FloatLabel
                            label={t('announcement-price')}
                            error={errors.announcementPrice?.message}
                        >
                            <Input
                                {...register('announcementPrice', {
                                    required: t('price-required'),
                                    min: {
                                        value: 0,
                                        message: t('price-min-value'),
                                    },
                                })}
                                type="number"
                                step="0.01"
                                className={`h-12 text-lg ${errors.announcementPrice ? 'border-red-500 focus:border-red-500 focus:ring-red-500 dark:border-red-400 dark:focus:border-red-400 dark:focus:ring-red-400' : 'border-gray-300 dark:border-gray-600 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-purple-500 dark:focus:ring-purple-400'} bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100`}
                                aria-invalid={!!errors.announcementPrice}
                                aria-required="true"
                                placeholder="0.00"
                            />
                        </FloatLabel>
                    </motion.div>

                    {/* Tax Rate Field */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 }}
                    >
                        <FloatLabel
                            label={t('tax-rate')}
                            error={errors.taxRate?.message}
                        >
                            <Input
                                {...register('taxRate', {
                                    required: t('tax-rate-required'),
                                    min: {
                                        value: 0,
                                        message: t('tax-rate-min-value'),
                                    },
                                    max: {
                                        value: 100,
                                        message: t('tax-rate-max-value'),
                                    },
                                })}
                                type="number"
                                step="0.01"
                                className={`h-12 text-lg ${errors.taxRate ? 'border-red-500 focus:border-red-500 focus:ring-red-500 dark:border-red-400 dark:focus:border-red-400 dark:focus:ring-red-400' : 'border-gray-300 dark:border-gray-600 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-purple-500 dark:focus:ring-purple-400'} bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100`}
                                aria-invalid={!!errors.taxRate}
                                aria-required="true"
                                placeholder="0.00"
                            />
                        </FloatLabel>
                    </motion.div>

                    {/* Status Field */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.6 }}
                        className="flex items-center justify-between"
                    >
                        <div className="space-y-0.5">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {t('status')}
                            </label>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                {isActive ? t('active') : t('inactive')}
                            </p>
                        </div>
                        <Switch
                            checked={isActive}
                            onCheckedChange={checked => setValue('isActive', checked)}
                        />
                    </motion.div>

                    {/* Action Buttons */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7 }}
                        className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700"
                    >
                        <Button
                            type="button"
                            variant="outline"
                            onClick={_handleCancel}
                            disabled={creating || updating}
                            className="h-11 px-6 border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
                        >
                            {t('cancel')}
                        </Button>
                        <Button
                            type="submit"
                            disabled={creating || updating}
                            className="h-11 px-6 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                        >
                            {creating || updating
                                ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            {t('saving')}
                                        </>
                                    )
                                : (
                                        <>
                                            <Save className="h-4 w-4 mr-2" />
                                            {t('save')}
                                        </>
                                    )}
                        </Button>
                    </motion.div>
                </form>
            </DrawerContent>
        </Drawer>
    );
}
