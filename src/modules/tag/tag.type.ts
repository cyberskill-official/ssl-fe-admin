import type { T_Omit_Create } from '@cyberskill/shared/node/mongo';

import type { E_TagType, F_TagListItemFragment, T_Tag } from '#shared/graphql';
import type { E_FormMode } from '#shared/typescript';

export interface I_TagListProps {
    tags: F_TagListItemFragment[];
    loading?: boolean;
    onEditTag?: (tag: F_TagListItemFragment) => void;
    onCreateTag?: () => void;
    onDeleteTag?: (tag: F_TagListItemFragment) => void;
    onToggleStatus?: (tagId: string, currentIsActive: boolean) => void;
    updatingStatusId?: string;
    totalDocs?: number;
    page?: number;
    pageSize?: number;
    onPageChange?: (page: number) => void;
    onPageSizeChange?: (size: number) => void;
    search?: string;
    onSearchChange?: (value: string) => void;
    selectedType?: E_TagType | 'ALL';
    onTypeChange?: (type: E_TagType | 'ALL') => void;
    sortField?: 'name' | 'type' | 'usageCount' | 'createdAt';
    sortOrder?: 'asc' | 'desc';
    onSortChange?: (field: 'name' | 'type' | 'usageCount' | 'createdAt', order: 'asc' | 'desc') => void;
    showCustomOnly?: boolean;
    onShowCustomOnlyChange?: (value: boolean) => void;
    showLowUsage?: boolean;
    onShowLowUsageChange?: (value: boolean) => void;
    viewMode?: 'grid' | 'table';
    onViewModeChange?: (view: 'grid' | 'table') => void;
    totalPages?: number;
    hasNextPage?: boolean;
    hasPrevPage?: boolean;
}

export interface I_TagFormRef {
    open: (tag?: T_Tag) => void;
    close: () => void;
}

export interface I_TagFormProps {
    tag?: T_Tag;
    mode: E_FormMode;
    onSubmit: (data: Partial<T_Tag>) => void;
    loading?: boolean;
}

export type T_Tag_Populate = 'createdBy';

export interface I_Input_CreateTag extends Omit<T_Tag, T_Omit_Create | T_Tag_Populate> {
    name: string;
    type: E_TagType;
    isCustom?: boolean;
    createdById?: string;
}

export interface I_TagFormData {
    name: string;
    type: E_TagType;
    isCustom: boolean;
}

export interface I_TagFilter {
    search?: string;
    type?: E_TagType | 'ALL';
    isActive?: boolean;
}
