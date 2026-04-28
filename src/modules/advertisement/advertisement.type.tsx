import type { T_Advertisement } from '#shared/graphql';

export interface I_AdvertisementFormRef {
    open: (advertisement?: T_Advertisement) => void;
    close: () => void;
}

export interface I_AdvertisementCardProps {
    ad: T_Advertisement;
    idx: number;
    onEdit?: (ad: T_Advertisement) => void;
    onDelete?: (ad: T_Advertisement) => void;
    onToggleStatus?: (adId: string, currentIsActive: boolean) => void;
    updatingStatusId?: string;
    t: (key: string, params?: Record<string, any>) => string;
}

export interface I_AdvertisementListProps {
    advertisements: T_Advertisement[];
    loading: boolean;
    onEditAdvertisement?: (advertisement: T_Advertisement) => void;
    onCreateAdvertisement?: () => void;
    onDeleteAdvertisement?: (advertisement: T_Advertisement) => void;
    onToggleStatus?: (adId: string, currentIsActive: boolean) => void;
    updatingStatusId?: string;
    totalDocs: number;
    page: number;
    pageSize: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (size: number) => void;
    search: string;
    onSearchChange: (value: string) => void;
    sortField: string;
    sortOrder: 'asc' | 'desc';
    onSortChange: (field: string, order: 'asc' | 'desc') => void;
}
