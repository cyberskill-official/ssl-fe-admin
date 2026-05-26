import { useMutation, useQuery } from '@cyberskill/shared/react/apollo-client';
import { toast } from '@cyberskill/shared/react/toast';
import { useCallback, useEffect, useMemo, useState } from 'react';

import type {
    createPricingMutation,
    createPricingMutationVariables,
    deletePricingMutation,
    deletePricingMutationVariables,
    getPricingQuery,
    getPricingQueryVariables,
    getPricingsQuery,
    getPricingsQueryVariables,
    updatePricingMutation,
    updatePricingMutationVariables,
} from '#shared/graphql';

import { useGetCountries } from '#modules/location/country';
import { useGetStateByCoordinates } from '#modules/location/state';
import {
    createPricingDocument,
    deletePricingDocument,
    E_PricingType,
    getPricingDocument,
    getPricingsDocument,
    updatePricingDocument,
} from '#shared/graphql';
import { useTranslate } from '#shared/i18n';
import { getGeolocationFromIP } from '#shared/util';

export function useGetPrices(
    filter?: getPricingsQueryVariables['filter'],
    options?: getPricingsQueryVariables['options'],
) {
    const serializedFilter = JSON.stringify(filter);
    const serializedOptions = JSON.stringify(options);

    const memoizedFilter = useMemo(() => {
        return serializedFilter ? JSON.parse(serializedFilter) : undefined;
    }, [serializedFilter]);

    const memoizedOptions = useMemo(() => {
        return serializedOptions ? JSON.parse(serializedOptions) : undefined;
    }, [serializedOptions]);

    const { data, loading, refetch } = useQuery<
        getPricingsQuery,
        getPricingsQueryVariables
    >(getPricingsDocument, {
        variables: { filter: memoizedFilter, options: memoizedOptions },
        fetchPolicy: 'network-only',
    });
    const prices = data?.getPricings?.result?.docs || [];
    const totalDocs = data?.getPricings?.result?.totalDocs || 0;
    return { prices, totalDocs, loading, refetch };
}

export function useCreatePrice() {
    const { t } = useTranslate('pricing');
    const [createPrice, { loading }] = useMutation<
        createPricingMutation,
        createPricingMutationVariables
    >(createPricingDocument, {
        onCompleted: (data) => {
            if (data.createPricing.success) {
                toast.success(t('success-save'));
            }
            else {
                toast.error(data.createPricing.message || t('error-save'));
            }
        },
        onError: (error) => {
            toast.error(error.message);
        },
    });
    const execute = useCallback(
        (doc: createPricingMutationVariables['doc']) => {
            return createPrice({ variables: { doc } });
        },
        [createPrice],
    );

    return { createPrice: execute, loading };
}

export function useUpdatePrice() {
    const { t } = useTranslate('pricing');
    const [updatePrice, { loading }] = useMutation<
        updatePricingMutation,
        updatePricingMutationVariables
    >(updatePricingDocument, {
        onCompleted: (data) => {
            if (data.updatePricing.success) {
                toast.success(t('success-save'));
            }
            else {
                toast.error(data.updatePricing.message || t('error-save'));
            }
        },
        onError: (error) => {
            toast.error(error.message);
        },
    });
    const execute = useCallback(
        (id: string, update: updatePricingMutationVariables['update']) => {
            return updatePrice({ variables: { filter: { id }, update } });
        },
        [updatePrice],
    );

    return { updatePrice: execute, loading };
}

export function useTogglePriceStatus() {
    const { t } = useTranslate('pricing');
    const [updatePrice, { loading }] = useMutation<
        updatePricingMutation,
        updatePricingMutationVariables
    >(updatePricingDocument, {
        onCompleted: (data) => {
            if (data.updatePricing.success) {
                toast.success(t('success-toggle'));
            }
            else {
                toast.error(data.updatePricing.message || t('error-toggle'));
            }
        },
        onError: (error) => {
            toast.error(error.message);
        },
    });
    const execute = useCallback(
        (id: string, isActive: boolean) => {
            return updatePrice({
                variables: { filter: { id }, update: { isActive } },
            });
        },
        [updatePrice],
    );

    return { togglePriceStatus: execute, loading };
}

