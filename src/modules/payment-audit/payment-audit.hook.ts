import { useQuery } from '@cyberskill/shared/react/apollo-client';
import { useMemo } from 'react';

import type {
    getPaymentAuditEntitlementChangesQuery,
    getPaymentAuditGatewayEventsQuery,
    getPaymentAuditOrdersQuery,
    getPaymentAuditPaymentRequestsQuery,
    getPaymentAuditSubscriptionsQuery,
    getPaymentAuditTransactionsQuery,
} from '#shared/graphql';

import {
    getPaymentAuditEntitlementChangesDocument,
    getPaymentAuditGatewayEventsDocument,
    getPaymentAuditOrdersDocument,
    getPaymentAuditPaymentRequestsDocument,
    getPaymentAuditSubscriptionsDocument,
    getPaymentAuditTransactionsDocument,
} from '#shared/graphql';

type T_PaginationSource = {
    totalDocs?: number | null;
    limit?: number | null;
    hasPrevPage?: boolean | null;
    hasNextPage?: boolean | null;
    page?: number | null;
    totalPages?: number | null;
    offset?: number | null;
    prevPage?: number | null;
    nextPage?: number | null;
    pagingCounter?: number | null;
} | null | undefined;

export type T_PaymentAuditOrder = NonNullable<NonNullable<NonNullable<getPaymentAuditOrdersQuery['getOrders']['result']>['docs']>[number]>;
export type T_PaymentAuditSubscription = NonNullable<NonNullable<NonNullable<getPaymentAuditSubscriptionsQuery['getPaymentSubscriptions']['result']>['docs']>[number]>;
export type T_PaymentAuditEntitlementChange = NonNullable<NonNullable<NonNullable<getPaymentAuditEntitlementChangesQuery['getMembershipEntitlementChanges']['result']>['docs']>[number]>;
export type T_PaymentAuditPaymentRequest = NonNullable<NonNullable<NonNullable<getPaymentAuditPaymentRequestsQuery['getPaymentRequests']['result']>['docs']>[number]>;
export type T_PaymentAuditTransaction = NonNullable<NonNullable<NonNullable<getPaymentAuditTransactionsQuery['getPaymentTransactions']['result']>['docs']>[number]>;
export type T_PaymentAuditGatewayEvent = NonNullable<NonNullable<NonNullable<getPaymentAuditGatewayEventsQuery['getPaymentGatewayEvents']['result']>['docs']>[number]>;

function getPagination(result: T_PaginationSource) {
    return {
        totalDocs: result?.totalDocs || 0,
        limit: result?.limit || 0,
        hasPrevPage: result?.hasPrevPage || false,
        hasNextPage: result?.hasNextPage || false,
        page: result?.page || 1,
        totalPages: result?.totalPages || 0,
        offset: result?.offset || 0,
        prevPage: result?.prevPage || null,
        nextPage: result?.nextPage || null,
        pagingCounter: result?.pagingCounter || 0,
    };
}

function compactDocs<T>(docs?: Array<T | null> | null) {
    return (docs || []).filter(Boolean) as T[];
}

export function usePaymentAuditOrders(
    filter?: Record<string, unknown>,
    options?: Record<string, unknown>,
    enabled = true,
) {
    const { data, loading, refetch, error } = useQuery(getPaymentAuditOrdersDocument, {
        variables: { filter, options },
        fetchPolicy: 'network-only',
        skip: !enabled,
    });

    const result = data?.getOrders?.result;
    const orders = useMemo(() => compactDocs<T_PaymentAuditOrder>(result?.docs), [result?.docs]);

    return {
        orders,
        pagination: getPagination(result),
        loading,
        refetch,
        error,
    };
}

export function usePaymentAuditSubscriptions(
    filter?: Record<string, unknown>,
    options?: Record<string, unknown>,
    enabled = true,
) {
    const { data, loading, refetch, error } = useQuery(getPaymentAuditSubscriptionsDocument, {
        variables: { filter, options },
        fetchPolicy: 'network-only',
        skip: !enabled,
    });

    const result = data?.getPaymentSubscriptions?.result;
    const subscriptions = useMemo(() => compactDocs<T_PaymentAuditSubscription>(result?.docs), [result?.docs]);

    return {
        subscriptions,
        pagination: getPagination(result),
        loading,
        refetch,
        error,
    };
}

export function usePaymentAuditEntitlementChanges(
    filter?: Record<string, unknown>,
    options?: Record<string, unknown>,
    enabled = true,
) {
    const { data, loading, refetch, error } = useQuery(getPaymentAuditEntitlementChangesDocument, {
        variables: { filter, options },
        fetchPolicy: 'network-only',
        skip: !enabled,
    });

    const result = data?.getMembershipEntitlementChanges?.result;
    const entitlementChanges = useMemo(() => compactDocs<T_PaymentAuditEntitlementChange>(result?.docs), [result?.docs]);

    return {
        entitlementChanges,
        pagination: getPagination(result),
        loading,
        refetch,
        error,
    };
}

export function usePaymentAuditPaymentRequests(
    filter?: Record<string, unknown>,
    options?: Record<string, unknown>,
    enabled = true,
) {
    const { data, loading, refetch, error } = useQuery(getPaymentAuditPaymentRequestsDocument, {
        variables: { filter, options },
        fetchPolicy: 'network-only',
        skip: !enabled,
    });

    const result = data?.getPaymentRequests?.result;
    const paymentRequests = useMemo(() => compactDocs<T_PaymentAuditPaymentRequest>(result?.docs), [result?.docs]);

    return {
        paymentRequests,
        pagination: getPagination(result),
        loading,
        refetch,
        error,
    };
}

export function usePaymentAuditTransactions(
    filter?: Record<string, unknown>,
    options?: Record<string, unknown>,
    enabled = true,
) {
    const { data, loading, refetch, error } = useQuery(getPaymentAuditTransactionsDocument, {
        variables: { filter, options },
        fetchPolicy: 'network-only',
        skip: !enabled,
    });

    const result = data?.getPaymentTransactions?.result;
    const transactions = useMemo(() => compactDocs<T_PaymentAuditTransaction>(result?.docs), [result?.docs]);

    return {
        transactions,
        pagination: getPagination(result),
        loading,
        refetch,
        error,
    };
}

export function usePaymentAuditGatewayEvents(
    filter?: Record<string, unknown>,
    options?: Record<string, unknown>,
    enabled = true,
) {
    const { data, loading, refetch, error } = useQuery(getPaymentAuditGatewayEventsDocument, {
        variables: { filter, options },
        fetchPolicy: 'network-only',
        skip: !enabled,
    });

    const result = data?.getPaymentGatewayEvents?.result;
    const gatewayEvents = useMemo(() => compactDocs<T_PaymentAuditGatewayEvent>(result?.docs), [result?.docs]);

    return {
        gatewayEvents,
        pagination: getPagination(result),
        loading,
        refetch,
        error,
    };
}
