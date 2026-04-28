import { PDFDownloadLink } from '@react-pdf/renderer';
import { BarChart3, DollarSign, Download, Globe, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { E_PricingType, Input_CreatePricing, Input_UpdatePricing, T_Country, T_Currency, T_Pricing } from '#shared/graphql';

import { useGetCurrencies } from '#modules/currency';
import { useGetCountries } from '#modules/location';
import { useGetStates } from '#modules/location/state';
import { ConfirmDialog } from '#shared/component';
import { useTranslate } from '#shared/i18n';
import { usePortal } from '#shared/portal';
import { getGeolocationFromIP } from '#shared/util/geolocation';

import type { I_PriceFormRef } from './pricing.type';

import { useGetPaidOrders } from './order.hook';
import { PriceForm } from './price-form';
import { PricingCountryConfig } from './pricing-country-config';
import { PricingList } from './pricing-list';
import { useCreatePrice, useDeletePrice, useGetPrices, useTogglePriceStatus, useUpdatePrice } from './pricing.hook';
import ReportForm from './report-form';

export default function PricingPage() {
    const { t } = useTranslate('pricing');
    const { countries } = useGetCountries({ isDel: false }, { pagination: false });
    const { states } = useGetStates({}, { pagination: false });
    const { currencies } = useGetCurrencies({ isDel: false }, { pagination: false });
    const { orders: paidOrders, loading: loadingOrders, refetch: _refetchOrders } = useGetPaidOrders({
        pagination: false,
        populate: ['user', 'pricing'],
    });
    const { setHeader } = usePortal();
    const [ipCountries, setIpCountries] = useState<Record<string, string>>({});
    const [selectedView, setSelectedView] = useState<'pricing' | 'country-config' | 'reports'>('pricing');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [search, setSearch] = useState('');
    const [selectedType, setSelectedType] = useState<E_PricingType | 'ALL'>('ALL');
    const [selectedStatus, setSelectedStatus] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
    const [deletingPrice, setDeletingPrice] = useState<T_Pricing | null>(null);
    const priceFormRef = useRef<I_PriceFormRef>(null);

    useEffect(() => {
        setHeader({
            title: t('pricing-management'),
            description: t('pricing-description'),
            icon: DollarSign,
        });
        return () => setHeader(null);
    }, [setHeader, t]);

    useEffect(() => {
        const loadIpCountries = async () => {
            const newIpCountries: Record<string, string> = {};
            const uniqueIps = [...new Set(paidOrders.map(o => o.user?.lastLoginIp).filter(Boolean))] as string[];

            const ipsToLoad = uniqueIps.filter(ip => !ipCountries[ip]);

            if (ipsToLoad.length === 0)
                return;

            await Promise.all(
                ipsToLoad.map(async (ip) => {
                    try {
                        const geo = await getGeolocationFromIP(ip);
                        if (geo.countryCode) {
                            const country = countries.find(c => c?.iso2 === geo.countryCode);
                            if (country?.name) {
                                newIpCountries[ip] = country.name;
                            }
                        }
                    }
                    catch {
                        // Ignore errors
                    }
                }),
            );

            if (Object.keys(newIpCountries).length > 0) {
                setIpCountries(prev => ({ ...prev, ...newIpCountries }));
            }
        };

        if (paidOrders.length > 0 && countries.length > 0) {
            loadIpCountries();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [paidOrders, countries]);

    const filter = useMemo(() => {
        const filterObj: {
            isDel: boolean;
            type?: E_PricingType;
            isActive?: boolean;
            countryId?: string;
        } = {
            isDel: false,
        };

        if (selectedType !== 'ALL') {
            filterObj.type = selectedType;
        }

        if (selectedStatus !== 'ALL') {
            filterObj.isActive = selectedStatus === 'ACTIVE';
        }

        if (search && search !== 'ALL') {
            filterObj.countryId = search;
        }

        return filterObj;
    }, [selectedType, selectedStatus, search]);

    const { prices, totalDocs, loading, refetch } = useGetPrices(filter, {
        page,
        limit: pageSize,
        populate: ['country', 'state', 'currency'],
    });
    const { createPrice, loading: creating } = useCreatePrice();
    const { updatePrice, loading: updating } = useUpdatePrice();
    const { togglePriceStatus, loading: toggling } = useTogglePriceStatus();
    const { deletePrice, loading: deleting } = useDeletePrice();

    const _handleCreatePrice = useCallback(() => {
        priceFormRef.current?.open();
    }, []);

    const _handleEditPrice = useCallback((price: T_Pricing) => {
        priceFormRef.current?.open(price);
    }, []);

    const _handleDeletePrice = useCallback((price: T_Pricing) => {
        setDeletingPrice(price);
    }, []);

    const _handleConfirmDelete = useCallback(async () => {
        if (deletingPrice?.id) {
            await deletePrice(deletingPrice.id);
            setDeletingPrice(null);
            refetch();
        }
    }, [deletingPrice, deletePrice, refetch]);

    const _handleCreateSubmit = useCallback(async (data: Input_CreatePricing) => {
        await createPrice(data);
        await refetch();
    }, [createPrice, refetch]);

    const _handleUpdateSubmit = useCallback(async (id: string, data: Input_UpdatePricing) => {
        await updatePrice(id, data);
        await refetch();
    }, [updatePrice, refetch]);

    const _handleToggleStatus = useCallback(async (id: string, isActive: boolean) => {
        await togglePriceStatus(id, isActive);
        await refetch();
    }, [togglePriceStatus, refetch]);

    const _handlePageChange = useCallback((newPage: number) => {
        setPage(newPage);
    }, []);

    const _handlePageSizeChange = useCallback((newPageSize: number) => {
        setPageSize(newPageSize);
        setPage(1);
    }, []);

    const _handleSearchChange = useCallback((value: string) => {
        setSearch(value);
        setPage(1);
    }, []);

    const _handleTypeChange = useCallback((type: string) => {
        setSelectedType(type as E_PricingType | 'ALL');
        setPage(1);
    }, []);

    const _handleStatusChange = useCallback((status: string) => {
        setSelectedStatus(status as 'ALL' | 'ACTIVE' | 'INACTIVE');
        setPage(1);
    }, []);

    // Convert orders to transactions format
    const transactions = useMemo(() => {
        return paidOrders.map((order) => {
            const taxRate = order.pricing?.taxRate || 0;
            const price = order.pricing?.price || 0; // Base price from pricing config (e.g., 6)
            const tax = price * (taxRate / 100); // Tax calculated from base price
            const total = price + tax; // Total = base price + tax

            const ipAddress = order.user?.lastLoginIp || order.meta?.ip || '';

            let country = 'Unknown';
            let countryCode = 'ROW';

            if (ipAddress && ipCountries[ipAddress]) {
                country = ipCountries[ipAddress]!;
                const foundCountry = countries.find(c => c?.name === country);
                if (foundCountry?.iso2) {
                    countryCode = foundCountry.iso2;
                }
            }
            else if (order.pricing?.country?.name) {
                country = order.pricing.country.name;
                countryCode = order.pricing.country.iso2 || 'ROW';
            }

            return {
                id: order.id,
                date: order.createdAt,
                country,
                countryCode,
                amount: price, // Base price from pricing (e.g., 6 for membership)
                tax, // Tax amount
                total, // Total = price + tax
                username: order.user?.username || order.user?.email || 'Unknown',
                ipAddress,
                type: order.pricing?.type === 'MEMBERSHIP' ? 'membership' : 'announcement',
            } as const;
        });
    }, [paidOrders, ipCountries, countries]);

    const monthlyReports = useMemo(() => {
        const grouped = transactions.reduce((acc, transaction) => {
            const date = new Date(transaction.date);
            const month = date.toLocaleString('en-US', { month: 'long' });
            const year = date.getFullYear().toString();
            const key = `${month}-${year}`;

            if (!acc[key]) {
                acc[key] = {
                    month,
                    year,
                    transactions: [],
                };
            }
            acc[key].transactions.push(transaction);
            return acc;
        }, {} as Record<string, { month: string; year: string; transactions: typeof transactions }>);

        const result = Object.values(grouped).sort((a, b) => {
            const dateA = new Date(`${a.month} 1, ${a.year}`);
            const dateB = new Date(`${b.month} 1, ${b.year}`);
            return dateB.getTime() - dateA.getTime();
        });

        return result;
    }, [transactions]);

    // Current month transactions for the main table
    const currentMonthTransactions = useMemo(() => {
        const now = new Date();
        return transactions.filter((tx) => {
            const txDate = new Date(tx.date);
            return txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear();
        });
    }, [transactions]);

    const viewTabs = [
        {
            key: 'pricing' as const,
            label: t('pricing-management'),
            icon: DollarSign,
            color: 'from-purple-500 to-pink-500',
        },
        {
            key: 'country-config' as const,
            label: t('country-configuration'),
            icon: Globe,
            color: 'from-blue-500 to-cyan-500',
        },
        {
            key: 'reports' as const,
            label: t('reports'),
            icon: BarChart3,
            color: 'from-green-500 to-emerald-500',
        },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
            {/* Background Pattern */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-200 dark:bg-purple-900/30 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-200 dark:bg-blue-900/30 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
                <div className="absolute top-40 left-40 w-80 h-80 bg-pink-200 dark:bg-pink-900/30 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
            </div>

            {/* Main Content */}
            <div className="relative z-10 p-6">
                {/* View Toggle */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-2 mb-8 shadow-xl border border-white/20 dark:border-gray-700/50"
                >
                    <div className="flex space-x-2">
                        {viewTabs.map(({ key, label, icon: Icon, color }) => (
                            <button
                                type="button"
                                key={key}
                                onClick={() => setSelectedView(key)}
                                className={`flex-1 flex items-center justify-center space-x-2 py-4 px-6 rounded-xl font-medium transition-all duration-300 relative overflow-hidden ${
                                    selectedView === key
                                        ? `bg-gradient-to-r ${color} text-white shadow-lg transform scale-105`
                                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100'
                                }`}
                            >
                                <Icon size={20} />
                                <span>{label}</span>
                                {selectedView === key && (
                                    <div className="absolute inset-0 bg-white/20 rounded-xl animate-pulse-slow" />
                                )}
                            </button>
                        ))}
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    {selectedView === 'pricing' && (
                        <PricingList
                            key={`${page}-${pageSize}-${selectedType}-${selectedStatus}-${search}`}
                            countries={countries.filter((country): country is T_Country => Boolean(country))}
                            prices={prices.filter((price): price is T_Pricing => Boolean(price))}
                            loading={loading}
                            onEditPrice={_handleEditPrice}
                            onCreatePrice={_handleCreatePrice}
                            onDeletePrice={_handleDeletePrice}
                            onToggleStatus={_handleToggleStatus}
                            updatingStatusId={toggling ? 'updating' : undefined}
                            totalDocs={totalDocs}
                            page={page}
                            pageSize={pageSize}
                            onPageChange={_handlePageChange}
                            onPageSizeChange={_handlePageSizeChange}
                            search={search}
                            onSearchChange={_handleSearchChange}
                            selectedType={selectedType}
                            onTypeChange={_handleTypeChange}
                            selectedStatus={selectedStatus}
                            onStatusChange={_handleStatusChange}
                        />
                    )}

                    {selectedView === 'country-config' && (
                        <PricingCountryConfig
                            countries={countries.filter((country): country is T_Country => Boolean(country))}
                            states={states.filter((s): s is NonNullable<typeof s> => Boolean(s))}
                            currencies={currencies.filter((c): c is T_Currency => Boolean(c))}
                            existingPrices={prices.filter((price): price is T_Pricing => Boolean(price))}
                            onSaveCountryPrice={async (data, existingId) => {
                                if (existingId) {
                                    await _handleUpdateSubmit(existingId, data as Input_UpdatePricing);
                                }
                                else {
                                    await _handleCreateSubmit(data as Input_CreatePricing);
                                }
                            }}
                            saving={creating || updating}
                        />
                    )}

                    {selectedView === 'reports' && (
                        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 dark:border-gray-700/50 overflow-hidden">
                            <div className="p-8">
                                {/* Reports Header */}
                                <div className="flex justify-between items-center mb-8">
                                    <div className="space-y-2">
                                        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{t('transaction-reports')}</h2>
                                        <p className="text-gray-600 dark:text-gray-400">
                                            {t('generate-reports')}
                                        </p>
                                    </div>
                                    {currentMonthTransactions.length > 0 && (
                                        <PDFDownloadLink
                                            document={(
                                                <ReportForm
                                                    month={new Date().toLocaleString('en-US', { month: 'long' })}
                                                    year={new Date().getFullYear().toString()}
                                                    transactions={currentMonthTransactions}
                                                />
                                            )}
                                            fileName={`${new Date().toLocaleString('en-US', { month: 'long' }).toLowerCase()}-${new Date().getFullYear()}-transactions.pdf`}
                                            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center space-x-2"
                                        >
                                            <Download size={20} />
                                            <span>{t('download-report')}</span>
                                        </PDFDownloadLink>
                                    )}
                                </div>
                                {/* Enhanced Transactions Table */}
                                <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-xl mb-8">
                                    <div className="overflow-x-auto">
                                        {loadingOrders
                                            ? (
                                                    <div className="flex items-center justify-center py-12">
                                                        <div className="text-gray-500 dark:text-gray-400">{t('loading')}</div>
                                                    </div>
                                                )
                                            : currentMonthTransactions.length === 0
                                                ? (
                                                        <div className="flex items-center justify-center py-12">
                                                            <div className="text-gray-500 dark:text-gray-400">{t('no-transactions')}</div>
                                                        </div>
                                                    )
                                                : (
                                                        <table className="w-full">
                                                            <thead className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-gray-700 dark:to-gray-600">
                                                                <tr>
                                                                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
                                                                        {t('date')}
                                                                    </th>
                                                                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
                                                                        {t('user')}
                                                                    </th>
                                                                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
                                                                        {t('country')}
                                                                    </th>
                                                                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
                                                                        {t('ip-address')}
                                                                    </th>
                                                                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
                                                                        {t('type')}
                                                                    </th>
                                                                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
                                                                        {t('price-eur')}
                                                                    </th>
                                                                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
                                                                        {t('tax-eur')}
                                                                    </th>
                                                                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
                                                                        {t('total-eur')}
                                                                    </th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                                                {currentMonthTransactions.map((tx, index) => (
                                                                    <tr
                                                                        key={tx.id}
                                                                        className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all duration-300 animate-fade-in-up"
                                                                        style={{ animationDelay: `${index * 100}ms` }}
                                                                    >
                                                                        <td className="px-4 py-4 whitespace-nowrap text-gray-900 dark:text-gray-100">
                                                                            {new Date(tx.date).toLocaleDateString()}
                                                                        </td>
                                                                        <td className="px-4 py-4 whitespace-nowrap text-gray-900 dark:text-gray-100">
                                                                            {tx.username}
                                                                        </td>
                                                                        <td className="px-4 py-4 whitespace-nowrap">
                                                                            <div className="flex items-center space-x-2">
                                                                                <div className="p-1 bg-gradient-to-r from-blue-500 to-cyan-500 rounded">
                                                                                    <Globe size={12} className="text-white" />
                                                                                </div>
                                                                                <span className="text-gray-900 dark:text-gray-100">
                                                                                    {tx.country}
                                                                                </span>
                                                                            </div>
                                                                        </td>
                                                                        <td className="px-4 py-4 whitespace-nowrap text-gray-600 dark:text-gray-400 font-mono text-sm">
                                                                            {tx.ipAddress || 'N/A'}
                                                                        </td>
                                                                        <td className="px-4 py-4 whitespace-nowrap">
                                                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                                                                tx.type === 'membership'
                                                                                    ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                                                                                    : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                                                            }`}
                                                                            >
                                                                                {tx.type === 'membership' ? 'Membership' : 'Announcement'}
                                                                            </span>
                                                                        </td>
                                                                        <td className="px-4 py-4 whitespace-nowrap text-gray-900 dark:text-gray-100">
                                                                            €
                                                                            {tx.amount.toFixed(2)}
                                                                        </td>
                                                                        <td className="px-4 py-4 whitespace-nowrap text-gray-900 dark:text-gray-100">
                                                                            €
                                                                            {tx.tax.toFixed(2)}
                                                                        </td>
                                                                        <td className="px-4 py-4 whitespace-nowrap font-semibold text-green-600 dark:text-green-400">
                                                                            €
                                                                            {tx.total.toFixed(2)}
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    )}
                                    </div>
                                </div>
                                {/* Monthly Reports Section */}
                                <div className="bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-700 dark:to-gray-600 p-6 rounded-2xl border border-gray-200 dark:border-gray-600">
                                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-6 flex items-center space-x-2">
                                        <BarChart3 size={20} />
                                        <span>{t('monthly-reports')}</span>
                                    </h3>
                                    {loadingOrders
                                        ? (
                                                <div className="flex items-center justify-center py-8">
                                                    <div className="text-gray-500 dark:text-gray-400">{t('loading')}</div>
                                                </div>
                                            )
                                        : monthlyReports.length === 0
                                            ? (
                                                    <div className="flex items-center justify-center py-8">
                                                        <div className="text-gray-500 dark:text-gray-400">{t('no-reports')}</div>
                                                    </div>
                                                )
                                            : (
                                                    <div className="space-y-3">
                                                        {monthlyReports.map(({ month, year, transactions }, index) => (
                                                            <div
                                                                key={`${month}-${year}`}
                                                                className="flex items-center justify-between py-4 px-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-600 hover:shadow-lg transition-all duration-300 animate-fade-in-up"
                                                                style={{ animationDelay: `${index * 200}ms` }}
                                                            >
                                                                <div className="flex items-center space-x-3">
                                                                    <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
                                                                        <Sparkles size={16} className="text-white" />
                                                                    </div>
                                                                    <span className="text-gray-700 dark:text-gray-300 font-medium">
                                                                        {month}
                                                                        {' '}
                                                                        {year}
                                                                    </span>
                                                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                                                        (
                                                                        {transactions.length}
                                                                        {' '}
                                                                        transactions)
                                                                    </span>
                                                                </div>
                                                                <PDFDownloadLink
                                                                    document={<ReportForm month={month} year={year} transactions={transactions} />}
                                                                    fileName={`${month.toLowerCase()}-${year}-transactions.pdf`}
                                                                    className="text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/30 p-2 rounded-lg transition-all duration-300"
                                                                >
                                                                    <Download size={18} />
                                                                </PDFDownloadLink>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                </div>
                            </div>
                        </div>
                    )}
                </motion.div>
            </div>

            {/* Form and Dialog Overlays */}
            <PriceForm
                ref={priceFormRef}
                onCreateSubmit={_handleCreateSubmit}
                onUpdateSubmit={_handleUpdateSubmit}
                creating={creating}
                updating={updating}
                existingPrices={prices.filter((price): price is T_Pricing => Boolean(price))}
            />
            <ConfirmDialog
                open={!!deletingPrice}
                title={t('delete')}
                description={t('confirm-delete')}
                onConfirm={_handleConfirmDelete}
                onCancel={() => setDeletingPrice(null)}
                loading={deleting}
            />
        </div>
    );
}
