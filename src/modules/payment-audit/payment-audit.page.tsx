import type { ComponentType } from 'react';

import {
    AlertTriangle,
    CheckCircle2,
    Clock3,
    CreditCard,
    FileClock,
    GitBranch,
    RadioTower,
    ReceiptText,
    RefreshCw,
    Search,
    XCircle,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { useGetRoles } from '#modules/authz/role';
import {
    Badge,
    Button,
    Input,
    Pagination,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '#shared/component';
import {
    E_OrderType,
    E_PaymentGatewayEventProcessingStatus,
    E_PaymentProvider,
    E_PaymentSubscriptionStatus,
} from '#shared/graphql';
import { usePortal } from '#shared/portal';
import { cn } from '#shared/util';

import type {
    T_PaymentAuditEntitlementChange,
    T_PaymentAuditGatewayEvent,
    T_PaymentAuditOrder,
    T_PaymentAuditPaymentRequest,
    T_PaymentAuditSubscription,
    T_PaymentAuditTransaction,
} from './payment-audit.hook';

import {
    usePaymentAuditEntitlementChanges,
    usePaymentAuditGatewayEvents,
    usePaymentAuditOrders,
    usePaymentAuditPaymentRequests,
    usePaymentAuditSubscriptions,
    usePaymentAuditTransactions,
} from './payment-audit.hook';

type T_AuditTab = 'subscriptions' | 'transactions' | 'events' | 'entitlements' | 'requests' | 'orders';

interface I_StatusOption {
    label: string;
    value: string;
}

interface I_PaginationInfo {
    totalDocs: number;
    limit: number;
    hasPrevPage: boolean;
    hasNextPage: boolean;
    page: number;
    totalPages: number;
}

const ALL_STATUS = 'ALL';

const STATUS_OPTIONS: Record<T_AuditTab, I_StatusOption[]> = {
    subscriptions: [
        { label: 'All statuses', value: ALL_STATUS },
        { label: 'Active', value: E_PaymentSubscriptionStatus.ACTIVE },
        { label: 'Scheduled', value: E_PaymentSubscriptionStatus.SCHEDULED },
        { label: 'Pending approval', value: E_PaymentSubscriptionStatus.PENDING_APPROVAL },
        { label: 'Past due', value: E_PaymentSubscriptionStatus.PAST_DUE },
        { label: 'Suspended', value: E_PaymentSubscriptionStatus.SUSPENDED },
        { label: 'Action required', value: E_PaymentSubscriptionStatus.ACTION_REQUIRED },
        { label: 'Cancelled', value: 'CANCELLED' },
    ],
    transactions: [
        { label: 'All statuses', value: ALL_STATUS },
        { label: 'Success', value: 'SUCCESS' },
        { label: 'Pending', value: 'PENDING' },
        { label: 'Failed', value: 'FAILED' },
        { label: 'Canceled', value: 'CANCELED' },
        { label: 'Refunded', value: 'REFUNDED' },
    ],
    events: [
        { label: 'All statuses', value: ALL_STATUS },
        { label: 'Processed', value: E_PaymentGatewayEventProcessingStatus.PROCESSED },
        { label: 'Processing', value: E_PaymentGatewayEventProcessingStatus.PROCESSING },
        { label: 'Received', value: E_PaymentGatewayEventProcessingStatus.RECEIVED },
        { label: 'Failed', value: E_PaymentGatewayEventProcessingStatus.FAILED },
        { label: 'Ignored', value: E_PaymentGatewayEventProcessingStatus.IGNORED },
    ],
    entitlements: [
        { label: 'All statuses', value: ALL_STATUS },
        { label: 'Webhook', value: 'WEBHOOK' },
        { label: 'Status poll', value: 'STATUS_POLL' },
        { label: 'Reconciliation', value: 'RECONCILIATION' },
        { label: 'Cron', value: 'CRON' },
        { label: 'Payment effect', value: 'PAYMENT_EFFECT' },
    ],
    requests: [
        { label: 'All statuses', value: ALL_STATUS },
        { label: 'Paid', value: 'PAID' },
        { label: 'Pending', value: 'PENDING' },
        { label: 'Waiting', value: 'WAITING' },
        { label: 'Failed', value: 'FAILED' },
        { label: 'Cancelled', value: 'CANCELLED' },
        { label: 'Refunded', value: 'REFUNDED' },
        { label: 'Expired', value: 'EXPIRED' },
    ],
    orders: [
        { label: 'All statuses', value: ALL_STATUS },
        { label: 'Paid', value: 'PAID' },
        { label: 'Pending', value: 'PENDING' },
        { label: 'Created', value: 'CREATED' },
        { label: 'Failed', value: 'FAILED' },
        { label: 'Cancelled', value: 'CANCELLED' },
    ],
};

const STATUS_CLASS: Record<string, string> = {
    PAID: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    SUCCESS: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    PROCESSED: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    ACTIVE: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    SCHEDULED: 'border-blue-200 bg-blue-50 text-blue-700',
    PENDING_APPROVAL: 'border-amber-200 bg-amber-50 text-amber-700',
    APPROVAL_PENDING: 'border-amber-200 bg-amber-50 text-amber-700',
    ACTION_REQUIRED: 'border-red-200 bg-red-50 text-red-700',
    PAST_DUE: 'border-red-200 bg-red-50 text-red-700',
    SUSPENDED: 'border-amber-200 bg-amber-50 text-amber-700',
    PENDING: 'border-amber-200 bg-amber-50 text-amber-700',
    WAITING: 'border-amber-200 bg-amber-50 text-amber-700',
    CREATED: 'border-blue-200 bg-blue-50 text-blue-700',
    RECEIVED: 'border-blue-200 bg-blue-50 text-blue-700',
    PROCESSING: 'border-blue-200 bg-blue-50 text-blue-700',
    FAILED: 'border-red-200 bg-red-50 text-red-700',
    CANCELLED: 'border-slate-200 bg-slate-50 text-slate-700',
    CANCELED: 'border-slate-200 bg-slate-50 text-slate-700',
    REFUNDED: 'border-purple-200 bg-purple-50 text-purple-700',
    IGNORED: 'border-slate-200 bg-slate-50 text-slate-700',
    SKIPPED: 'border-slate-200 bg-slate-50 text-slate-700',
    WEBHOOK: 'border-blue-200 bg-blue-50 text-blue-700',
    STATUS_POLL: 'border-indigo-200 bg-indigo-50 text-indigo-700',
    RECONCILIATION: 'border-purple-200 bg-purple-50 text-purple-700',
    CRON: 'border-slate-200 bg-slate-50 text-slate-700',
    PAYMENT_EFFECT: 'border-emerald-200 bg-emerald-50 text-emerald-700',
};

function formatDate(value?: unknown) {
    if (!value)
        return '-';

    const date = new Date(String(value));
    if (Number.isNaN(date.getTime()))
        return String(value);

    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    }).format(date);
}