export function useDeletePrice() {
    const { t } = useTranslate('pricing');
    const [deletePrice, { loading }] = useMutation<
        deletePricingMutation,
        deletePricingMutationVariables
    >(deletePricingDocument, {
        onCompleted: (data) => {
            if (data.deletePricing.success) {
                toast.success(t('success-delete'));
            }
            else {
                toast.error(data.deletePricing.message || t('error-delete'));
            }
        },
        onError: (error) => {
            toast.error(error.message);
        },
    });
    const execute = useCallback(
        (id: string) => {
            return deletePrice({ variables: { filter: { id } } });
        },
        [deletePrice],
    );

    return { deletePrice: execute, loading };
}

/**
 * Get pricing by user's IP address
 * Similar to useGetPrice in ssl-fe-user but for admin panel
 */
export function useGetPriceByIP(
    userIp?: string,
    pricingType: E_PricingType = E_PricingType.MEMBERSHIP,
) {
    const [ipData, setIpData] = useState<{
        latitude: number;
        longitude: number;
        countryCode?: string;
    }>({
        latitude: 0,
        longitude: 0,
        countryCode: undefined,
    });

    useEffect(() => {
        if (!userIp) {
            // If no IP provided, do not default to US — avoid returning a
            // country-based pricing which causes flicker when IP is unknown.
            // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect
            setIpData({
                latitude: 0,
                longitude: 0,
                countryCode: undefined,
            });
            return;
        }

        getGeolocationFromIP(userIp)
            .then((coords) => {
                setIpData({
                    latitude: coords.latitude,
                    longitude: coords.longitude,
                    countryCode: coords.countryCode || 'US', // Fallback to US if no country code
                });
            })
            .catch(() => {
                // Default to USA on error
                setIpData({ latitude: 0, longitude: 0, countryCode: 'US' });
            });
    }, [userIp]);

    // Get state by coordinates if we have lat/lng
    const { state } = useGetStateByCoordinates(
        ipData.latitude,
        ipData.longitude,
    );

    // Get country from country code if state is not found
    const shouldQueryCountry = !state?.countryId && !!ipData.countryCode;
    const { countries: countriesByCode, loading: loadingCountry }
        = useGetCountries(
            shouldQueryCountry && ipData.countryCode
                ? { iso2: ipData.countryCode }
                : undefined,
            { limit: 1 },
        );

    // Determine countryId: prefer from state, fallback to country from IP
    const countryId = state?.countryId || countriesByCode?.[0]?.id || undefined;

    // First query: try with stateId
    const { data: dataByState, loading: loadingByState } = useQuery<
        getPricingQuery,
        getPricingQueryVariables
    >(getPricingDocument, {
        variables: {
            filter: {
                isDel: false,
                stateId: state?.id || undefined,
                type: pricingType,
            },
            populate: 'currency',
        },
        skip: !state?.id,
    });

    // Second query: fallback with countryId if stateId query returns no data
    const { data: dataByCountry, loading: loadingByCountry } = useQuery<
        getPricingQuery,
        getPricingQueryVariables
    >(getPricingDocument, {
        variables: {
            filter: {
                isDel: false,
                countryId: countryId || undefined,
                type: pricingType,
            },
            populate: 'currency',
        },
        skip: !countryId,
        fetchPolicy: 'cache-first',
    });

    const pricing
        = dataByState?.getPricing?.result
            || dataByCountry?.getPricing?.result
            || null;
    const loading
        = loadingByState
            || loadingByCountry
            || (shouldQueryCountry && loadingCountry);

    // Normalize tax rate
    const rawTaxRate = pricing?.taxRate ?? 0;
    const normalizedTaxRate = rawTaxRate >= 1 ? rawTaxRate / 100 : rawTaxRate;

    const totalPrice
        = pricing?.price != null
            ? Number((pricing.price * (1 + normalizedTaxRate)).toFixed(2))
            : null;

    const currencySymbol
        = pricing?.currency?.symbol || pricing?.currency?.code || null;

    return {
        pricing,
        pricingId: pricing?.id ?? null,
        totalPrice,
        currencySymbol,
        taxRate: normalizedTaxRate,
        loading,
        ipData,
    };
}
