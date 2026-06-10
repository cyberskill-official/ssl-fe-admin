import type { F_CatalogueListItemFragment, T_Catalogue } from '#shared/graphql';

export interface I_CatalogueListProps {
    catalogues: F_CatalogueListItemFragment[];
    loading: boolean;
    onEditCatalogue?: (catalogue: F_CatalogueListItemFragment) => void;
    onCreateCatalogue?: () => void;
    onDeleteCatalogue?: (catalogue: F_CatalogueListItemFragment) => void;
    totalDocs?: number;
    page?: number;
    pageSize?: number;
    onPageChange?: (page: number) => void;
    onPageSizeChange?: (pageSize: number) => void;
    search?: string;
    onSearchChange?: (search: string) => void;
    selectedType?: string;
    onTypeChange?: (type: string) => void;
    sortField?: string;
    sortOrder?: 'asc' | 'desc';
    onSortChange?: (field: string, order: 'asc' | 'desc') => void;
    totalPages?: number;
    hasNextPage?: boolean;
    hasPrevPage?: boolean;
    viewMode?: 'grid' | 'table';
    onViewModeChange?: (view: 'grid' | 'table') => void;
}

export interface I_CatalogueFormRef {
    open: (catalogue?: T_Catalogue) => void;
    close: () => void;
}
