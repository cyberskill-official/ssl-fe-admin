import type { T_User } from '#shared/graphql';

import type { I_MediaModerationResult } from '../ai/ai.type';

export enum E_ModerationLogAction {
    DELETE = 'DELETE',
    SUSPEND = 'SUSPEND',
    APPROVE = 'APPROVE',
    WARN = 'WARN',
    DEACTIVATE = 'DEACTIVATE',
    CLOSE = 'CLOSE',
}

export interface I_ModerationMedia {
    id: string;
    type: string;
    url: string;
    status: string;
    uploadedById?: string;
    uploadedBy?: T_User;
}

export interface I_ModerationLog {
    id: string;
    isDel: boolean;
    createdAt: string;
    updatedAt: string;
    action: E_ModerationLogAction;
    userId: string;
    user: T_User;
    targetUserId?: string;
    targetUser?: T_User;
    moderationMediaId: string;
    moderationMedia: I_ModerationMedia;
    aiResult: I_MediaModerationResult;
}

export interface I_Input_QueryModerationLog {
    id?: string;
    isDel?: boolean;
    createdAt?: string;
    updatedAt?: string;
    action?: E_ModerationLogAction;
    userId?: string;
    targetUserId?: string;
    moderationMediaId?: string;
}

export interface I_Input_CreateModerationLog {
    action: E_ModerationLogAction;
    userId?: string;
    targetUserId?: string;
    moderationMediaId?: string;
}

export interface I_Input_UpdateModerationLog {
    isDel?: boolean;
    action?: E_ModerationLogAction;
    userId?: string;
    targetUserId?: string;
    moderationMediaId?: string;
}

export interface I_ModerationLogResponse {
    success: boolean;
    message: string;
    result: I_ModerationLog;
}

export interface I_ModerationLogsPaginated {
    docs: I_ModerationLog[];
    totalDocs: number;
    limit: number;
    hasPrevPage: boolean;
    hasNextPage: boolean;
    page: number;
    totalPages: number;
    offset: number;
    prevPage: number;
    nextPage: number;
    pagingCounter: number;
    meta: any;
}

export interface I_ModerationLogsResponse {
    success: boolean;
    message: string;
    result: I_ModerationLogsPaginated;
}

export interface I_ModerationLogListProps {
    logs: I_ModerationLog[];
    loading: boolean;
    totalDocs: number;
    page: number;
    totalPages: number;
    limit: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    onPageChange: (page: number) => void;
    onLimitChange: (limit: number) => void;
    onDeleteLog?: (log: I_ModerationLog) => void;
    onEditLog?: (log: I_ModerationLog) => void;
    onRestoreLog?: (log: I_ModerationLog) => void;
}
