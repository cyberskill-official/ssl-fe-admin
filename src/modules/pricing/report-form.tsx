import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import { format } from 'date-fns';

import type { I_ReportFormProps } from './pricing.type';

const styles = StyleSheet.create({
    page: {
        padding: 40,
        fontFamily: 'Helvetica',
        backgroundColor: '#ffffff',
        fontSize: 10,
    },
    header: {
        marginBottom: 30,
        textAlign: 'center',
        borderBottom: '2px solid #6366f1',
        paddingBottom: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 8,
        color: '#1e293b',
    },
    subtitle: {
        fontSize: 16,
        marginBottom: 10,
        color: '#64748b',
        fontWeight: 'medium',
    },
    dateRange: {
        fontSize: 14,
        color: '#475569',
        fontStyle: 'italic',
    },
    salesSummary: {
        margin: 25,
        padding: 20,
        backgroundColor: '#f8fafc',
        borderRadius: 8,
        border: '1px solid #e2e8f0',
    },
    salesTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 15,
        color: '#1e40af',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    summaryGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
    },
    summaryItem: {
        width: '48%',
        marginBottom: 10,
    },
    summaryLabel: {
        fontSize: 11,
        color: '#64748b',
        marginBottom: 4,
    },
    summaryValue: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    table: {
        width: '100%',
        marginBottom: 25,
        border: '1px solid #e2e8f0',
        borderRadius: 6,
        overflow: 'hidden',
    },
    row: {
        flexDirection: 'row',
        borderBottom: '1px solid #e2e8f0',
        minHeight: 35,
        alignItems: 'center',
    },
    tableHeader: {
        backgroundColor: '#f1f5f9',
        fontWeight: 'bold',
        borderBottom: '2px solid #cbd5e1',
    },
    cell: {
        padding: 8,
        fontSize: 9,
        textAlign: 'left',
    },
    headerCell: {
        padding: 10,
        fontSize: 9,
        fontWeight: 'bold',
        color: '#374151',
        textTransform: 'uppercase',
        letterSpacing: 0.3,
    },
    dateCell: {
        width: '10%',
    },
    usernameCell: {
        width: '12%',
    },
    ipCell: {
        width: '14%',
    },
    countryCell: {
        width: '12%',
    },
    typeCell: {
        width: '14%',
    },
    priceCell: {
        width: '12%',
    },
    taxCell: {
        width: '12%',
    },
    totalCell: {
        width: '14%',
    },
    summary: {
        marginTop: 25,
        padding: 20,
        backgroundColor: '#f0fdf4',
        borderRadius: 8,
        border: '1px solid #bbf7d0',
    },
    summaryTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 15,
        color: '#166534',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
        alignItems: 'center',
    },
    bold: {
        fontWeight: 'bold',
        fontSize: 12,
    },
    totalRow: {
        borderTop: '2px solid #bbf7d0',
        paddingTop: 10,
        marginTop: 10,
    },
    taxSection: {
        marginTop: 35,
        borderTop: '2px solid #e2e8f0',
        paddingTop: 25,
    },
    taxTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
        color: '#1e293b',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    taxTable: {
        width: '100%',
        border: '1px solid #e2e8f0',
        borderRadius: 6,
        overflow: 'hidden',
    },
    footer: {
        marginTop: 40,
        paddingTop: 20,
        borderTop: '1px solid #e2e8f0',
        textAlign: 'center',
    },
    footerText: {
        fontSize: 9,
        color: '#64748b',
        fontStyle: 'italic',
    },
    highlight: {
        backgroundColor: '#fef3c7',
        padding: 2,
        borderRadius: 3,
    },
    currency: {
        fontFamily: 'Courier',
        fontWeight: 'bold',
    },
});

