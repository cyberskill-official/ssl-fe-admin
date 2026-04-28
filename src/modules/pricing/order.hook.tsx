import { useQuery } from '@cyberskill/shared/react/apollo-client';
import { useMemo } from 'react';

import { getOrdersDocument } from '#shared/graphql';

import type { I_Order } from './order.type';

import { E_OrderStatus } from './order.type';

export function useGetOrders(
    filter?: Record<string, unknown>,
    options?: Record<string, unknown>,
) {
    const { data, loading, refetch } = useQuery(getOrdersDocument, {
        variables: { filter, options },
        fetchPolicy: 'network-only',
    });

    const orders = useMemo(() => {
        return (data?.getOrders?.result?.docs || []) as I_Order[];
    }, [data]);

    const totalDocs = data?.getOrders?.result?.totalDocs || 0;
    const paginationInfo = {
        limit: data?.getOrders?.result?.limit || 0,
        hasPrevPage: data?.getOrders?.result?.hasPrevPage || false,
        hasNextPage: data?.getOrders?.result?.hasNextPage || false,
        page: data?.getOrders?.result?.page || 1,
        totalPages: data?.getOrders?.result?.totalPages || 0,
        offset: data?.getOrders?.result?.offset || 0,
        prevPage: data?.getOrders?.result?.prevPage || null,
        nextPage: data?.getOrders?.result?.nextPage || null,
        pagingCounter: data?.getOrders?.result?.pagingCounter || 0,
    };

    return { orders, totalDocs, paginationInfo, loading, refetch };
}

export function useGetPaidOrders(options?: Record<string, unknown>) {
    return useGetOrders(
        { status: E_OrderStatus.PAID, isDel: false },
        options,
    );
}