function formatAmount(amount?: number | null, currency?: string | null, symbol?: string | null) {
    if (typeof amount !== 'number')
        return '-';

    return `${symbol || ''}${amount.toFixed(2)}${currency ? ` ${currency}` : ''}`;
}

function shortText(value?: string | null, start = 10, end = 6) {
    if (!value)
        return '-';

    if (value.length <= start + end + 3)
        return value;

    return `${value.slice(0, start)}...${value.slice(-end)}`;
}

function stringifyJson(value: unknown) {
    try {
        const output = JSON.stringify(value, null, 2);
        if (!output || output === 'null' || output === '{}')
            return '';

        return output.length > 6000 ? `${output.slice(0, 6000)}\n... truncated` : output;
    }
    catch {
        return String(value || '');
    }
}

function getMetaString(meta: unknown, key: string) {
    if (!meta || typeof meta !== 'object')
        return null;

    const value = (meta as Record<string, unknown>)[key];
    return typeof value === 'string' ? value : null;
}

function matchesSearch(row: unknown, search: string) {
    const term = search.trim().toLowerCase();
    if (!term)
        return true;

    return stringifyJson(row).toLowerCase().includes(term);
}

function StatusBadge({ value }: { value?: string | null }) {
    if (!value)
        return <span className="text-slate-400">-</span>;

    return (
        <Badge
            variant="outline"
            className={cn('whitespace-nowrap border font-semibold', STATUS_CLASS[value] || 'border-slate-200 bg-slate-50 text-slate-700')}
        >
            {value}
        </Badge>
    );
}

function BooleanBadge({ value }: { value?: boolean | null }) {
    if (value === true)
        return <StatusBadge value="SUCCESS" />;
    if (value === false)
        return <StatusBadge value="FAILED" />;
    return <span className="text-slate-400">-</span>;
}

function JsonDetails({ label, value }: { label: string; value: unknown }) {
    const content = stringifyJson(value);

    if (!content)
        return <span className="text-slate-400">-</span>;

    return (
        <details className="max-w-[34rem] whitespace-normal">
            <summary className="cursor-pointer text-xs font-semibold text-purple-700 hover:text-purple-900">
                {label}
            </summary>
            <pre className="mt-2 max-h-80 overflow-auto rounded-md border bg-slate-950 p-3 text-xs leading-relaxed text-slate-100">
                {content}
            </pre>
        </details>
    );
}

function resolveRoleNames(roleIds: readonly (string | null)[] | null | undefined, roleNameById: Map<string, string>) {
    return (roleIds || [])
        .filter((roleId): roleId is string => Boolean(roleId))
        .map(roleId => roleNameById.get(roleId) || shortText(roleId));
}

function RoleChangeDetails({
    label,
    roleIds,
    roleNameById,
}: {
    label: string;
    roleIds?: readonly (string | null)[] | null;
    roleNameById: Map<string, string>;
}) {
    const names = resolveRoleNames(roleIds, roleNameById);

    if (names.length === 0) {
        return (
            <div>
                <div className="text-xs font-semibold text-slate-500">{label}</div>
                <div className="text-slate-400">-</div>
            </div>
        );
    }

    return (
        <div>
            <div className="text-xs font-semibold text-slate-500">{label}</div>
            <div className="mt-1 flex flex-wrap gap-1">
                {names.map(name => (
                    <Badge
                        key={`${label}-${name}`}
                        variant="outline"
                        className="border-slate-200 bg-slate-50 font-mono text-[11px] text-slate-700"
                    >
                        {name}
                    </Badge>
                ))}
            </div>
        </div>
    );
}

