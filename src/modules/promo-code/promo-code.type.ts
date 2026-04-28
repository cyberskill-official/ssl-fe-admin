import type { T_PromoCode } from '#shared/graphql';

export enum E_PromoCodeBenefit {
    ONE_MONTH = 'ONE_MONTH',
    TWO_MONTHS = 'TWO_MONTHS',
    THREE_MONTHS = 'THREE_MONTHS',
    SIX_MONTHS = 'SIX_MONTHS',
    TWELVE_MONTHS = 'TWELVE_MONTHS',
    LIFETIME = 'LIFETIME',
}

export interface I_PromoCodeFormData {
    code: string;
    benefit: string;
    isActive: boolean;
    isLimit: boolean;
    usageLimit: number;
    globalUsageLimit: number;
    useCustomExpiry: boolean;
    customExpiryDate: string;
}

export interface I_PromoPreviewProps {
    formData: I_PromoCodeFormData;
    calculatedExpiryDate: string | null;
    t: (key: string, params?: Record<string, any>) => string;
}

export interface I_PromoCodeFormProps {
    promoCode?: T_PromoCode;
    mode: 'create' | 'update';
    onSubmit: (data: Partial<T_PromoCode> & { membershipDurationDays?: number }) => void;
    onCancel: () => void;
    loading?: boolean;
}

export interface I_PromoCodeListProps {
    promoCodes: T_PromoCode[];
    loading?: boolean;
    onEditPromoCode?: (promoCode: T_PromoCode) => void;
    onCreatePromoCode?: () => void;
    onDeletePromoCode?: (promoCode: T_PromoCode) => void;
    onToggleStatus?: (promoCodeId: string, currentIsActive: boolean) => void;
    updatingStatusId?: string;
    totalDocs?: number;
    page?: number;
    pageSize?: number;
    onPageChange?: (page: number) => void;
    onPageSizeChange?: (size: number) => void;
    search?: string;
    onSearchChange?: (value: string) => void;
}

// New types for card grid layout
export interface I_PromoCodeCardProps {
    promoCode: T_PromoCode;
    onEdit: (promoCode: T_PromoCode) => void;
    onDelete: (promoCode: T_PromoCode) => void;
    onToggleStatus: (promoCodeId: string, currentIsActive: boolean) => void;
    updatingStatusId?: string;
    t: (key: string, params?: Record<string, any>) => string;
}

export interface I_PromoCodeGridProps {
    promoCodes: T_PromoCode[];
    loading?: boolean;
    onEditPromoCode?: (promoCode: T_PromoCode) => void;
    onCreatePromoCode?: () => void;
    onDeletePromoCode?: (promoCode: T_PromoCode) => void;
    onToggleStatus?: (promoCodeId: string, currentIsActive: boolean) => void;
    updatingStatusId?: string;
    totalDocs?: number;
    page?: number;
    pageSize?: number;
    onPageChange?: (page: number) => void;
    onPageSizeChange?: (size: number) => void;
    search?: string;
    onSearchChange?: (value: string) => void;
    viewMode?: 'grid' | 'list';
    onViewModeChange?: (mode: 'grid' | 'list') => void;
}
