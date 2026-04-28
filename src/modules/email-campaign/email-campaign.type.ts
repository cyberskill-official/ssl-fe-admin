import type { E_UserGroup, T_EmailCampaign } from '#shared/graphql';

export interface I_EmailCampaignFormData {
    name: string;
    subject: string;
    senderName: string;
    senderEmail: string;
    content: string;
    target: E_UserGroup;
    isScheduled: boolean;
    scheduledDate?: Date;
    scheduledTime: string;
}

export interface I_EmailCampaignFormProps {
    emailCampaign?: T_EmailCampaign;
    mode: 'create' | 'update';
    onSubmit: (data: Partial<T_EmailCampaign>) => void;
    onCancel: () => void;
    loading?: boolean;
}

export interface I_EmailCampaignListProps {
    emailCampaigns: T_EmailCampaign[];
    loading?: boolean;
    onEditEmailCampaign?: (emailCampaign: T_EmailCampaign) => void;
    onCreateEmailCampaign?: () => void;
    onDeleteEmailCampaign?: (emailCampaign: T_EmailCampaign) => void;
    onToggleStatus?: (
        emailCampaignId: string,
        currentIsScheduled: boolean,
    ) => void;
    updatingStatusId?: string;
    totalDocs?: number;
    page?: number;
    pageSize?: number;
    onPageChange?: (page: number) => void;
    onPageSizeChange?: (size: number) => void;
    search?: string;
    onSearchChange?: (value: string) => void;
    selectedStatus?: 'all' | 'sent' | 'scheduled' | 'draft';
    onStatusFilterChange?: (
        status: 'all' | 'sent' | 'scheduled' | 'draft',
    ) => void;
}

export interface I_EmailCampaignPreviewProps {
    formData: I_EmailCampaignFormData;
    t: (key: string, params?: Record<string, any>) => string;
}