function StatCard({
    icon: Icon,
    label,
    value,
    tone,
}: {
    icon: ComponentType<{ className?: string }>;
    label: string;
    value: number | string;
    tone: string;
}) {
    return (
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <p className="text-sm font-medium text-slate-500">{label}</p>
                    <p className="mt-1 text-2xl font-bold text-slate-950">{value}</p>
                </div>
                <div className={cn('rounded-lg p-2 text-white', tone)}>
                    <Icon className="size-5" />
                </div>
            </div>
        </div>
    );
}

function EmptyRow({ colSpan, loading }: { colSpan: number; loading: boolean }) {
    return (
        <TableRow>
            <TableCell colSpan={colSpan} className="h-28 text-center text-slate-500">
                {loading ? 'Loading...' : 'No records'}
            </TableCell>
        </TableRow>
    );
}

function ErrorBanner({ message }: { message?: string }) {
    if (!message)
        return null;

    return (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {message}
        </div>
    );
}

function UserCell({ order }: { order: T_PaymentAuditOrder }) {
    const roles = order.user?.roles?.map(role => role?.name).filter(Boolean).join(', ');

    return (
        <div className="min-w-52 whitespace-normal">
            <div className="font-semibold text-slate-950">{order.user?.username || order.user?.email || 'Unknown user'}</div>
            <div className="text-xs text-slate-500">{order.user?.email || order.userId || '-'}</div>
            {roles && <div className="mt-1 text-xs text-slate-500">{roles}</div>}
        </div>
    );
}

