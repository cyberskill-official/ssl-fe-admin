export interface I_ModerationAction {
    id: string;
    date: string;
    time: string;
    profileName: string;
    action: 'approved' | 'rejected' | 'suspended' | 'deleted' | 'warned' | 'age_verified' | 'blocked';
    moderator: string;
    reason?: string;
    contentType: 'image' | 'video' | 'profile' | 'age_verification' | 'report';
}

export interface I_DashboardStats {
    pendingImages: number;
    pendingVideos: number;
    flaggedKeywords: number;
    aiAccuracy: number;
    totalPending: number;
}

export interface I_RecentActivity {
    id: string;
    type: string;
    action: string;
    reason: string;
    timestamp: string;
    userId: string;
    username: string;
}

export interface I_MonthlyReport {
    actions: I_ModerationAction[];
    totalDocs: number;
    totalPages: number;
    currentPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
}

export interface I_ActionStats {
    approved: number;
    rejected: number;
    suspended: number;
    deleted: number;
    warned: number;
    blocked: number;
    total: number;
}
