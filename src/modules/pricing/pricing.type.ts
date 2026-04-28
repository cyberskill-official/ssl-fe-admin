import type { T_Country, T_Pricing } from '#shared/graphql';
import type { E_FormMode } from '#shared/typescript';

export interface I_Transaction {
    date: string;
    country: string;
    amount: number;
    tax: number;
    total: number;
    username: string;
    ipAddress: string;
    type: 'membership' | 'announcement';
}

export interface I_ReportFormProps {
    month: string;
    year: string;
    transactions: Array<{
        id: string;
        date: string;
        country: string;
        amount: number;
        tax: number;
        total: number;
        username: string;
        ipAddress: string;
        type: 'membership' | 'announcement';
    }>;
}

export interface I_PriceFormProps {
    price?: T_Pricing;
    mode: E_FormMode;
    onSubmit: (data: Partial<T_Pricing>) => void;
}

export interface I_PriceFormData {
    type: string;
    countryId: string;
    stateId?: string;
    currencyId: string;
    membershipPrice: string;
    announcementPrice: string;
    taxRate: string;
    isActive: boolean;
}

export interface I_PriceFormRef {
    open: (price?: T_Pricing) => void;
    close: () => void;
}

export interface I_PricingListProps {
    prices: T_Pricing[];
    loading?: boolean;
    onEditPrice?: (price: T_Pricing) => void;
    onCreatePrice?: () => void;
    onDeletePrice?: (price: T_Pricing) => void;
    onToggleStatus?: (id: string, isActive: boolean) => void;
    updatingStatusId?: string;
    totalDocs?: number;
    page?: number;
    pageSize?: number;
    onPageChange?: (page: number) => void;
    onPageSizeChange?: (pageSize: number) => void;
    search?: string;
    onSearchChange?: (search: string) => void;
    selectedType?: string;
    onTypeChange?: (type: string) => void;
    selectedStatus?: string;
    onStatusChange?: (status: string) => void;
    countries: T_Country[];
}