function SubscriptionLedgerTable({
    rows,
    loading,
}: {
    rows: T_PaymentAuditSubscription[];
    loading: boolean;
}) {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Subscription</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Next billing</TableHead>
                    <TableHead>Payment refs</TableHead>
                    <TableHead>Replacement</TableHead>
                    <TableHead>Reconcile</TableHead>
                    <TableHead>Audit</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {rows.length === 0 && <EmptyRow colSpan={8} loading={loading} />}
                {rows.map(row => (
                    <TableRow key={row.id || row.providerSubscriptionId || `${row.userId}-${row.createdAt}`}>
                        <TableCell>
                            <div className="min-w-52">
                                <div className="font-mono text-xs font-semibold">{shortText(row.providerSubscriptionId, 14, 8)}</div>
                                <div className="text-xs text-slate-500">{row.provider || '-'}</div>
                                <div className="font-mono text-xs text-slate-500">{`U: ${shortText(row.userId)}`}</div>
                            </div>
                        </TableCell>
                        <TableCell>
                            <div className="flex min-w-36 flex-col gap-1">
                                <StatusBadge value={row.status} />
                                <div className="text-xs text-slate-500">{row.providerStatus || '-'}</div>
                                {row.lastError && (
                                    <Badge variant="outline" className="border-red-200 bg-red-50 text-red-700">
                                        Action needed
                                    </Badge>
                                )}
                            </div>
                        </TableCell>
                        <TableCell>
                            <div className="min-w-44 text-sm">
                                <div>{formatDate(row.currentPeriodStartAt)}</div>
                                <div className="text-slate-500">{formatDate(row.currentPeriodEndAt)}</div>
                            </div>
                        </TableCell>
                        <TableCell>
                            <div className="min-w-40">
                                <div>{formatDate(row.nextBillingAt)}</div>
                                <div className="text-xs text-slate-500">{`Paid: ${formatDate(row.lastPaidAt)}`}</div>
                            </div>
                        </TableCell>
                        <TableCell>
                            <div className="min-w-48 font-mono text-xs">
                                <div>{`O: ${shortText(row.orderId)}`}</div>
                                <div>{`R: ${shortText(row.paymentRequestId)}`}</div>
                                <div>{formatAmount(row.amount, row.currency)}</div>
                            </div>
                        </TableCell>
                        <TableCell>
                            <div className="min-w-56 font-mono text-xs">
                                <div>{`Replaces: ${shortText(row.replacesSubscriptionId, 12, 8)}`}</div>
                                <div>{`Replaced by: ${shortText(row.replacedBySubscriptionId, 12, 8)}`}</div>
                                <div className="font-sans text-xs text-slate-500">{row.replacementReason || '-'}</div>
                            </div>
                        </TableCell>
                        <TableCell>
                            <div className="min-w-44">
                                <div>{formatDate(row.nextReconcileAt)}</div>
                                <div className="text-xs text-slate-500">{`Grace: ${formatDate(row.graceUntil)}`}</div>
                                <div className="text-xs text-slate-500">{`Checked: ${formatDate(row.lastCheckedAt)}`}</div>
                            </div>
                        </TableCell>
                        <TableCell>
                            <div className="flex min-w-52 flex-col gap-2">
                                {row.lastError && <div className="text-xs font-medium text-red-700">{row.lastError}</div>}
                                <JsonDetails label="Meta" value={row.meta} />
                                <JsonDetails label="PayPal snapshot" value={row.providerSnapshot} />
                            </div>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}

function OrdersTable({
    rows,
    loading,
}: {
    rows: T_PaymentAuditOrder[];
    loading: boolean;
}) {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Member until</TableHead>
                    <TableHead>Order</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Subscription</TableHead>
                    <TableHead>Effect</TableHead>
                    <TableHead>Audit</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {rows.length === 0 && <EmptyRow colSpan={8} loading={loading} />}
                {rows.map((order) => {
                    const paymentRequest = order.paymentRequests?.[0];
                    const subscriptionId = order.paymentTransaction?.subscriptionId
                        || getMetaString(paymentRequest?.meta, 'subscriptionId')
                        || getMetaString(order.meta, 'subscriptionId');

                    return (
                        <TableRow key={order.id || `${order.userId}-${order.createdAt}`}>
                            <TableCell><UserCell order={order} /></TableCell>
                            <TableCell>
                                <div className="min-w-36">
                                    <div>{formatDate(order.user?.membershipExpiresAt)}</div>
                                    {order.user?.membershipCancelled && (
                                        <Badge variant="outline" className="mt-1 border-slate-200 bg-slate-50 text-slate-700">
                                            Cancelled
                                        </Badge>
                                    )}
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="min-w-44">
                                    <div className="font-mono text-xs">{shortText(order.id)}</div>
                                    <div className="text-xs text-slate-500">{formatDate(order.createdAt)}</div>
                                </div>
                            </TableCell>
                            <TableCell>{formatAmount(order.amount, order.pricing?.currency?.code, order.pricing?.currency?.symbol)}</TableCell>
                            <TableCell><StatusBadge value={order.status} /></TableCell>
                            <TableCell>
                                <div className="min-w-44 font-mono text-xs">{shortText(subscriptionId, 12, 8)}</div>
                            </TableCell>
                            <TableCell>
                                <div className="min-w-36">
                                    {formatDate(order.effectsAppliedAt)}
                                    {order.status === 'PAID' && !order.effectsAppliedAt && (
                                        <Badge variant="outline" className="mt-1 border-red-200 bg-red-50 text-red-700">
                                            Missing effect
                                        </Badge>
                                    )}
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="flex min-w-44 flex-col gap-2">
                                    <JsonDetails label="Order meta" value={order.meta} />
                                    <JsonDetails label="Payment request" value={paymentRequest} />
                                    <JsonDetails label="Transaction" value={order.paymentTransaction} />
                                </div>
                            </TableCell>
                        </TableRow>
                    );
                })}
            </TableBody>
        </Table>
    );
}

function TransactionsTable({
    rows,
    loading,
}: {
    rows: T_PaymentAuditTransaction[];
    loading: boolean;
}) {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Operation</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>User / Order</TableHead>
                    <TableHead>PayPal refs</TableHead>
                    <TableHead>Error</TableHead>
                    <TableHead>Payload</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {rows.length === 0 && <EmptyRow colSpan={9} loading={loading} />}
                {rows.map(row => (
                    <TableRow key={row.id || `${row.transactionId}-${row.createdAt}`}>
                        <TableCell>
                            <div className="min-w-36">{formatDate(row.occurredAt || row.performedAt || row.createdAt)}</div>
                        </TableCell>
                        <TableCell>
                            <div className="flex flex-col gap-1">
                                <StatusBadge value={row.status} />
                                <BooleanBadge value={row.success} />
                            </div>
                        </TableCell>
                        <TableCell><StatusBadge value={row.source} /></TableCell>
                        <TableCell>{row.operation || '-'}</TableCell>
                        <TableCell>{formatAmount(row.amount, row.currency)}</TableCell>
                        <TableCell>
                            <div className="min-w-44 font-mono text-xs">
                                <div>{`U: ${shortText(row.userId)}`}</div>
                                <div>{`O: ${shortText(row.orderId)}`}</div>
                                <div>{`R: ${shortText(row.paymentRequestId)}`}</div>
                            </div>
                        </TableCell>
                        <TableCell>
                            <div className="min-w-52 font-mono text-xs">
                                <div>{`Sub: ${shortText(row.subscriptionId, 12, 8)}`}</div>
                                <div>{`Txn: ${shortText(row.transactionId, 12, 8)}`}</div>
                                <div>{`Evt: ${shortText(row.providerEventId, 12, 8)}`}</div>
                            </div>
                        </TableCell>
                        <TableCell>
                            <div className="min-w-44 whitespace-normal text-xs text-red-700">
                                {row.errorCode || row.errorMessage ? `${row.errorCode || ''} ${row.errorMessage || ''}`.trim() : '-'}
                            </div>
                        </TableCell>
                        <TableCell><JsonDetails label="Payload" value={row.responsePayload} /></TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}

function GatewayEventsTable({
    rows,
    loading,
}: {
    rows: T_PaymentAuditGatewayEvent[];
    loading: boolean;
}) {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Received</TableHead>
                    <TableHead>Event</TableHead>
                    <TableHead>Processing</TableHead>
                    <TableHead>Verification</TableHead>
                    <TableHead>PayPal refs</TableHead>
                    <TableHead>Internal refs</TableHead>
                    <TableHead>Attempts</TableHead>
                    <TableHead>Error</TableHead>
                    <TableHead>Payload</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {rows.length === 0 && <EmptyRow colSpan={9} loading={loading} />}
                {rows.map(row => (
                    <TableRow key={row.id || row.eventId || `${row.resourceId}-${row.receivedAt}`}>
                        <TableCell>
                            <div className="min-w-36">{formatDate(row.receivedAt || row.createdAt)}</div>
                        </TableCell>
                        <TableCell>
                            <div className="min-w-52 whitespace-normal">
                                <div className="font-semibold">{row.eventType || '-'}</div>
                                <div className="font-mono text-xs text-slate-500">{shortText(row.eventId, 12, 8)}</div>
                            </div>
                        </TableCell>
                        <TableCell><StatusBadge value={row.processingStatus} /></TableCell>
                        <TableCell><StatusBadge value={row.verificationStatus} /></TableCell>
                        <TableCell>
                            <div className="min-w-52 font-mono text-xs">
                                <div>{`Res: ${shortText(row.resourceId, 12, 8)}`}</div>
                                <div>{`Sub: ${shortText(row.subscriptionId, 12, 8)}`}</div>
                                <div>{`Txn: ${shortText(row.transactionId, 12, 8)}`}</div>
                            </div>
                        </TableCell>
                        <TableCell>
                            <div className="min-w-44 font-mono text-xs">
                                <div>{`U: ${shortText(row.userId)}`}</div>
                                <div>{`O: ${shortText(row.orderId)}`}</div>
                                <div>{`R: ${shortText(row.paymentRequestId)}`}</div>
                            </div>
                        </TableCell>
                        <TableCell>{row.attemptCount ?? '-'}</TableCell>
                        <TableCell>
                            <div className="min-w-44 whitespace-normal text-xs text-red-700">{row.errorMessage || '-'}</div>
                        </TableCell>
                        <TableCell>
                            <div className="flex min-w-44 flex-col gap-2">
                                <JsonDetails label="Payload" value={row.payload} />
                                <JsonDetails label="Headers" value={row.headers} />
                            </div>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}

function EntitlementChangesTable({
    rows,
    loading,
    roleNameById,
}: {
    rows: T_PaymentAuditEntitlementChange[];
    loading: boolean;
    roleNameById: Map<string, string>;
}) {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Changed</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Source / reason</TableHead>
                    <TableHead>Membership expiry</TableHead>
                    <TableHead>Cancelled</TableHead>
                    <TableHead>Refs</TableHead>
                    <TableHead>Roles</TableHead>
                    <TableHead>Metadata</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {rows.length === 0 && <EmptyRow colSpan={8} loading={loading} />}
                {rows.map(row => (
                    <TableRow key={row.id || `${row.userId}-${row.changedAt}`}>
                        <TableCell><div className="min-w-36">{formatDate(row.changedAt || row.createdAt)}</div></TableCell>
                        <TableCell><div className="min-w-44 font-mono text-xs">{shortText(row.userId)}</div></TableCell>
                        <TableCell>
                            <div className="flex min-w-40 flex-col gap-1">
                                <StatusBadge value={row.source} />
                                <div className="text-xs font-medium text-slate-700">{row.reason || '-'}</div>
                            </div>
                        </TableCell>
                        <TableCell>
                            <div className="min-w-44 text-sm">
                                <div>{formatDate(row.beforeMembershipExpiresAt)}</div>
                                <div className="text-slate-500">{formatDate(row.afterMembershipExpiresAt)}</div>
                            </div>
                        </TableCell>
                        <TableCell>
                            <div className="flex min-w-28 flex-col gap-1">
                                <BooleanBadge value={row.beforeMembershipCancelled} />
                                <BooleanBadge value={row.afterMembershipCancelled} />
                            </div>
                        </TableCell>
                        <TableCell>
                            <div className="min-w-56 font-mono text-xs">
                                <div>{`Sub: ${shortText(row.providerSubscriptionId, 12, 8)}`}</div>
                                <div>{`Txn: ${shortText(row.transactionId, 12, 8)}`}</div>
                                <div>{`O: ${shortText(row.orderId)}`}</div>
                                <div>{`R: ${shortText(row.paymentRequestId)}`}</div>
                                <div>{shortText(row.effectKey, 18, 10)}</div>
                            </div>
                        </TableCell>
                        <TableCell>
                            <div className="flex min-w-52 flex-col gap-2 text-xs">
                                <RoleChangeDetails label="Before roles" roleIds={row.beforeRolesIds} roleNameById={roleNameById} />
                                <RoleChangeDetails label="After roles" roleIds={row.afterRolesIds} roleNameById={roleNameById} />
                            </div>
                        </TableCell>
                        <TableCell><JsonDetails label="Metadata" value={row.metadata} /></TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}

function PaymentRequestsTable({
    rows,
    loading,
}: {
    rows: T_PaymentAuditPaymentRequest[];
    loading: boolean;
}) {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Created</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Gateway</TableHead>
                    <TableHead>External order</TableHead>
                    <TableHead>Payment URL</TableHead>
                    <TableHead>Meta</TableHead>
                    <TableHead>Gateway response</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {rows.length === 0 && <EmptyRow colSpan={7} loading={loading} />}
                {rows.map(row => (
                    <TableRow key={row.id || row.externalOrderId}>
                        <TableCell>
                            <div className="min-w-36">{formatDate(row.createdAt)}</div>
                        </TableCell>
                        <TableCell><StatusBadge value={row.status} /></TableCell>
                        <TableCell>{row.gateway || '-'}</TableCell>
                        <TableCell>
                            <div className="min-w-52 font-mono text-xs">{shortText(row.externalOrderId, 14, 8)}</div>
                        </TableCell>
                        <TableCell>
                            {row.paymentUrl
                                ? (
                                        <a
                                            href={row.paymentUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-block max-w-64 truncate text-sm font-medium text-purple-700 hover:text-purple-900"
                                        >
                                            {row.paymentUrl}
                                        </a>
                                    )
                                : '-'}
                        </TableCell>
                        <TableCell><JsonDetails label="Meta" value={row.meta} /></TableCell>
                        <TableCell><JsonDetails label="Gateway response" value={row.gatewayResponse} /></TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}

function buildStats(activeTab: T_AuditTab, total: number, rows: unknown[]) {
    const failed = rows.filter(row => stringifyJson(row).includes('FAILED')).length;
    const success = rows.filter((row) => {
        const output = stringifyJson(row);
        return output.includes('PAID') || output.includes('SUCCESS') || output.includes('PROCESSED');
    }).length;
    const open = rows.filter((row) => {
        const output = stringifyJson(row);
        return output.includes('PENDING') || output.includes('WAITING') || output.includes('RECEIVED') || output.includes('PROCESSING');
    }).length;

    const totalLabel: Record<T_AuditTab, string> = {
        subscriptions: 'Subscriptions',
        transactions: 'Transactions',
        events: 'Webhook events',
        entitlements: 'Entitlement changes',
        requests: 'Payment requests',
        orders: 'Subscription orders',
    };

    return [
        { label: totalLabel[activeTab], value: total, icon: ReceiptText, tone: 'bg-purple-600' },
        { label: 'Visible success', value: success, icon: CheckCircle2, tone: 'bg-emerald-600' },
        { label: 'Visible pending', value: open, icon: Clock3, tone: 'bg-amber-500' },
        { label: 'Visible failed', value: failed, icon: XCircle, tone: 'bg-red-600' },
    ];
}

export default function PaymentAuditPage() {
    const { setHeader } = usePortal();
    const [activeTab, setActiveTab] = useState<T_AuditTab>('subscriptions');
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(20);
    const [statusFilter, setStatusFilter] = useState(ALL_STATUS);
    const [search, setSearch] = useState('');
    const { roles } = useGetRoles({ isDel: false }, { pagination: false, sort: { name: 1 } });

    useEffect(() => {
        setHeader({
            title: 'Payments',
            description: 'Payment and subscription audit',
            icon: CreditCard,
        });
        return () => setHeader(null);
    }, [setHeader]);

    const ledgerOptions = useMemo(() => ({
        page,
        limit,
        sort: { createdAt: -1 },
    }), [limit, page]);

    const orderOptions = useMemo(() => ({
        page,
        limit,
        sort: { createdAt: -1 },
        populate: ['user', 'pricing', 'paymentTransaction', 'paymentRequests'],
    }), [limit, page]);

    const subscriptionOptions = useMemo(() => ({
        page,
        limit,
        sort: { updatedAt: -1 },
    }), [limit, page]);

    const entitlementOptions = useMemo(() => ({
        page,
        limit,
        sort: { changedAt: -1 },
    }), [limit, page]);

    const roleNameById = useMemo(() => {
        return new Map(
            roles
                .filter(role => role?.id && role?.name)
                .map(role => [role!.id!, role!.name!] as const),
        );
    }, [roles]);

    const subscriptionFilter = useMemo(() => {
        const filter: Record<string, unknown> = {
            isDel: false,
            provider: E_PaymentProvider.PAYPAL,
        };
        if (statusFilter !== ALL_STATUS)
            filter.status = statusFilter;
        return filter;
    }, [statusFilter]);

    const orderFilter = useMemo(() => {
        const filter: Record<string, unknown> = {
            isDel: false,
            orderType: E_OrderType.SUBSCRIPTION,
        };
        if (statusFilter !== ALL_STATUS)
            filter.status = statusFilter;
        return filter;
    }, [statusFilter]);

    const entitlementFilter = useMemo(() => {
        const filter: Record<string, unknown> = {
            isDel: false,
            provider: E_PaymentProvider.PAYPAL,
        };
        if (statusFilter !== ALL_STATUS)
            filter.source = statusFilter;
        return filter;
    }, [statusFilter]);

    const paymentRequestFilter = useMemo(() => {
        const filter: Record<string, unknown> = { isDel: false, gateway: 'PAYPAL' };
        if (statusFilter !== ALL_STATUS)
            filter.status = statusFilter;
        return filter;
    }, [statusFilter]);

    const transactionFilter = useMemo(() => {
        const filter: Record<string, unknown> = {
            provider: E_PaymentProvider.PAYPAL,
        };
        if (statusFilter !== ALL_STATUS)
            filter.status = statusFilter;
        return filter;
    }, [statusFilter]);

    const gatewayEventFilter = useMemo(() => {
        const filter: Record<string, unknown> = {
            isDel: false,
            provider: E_PaymentProvider.PAYPAL,
        };
        if (statusFilter !== ALL_STATUS)
            filter.processingStatus = statusFilter;
        return filter;
    }, [statusFilter]);

    const subscriptionQuery = usePaymentAuditSubscriptions(subscriptionFilter, subscriptionOptions, activeTab === 'subscriptions');
    const orderQuery = usePaymentAuditOrders(orderFilter, orderOptions, activeTab === 'orders');
    const transactionQuery = usePaymentAuditTransactions(transactionFilter, ledgerOptions, activeTab === 'transactions');
    const gatewayEventQuery = usePaymentAuditGatewayEvents(gatewayEventFilter, ledgerOptions, activeTab === 'events');
    const entitlementQuery = usePaymentAuditEntitlementChanges(entitlementFilter, entitlementOptions, activeTab === 'entitlements');
    const paymentRequestQuery = usePaymentAuditPaymentRequests(paymentRequestFilter, ledgerOptions, activeTab === 'requests');

    const visibleSubscriptions = useMemo(() => subscriptionQuery.subscriptions.filter(row => matchesSearch(row, search)), [subscriptionQuery.subscriptions, search]);
    const visibleOrders = useMemo(() => orderQuery.orders.filter(row => matchesSearch(row, search)), [orderQuery.orders, search]);
    const visibleTransactions = useMemo(() => transactionQuery.transactions.filter(row => matchesSearch(row, search)), [transactionQuery.transactions, search]);
    const visibleGatewayEvents = useMemo(() => gatewayEventQuery.gatewayEvents.filter(row => matchesSearch(row, search)), [gatewayEventQuery.gatewayEvents, search]);
    const visibleEntitlementChanges = useMemo(() => entitlementQuery.entitlementChanges.filter(row => matchesSearch(row, search)), [entitlementQuery.entitlementChanges, search]);
    const visiblePaymentRequests = useMemo(() => paymentRequestQuery.paymentRequests.filter(row => matchesSearch(row, search)), [paymentRequestQuery.paymentRequests, search]);

    const activeState = useMemo(() => {
        switch (activeTab) {
            case 'transactions':
                return {
                    rows: visibleTransactions,
                    pagination: transactionQuery.pagination,
                    loading: transactionQuery.loading,
                    error: transactionQuery.error?.message,
                    refetch: transactionQuery.refetch,
                };
            case 'events':
                return {
                    rows: visibleGatewayEvents,
                    pagination: gatewayEventQuery.pagination,
                    loading: gatewayEventQuery.loading,
                    error: gatewayEventQuery.error?.message,
                    refetch: gatewayEventQuery.refetch,
                };
            case 'entitlements':
                return {
                    rows: visibleEntitlementChanges,
                    pagination: entitlementQuery.pagination,
                    loading: entitlementQuery.loading,
                    error: entitlementQuery.error?.message,
                    refetch: entitlementQuery.refetch,
                };
            case 'requests':
                return {
                    rows: visiblePaymentRequests,
                    pagination: paymentRequestQuery.pagination,
                    loading: paymentRequestQuery.loading,
                    error: paymentRequestQuery.error?.message,
                    refetch: paymentRequestQuery.refetch,
                };
            case 'orders':
                return {
                    rows: visibleOrders,
                    pagination: orderQuery.pagination,
                    loading: orderQuery.loading,
                    error: orderQuery.error?.message,
                    refetch: orderQuery.refetch,
                };
            case 'subscriptions':
            default:
                return {
                    rows: visibleSubscriptions,
                    pagination: subscriptionQuery.pagination,
                    loading: subscriptionQuery.loading,
                    error: subscriptionQuery.error?.message,
                    refetch: subscriptionQuery.refetch,
                };
        }
    }, [
        activeTab,
        entitlementQuery.error?.message,
        entitlementQuery.loading,
        entitlementQuery.pagination,
        entitlementQuery.refetch,
        gatewayEventQuery.error?.message,
        gatewayEventQuery.loading,
        gatewayEventQuery.pagination,
        gatewayEventQuery.refetch,
        orderQuery.error?.message,
        orderQuery.loading,
        orderQuery.pagination,
        orderQuery.refetch,
        paymentRequestQuery.error?.message,
        paymentRequestQuery.loading,
        paymentRequestQuery.pagination,
        paymentRequestQuery.refetch,
        subscriptionQuery.error?.message,
        subscriptionQuery.loading,
        subscriptionQuery.pagination,
        subscriptionQuery.refetch,
        transactionQuery.error?.message,
        transactionQuery.loading,
        transactionQuery.pagination,
        transactionQuery.refetch,
        visibleEntitlementChanges,
        visibleGatewayEvents,
        visibleOrders,
        visiblePaymentRequests,
        visibleSubscriptions,
        visibleTransactions,
    ]);

    const stats = useMemo(
        () => buildStats(activeTab, activeState.pagination.totalDocs, activeState.rows),
        [activeState.pagination.totalDocs, activeState.rows, activeTab],
    );

    const handleTabChange = (value: string) => {
        setActiveTab(value as T_AuditTab);
        setStatusFilter(ALL_STATUS);
        setSearch('');
        setPage(1);
    };

    const handleLimitChange = (nextLimit: number) => {
        setLimit(nextLimit);
        setPage(1);
    };

    const handleRefresh = () => {
        void activeState.refetch();
    };

    const pagination = activeState.pagination as I_PaginationInfo;

    return (
        <div className="min-h-screen bg-slate-50 p-6">
            <div className="space-y-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {stats.map(stat => (
                        <StatCard
                            key={stat.label}
                            icon={stat.icon}
                            label={stat.label}
                            value={stat.value}
                            tone={stat.tone}
                        />
                    ))}
                </div>

                <Tabs value={activeTab} onValueChange={handleTabChange} className="gap-4">
                    <div className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm xl:flex-row xl:items-center xl:justify-between">
                        <TabsList className="h-auto flex-wrap justify-start">
                            <TabsTrigger value="subscriptions" className="text-sm">
                                <ReceiptText className="size-4" />
                                Subscriptions
                            </TabsTrigger>
                            <TabsTrigger value="transactions" className="text-sm">
                                <CreditCard className="size-4" />
                                Transactions
                            </TabsTrigger>
                            <TabsTrigger value="events" className="text-sm">
                                <RadioTower className="size-4" />
                                Webhooks
                            </TabsTrigger>
                            <TabsTrigger value="entitlements" className="text-sm">
                                <GitBranch className="size-4" />
                                Entitlements
                            </TabsTrigger>
                            <TabsTrigger value="requests" className="text-sm">
                                <FileClock className="size-4" />
                                Requests
                            </TabsTrigger>
                            <TabsTrigger value="orders" className="text-sm">
                                <ReceiptText className="size-4" />
                                Orders
                            </TabsTrigger>
                        </TabsList>

                        <div className="flex flex-col gap-3 md:flex-row md:items-center">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                                <Input
                                    value={search}
                                    onChange={(event) => {
                                        setSearch(event.target.value);
                                    }}
                                    placeholder="Search current page"
                                    className="min-w-72 pl-9"
                                />
                            </div>

                            <Select
                                value={statusFilter}
                                onValueChange={(value) => {
                                    setStatusFilter(value);
                                    setPage(1);
                                }}
                            >
                                <SelectTrigger className="min-w-44 bg-white">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {STATUS_OPTIONS[activeTab].map(option => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Button variant="outline" onClick={handleRefresh} disabled={activeState.loading}>
                                <RefreshCw className={cn('size-4', activeState.loading && 'animate-spin')} />
                                Refresh
                            </Button>
                        </div>
                    </div>

                    <ErrorBanner message={activeState.error} />

                    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                        <TabsContent value="subscriptions" className="m-0">
                            <SubscriptionLedgerTable rows={visibleSubscriptions} loading={subscriptionQuery.loading} />
                        </TabsContent>
                        <TabsContent value="transactions" className="m-0">
                            <TransactionsTable rows={visibleTransactions} loading={transactionQuery.loading} />
                        </TabsContent>
                        <TabsContent value="events" className="m-0">
                            <GatewayEventsTable rows={visibleGatewayEvents} loading={gatewayEventQuery.loading} />
                        </TabsContent>
                        <TabsContent value="entitlements" className="m-0">
                            <EntitlementChangesTable rows={visibleEntitlementChanges} loading={entitlementQuery.loading} roleNameById={roleNameById} />
                        </TabsContent>
                        <TabsContent value="requests" className="m-0">
                            <PaymentRequestsTable rows={visiblePaymentRequests} loading={paymentRequestQuery.loading} />
                        </TabsContent>
                        <TabsContent value="orders" className="m-0">
                            <OrdersTable rows={visibleOrders} loading={orderQuery.loading} />
                        </TabsContent>

                        <Pagination
                            total={pagination.totalDocs}
                            page={page}
                            limit={limit}
                            hasPrevPage={pagination.hasPrevPage}
                            hasNextPage={pagination.hasNextPage}
                            totalPages={pagination.totalPages}
                            onPageChange={setPage}
                            onLimitChange={handleLimitChange}
                            sticky={false}
                        />
                    </div>
                </Tabs>

                <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    <AlertTriangle className="size-4 shrink-0" />
                    <span>Rows marked Missing effect should be reviewed against PayPal webhook and transaction records.</span>
                </div>
            </div>
        </div>
    );
}
