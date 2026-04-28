export interface I_Conversation {
    id: number;
    name: string;
    avatar: string;
    lastMessage: string;
    timestamp: Date;
    unread: number;
    online: boolean;
    email?: string;
    phone?: string;
    location?: string;
    joined?: string;
    role: string;
}
export interface I_UserProfileProps {
    onClose: () => void;
    user: {
        name: string;
        email?: string;
        phone?: string;
        location?: string;
        joined?: string;
        avatar: string;
        role: string;
    };
}

export interface I_ConversationListProps {
    selectedId: number | null;
    onSelect: (conversation: I_Conversation) => void;
}

export interface I_Message {
    id: number;
    sender: 'me' | 'them';
    content: string;
    timestamp: Date;
    conversationId: number;
}

export interface I_MessageThreadProps {
    conversationId: number;
}

export enum E_ConversationStatus {
    OPEN = 'OPEN',
    IN_PROGRESS = 'IN_PROGRESS',
    RESOLVED = 'RESOLVED',
    ARCHIVED = 'ARCHIVED',
}

export enum E_Priority {
    HIGH = 'HIGH',
    MEDIUM = 'MEDIUM',
    LOW = 'LOW',
}
