import type { T_Catalogue } from '#shared/graphql';

export interface I_CatalogueListProps {
    catalogues: T_Catalogue[];
    loading: boolean;
    onEditCatalogue?: (catalogue: T_Catalogue) => void;
    onCreateCatalogue?: () => void;
    onDeleteCatalogue?: (catalogue: T_Catalogue) => void;
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
}

export interface I_CatalogueFormRef {
    open: (catalogue?: T_Catalogue) => void;
    close: () => void;
}
