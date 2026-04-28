import type { T_PushChatMessage } from '#shared/graphql';

export enum E_PushChatAudience {
    ALL = 'ALL',
    MEMBERS = 'MEMBERS',
    NON_MEMBERS = 'NON_MEMBERS',
    AGE_VERIFIED = 'AGE_VERIFIED',
    NOT_AGE_VERIFIED = 'NOT_AGE_VERIFIED',
}

export interface I_PushChatMessageCardProps {
    message: T_PushChatMessage;
    idx: number;
    onDelete?: (message: T_PushChatMessage) => void;
    t: (key: string, params?: Record<string, any>) => string;
}
