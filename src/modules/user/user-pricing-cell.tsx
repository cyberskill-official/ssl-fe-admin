import { useQuery } from '@cyberskill/shared/react/apollo-client';
import { useEffect } from 'react';

import type { getPricingQuery, getPricingQueryVariables, Maybe } from '#shared/graphql';

import { useGetPriceByIP } from '#modules/pricing';
import { E_PricingType, getPricingDocument } from '#shared/graphql';

interface UserPricingCellProps {
    userIp?: string;
    countryId?: Maybe<string>;
    type: 'price' | 'tax';
}

const cache = new Map<string, { price: string; tax: string }>();

export function UserPricingCell({ userIp, countryId, type }: UserPricingCellProps) {
    const useCountryPricing = !!countryId;

    const { data: countryData, loading: countryLoading } = useQuery<
        getPricingQuery,
        getPricingQueryVariables
    >(getPricingDocument, {
        variables: {
            filter: {
                isDel: false,
                countryId,
                type: E_PricingType.MEMBERSHIP,
            },
            populate: 'currency',
        },
        skip: !countryId,
        fetchPolicy: 'cache-first',
    });

    const ipPricing = useGetPriceByIP(userIp, E_PricingType.MEMBERSHIP);

    const pricing = useCountryPricing
        ? countryData?.getPricing?.result
        : ipPricing.pricing;
    const taxRate = useCountryPricing
        ? (countryData?.getPricing?.result?.taxRate ?? 0)
        : ipPricing.taxRate;
    const loading = useCountryPricing ? countryLoading : ipPricing.loading;

    const cacheKey = countryId || userIp || 'no-key';
    const cached = cache.get(cacheKey);

    // Update cache when we have fresh data
    useEffect(() => {
        if (pricing && (countryId || userIp)) {
            const currencySymbol = pricing.currency?.symbol || pricing.currency?.code || '$';
            const priceStr = pricing.price != null ? `${currencySymbol}${Number(pricing.price).toFixed(2)}` : 'N/A';
            const rawTaxRate = taxRate ?? 0;
            const normalizedTaxRate = rawTaxRate >= 1 ? rawTaxRate / 100 : rawTaxRate;
            const taxPercentage = (normalizedTaxRate * 100).toFixed(2);
            const taxStr = `${taxPercentage}%`;

            cache.set(cacheKey, { price: priceStr, tax: taxStr });
        }
    }, [pricing, taxRate, countryId, userIp, cacheKey]);

    if (!countryId && !userIp) {
        return <span className="text-sm text-muted-foreground">N/A</span>;
    }

    // If we have cache, show it immediately even while loading
    if (cached) {
        const value = type === 'price' ? cached.price : cached.tax;
        return (
            <span className={type === 'price' ? 'text-sm font-medium' : 'text-sm'}>
                {value}
            </span>
        );
    }

    if (loading) {
        return (
            <span className="text-sm text-muted-foreground">...</span>
        );
    }

    if (!pricing) {
        return <span className="text-sm text-muted-foreground">N/A</span>;
    }

    if (type === 'price') {
        const currencySymbol
            = pricing.currency?.symbol || pricing.currency?.code || '$';
        return (
            <span className="text-sm font-medium">
                {currencySymbol}
                {Number(pricing.price).toFixed(2)}
            </span>
        );
    }

    const rawTaxRate = taxRate ?? 0;
    const normalizedTaxRate = rawTaxRate >= 1 ? rawTaxRate / 100 : rawTaxRate;
    const taxPercentage = (normalizedTaxRate * 100).toFixed(2);
    return (
        <span className="text-sm">
            {taxPercentage}
            %
        </span>
    );
}
