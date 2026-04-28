import type { E_KeywordCategory, T_Keyword } from '#shared/graphql';
import type { E_FormMode } from '#shared/typescript';

export interface I_KeywordFormRef {
    open: (keyword?: T_Keyword) => void;
    close: () => void;
}

export interface I_KeywordFormProps {
    keyword?: T_Keyword;
    mode: E_FormMode;
    onSubmit: (data: Partial<T_Keyword>) => void;
    loading?: boolean;
}

export interface I_KeywordFormData {
    word: string;
    category: E_KeywordCategory;
    isActive: boolean;
}

export interface I_KeywordListProps {
    keywords: T_Keyword[];
    loading?: boolean;
    onEditKeyword?: (keyword: T_Keyword) => void;
    onCreateKeyword?: () => void;
    onDeleteKeyword?: (keyword: T_Keyword) => void;
    onToggleStatus?: (keywordId: string, currentIsActive: boolean) => void;
    updatingStatusId?: string;
    totalDocs?: number;
    page?: number;
    pageSize?: number;
    onPageChange?: (page: number) => void;
    onPageSizeChange?: (size: number) => void;
    search?: string;
    onSearchChange?: (value: string) => void;
}
