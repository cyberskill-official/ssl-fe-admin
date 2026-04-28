export enum E_VerificationStatus {
    PENDING = 'PENDING',
    APPROVED = 'APPROVED',
}

export interface I_Input_ApproveAgeVerify {
    userId: string;
}

export interface I_Input_RejectAgeVerify {
    userId: string;
    reason: string;
}

export interface I_ProfileCardProps {
    id: string;
    name: string;
    age: number;
    documentType: string;
    idImage: string;
    selfieImage: string;
    submittedAt: string;
    priority?: string;
    status?: string;
    reason?: string;
    userId: string;
    onApprove?: () => void;
    onMessage?: () => void;
    onReject?: () => void;
    loading?: boolean;
}