export default function ReportForm({ month, year, transactions }: I_ReportFormProps) {
    const totals = transactions.reduce(
        (acc, t) => ({
            amount: acc.amount + t.amount,
            tax: acc.tax + t.tax,
            total: acc.total + t.total,
            memberships: acc.memberships + (t.type === 'membership' ? 1 : 0),
            announcements: acc.announcements + (t.type === 'announcement' ? 1 : 0),
        }),
        { amount: 0, tax: 0, total: 0, memberships: 0, announcements: 0 },
    );

    const taxByCountry = transactions.reduce((acc, t) => {
        if (!acc[t.country]) {
            acc[t.country] = { amount: 0, tax: 0, total: 0 };
        }
        acc[t.country]!.amount += t.amount;
        acc[t.country]!.tax += t.tax;
        acc[t.country]!.total += t.total;
        return acc;
    }, {} as Record<string, { amount: number; tax: number; total: number }>);

    const currentDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>Monthly Transaction Report</Text>
                    <Text style={styles.subtitle}>Transaction Analysis & Revenue Summary</Text>
                    <Text style={styles.dateRange}>{`${month} ${year}`}</Text>
                </View>

                {/* Sales Summary */}
                <View style={styles.salesSummary}>
                    <Text style={styles.salesTitle}>SALES SUMMARY</Text>
                    <View style={styles.summaryGrid}>
                        <View style={styles.summaryItem}>
                            <Text style={styles.summaryLabel}>Total Memberships</Text>
                            <Text style={styles.summaryValue}>{totals.memberships}</Text>
                        </View>
                        <View style={styles.summaryItem}>
                            <Text style={styles.summaryLabel}>Total Announcements</Text>
                            <Text style={styles.summaryValue}>{totals.announcements}</Text>
                        </View>
                        <View style={styles.summaryItem}>
                            <Text style={styles.summaryLabel}>Total Transactions</Text>
                            <Text style={styles.summaryValue}>{transactions.length}</Text>
                        </View>
                        <View style={styles.summaryItem}>
                            <Text style={styles.summaryLabel}>Average Transaction</Text>
                            <Text style={styles.summaryValue}>
                                €
                                {(totals.total / transactions.length || 0).toFixed(2)}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Transactions Table */}
                <View style={styles.table}>
                    <View style={[styles.row, styles.tableHeader]}>
                        <Text style={[styles.headerCell, styles.dateCell]}>Date</Text>
                        <Text style={[styles.headerCell, styles.usernameCell]}>Username</Text>
                        <Text style={[styles.headerCell, styles.ipCell]}>IP Address</Text>
                        <Text style={[styles.headerCell, styles.countryCell]}>Country</Text>
                        <Text style={[styles.headerCell, styles.typeCell]}>Type</Text>
                        <Text style={[styles.headerCell, styles.priceCell]}>Price (EUR)</Text>
                        <Text style={[styles.headerCell, styles.taxCell]}>Tax (EUR)</Text>
                        <Text style={[styles.headerCell, styles.totalCell]}>Total (EUR)</Text>
                    </View>
                    {transactions.map((tx) => {
                        const key = `${tx.date}-${tx.username}-${tx.ipAddress}`;
                        return (
                            <View key={key} style={styles.row}>
                                <Text style={[styles.cell, styles.dateCell]}>{format(new Date(tx.date), 'dd/MM/yyyy')}</Text>
                                <Text style={[styles.cell, styles.usernameCell]}>{tx.username}</Text>
                                <Text style={[styles.cell, styles.ipCell]}>{tx.ipAddress}</Text>
                                <Text style={[styles.cell, styles.countryCell]}>{tx.country}</Text>
                                <Text style={[styles.cell, styles.typeCell, styles.bold]}>
                                    {tx.type === 'membership' ? 'Membership' : 'Announcement'}
                                </Text>
                                <Text style={[styles.cell, styles.priceCell, styles.currency]}>
                                    €
                                    {tx.amount.toFixed(2)}
                                </Text>
                                <Text style={[styles.cell, styles.taxCell, styles.currency]}>
                                    €
                                    {tx.tax.toFixed(2)}
                                </Text>
                                <Text style={[styles.cell, styles.totalCell, styles.currency, styles.bold]}>
                                    €
                                    {tx.total.toFixed(2)}
                                </Text>
                            </View>
                        );
                    })}
                </View>

                {/* Financial Summary */}
                <View style={styles.summary}>
                    <Text style={styles.summaryTitle}>SUMMARY</Text>
                    {[
                        { label: 'Total Price', value: totals.amount },
                        { label: 'Total Tax', value: totals.tax },
                    ].map(({ label, value }) => (
                        <View key={label} style={styles.summaryRow}>
                            <Text style={styles.bold}>{label}</Text>
                            <Text style={[styles.bold, styles.currency]}>
                                €
                                {value.toFixed(2)}
                            </Text>
                        </View>
                    ))}
                    <View style={[styles.summaryRow, styles.totalRow]}>
                        <Text style={[styles.bold, { fontSize: 14, color: '#166534' }]}>
                            Total Revenue
                        </Text>
                        <Text style={[styles.bold, styles.currency, { fontSize: 14, color: '#166534' }]}>
                            €x
                            {totals.total.toFixed(2)}
                        </Text>
                    </View>
                </View>

                {/* Tax Breakdown */}
                <View style={styles.taxSection}>
                    <Text style={styles.taxTitle}>TAX BREAKDOWN BY COUNTRY</Text>
                    <View style={styles.taxTable}>
                        <View style={[styles.row, styles.tableHeader]}>
                            <Text style={styles.headerCell}>Country</Text>
                            <Text style={styles.headerCell}>Price (EUR)</Text>
                            <Text style={styles.headerCell}>Tax (EUR)</Text>
                            <Text style={styles.headerCell}>Total (EUR)</Text>
                        </View>
                        {Object.entries(taxByCountry).map(([country, data]) => (
                            <View key={country} style={styles.row}>
                                <Text style={styles.cell}>{country}</Text>
                                <Text style={[styles.cell, styles.currency]}>
                                    €
                                    {data.amount.toFixed(2)}
                                </Text>
                                <Text style={[styles.cell, styles.currency]}>
                                    €
                                    {data.tax.toFixed(2)}
                                </Text>
                                <Text style={[styles.cell, styles.currency, styles.bold]}>
                                    €
                                    {data.total.toFixed(2)}
                                </Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>
                        Report generated on
                        {' '}
                        {currentDate}
                        {' '}
                        | Total pages: 1
                    </Text>
                </View>
            </Page>
        </Document>
    );
}
