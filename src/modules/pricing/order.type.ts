export enum E_OrderStatus {
    CREATED = 'CREATED',
    PENDING = 'PENDING',
    PAID = 'PAID',
    FAILED = 'FAILED',
    CANCELLED = 'CANCELLED',
}

export enum E_OrderType {
    SUBSCRIPTION = 'SUBSCRIPTION',
    A_LA_CARTE_EVENT = 'A_LA_CARTE_EVENT',
}

export interface I_Order {
    id: string;
    isDel?: boolean;
    createdAt: string;
    updatedAt: string;
    userId: string;
    user?: {
        id: string;
        username?: string;
        email?: string;
        lastLoginIp?: string;
    };
    amount: number;
    status: E_OrderStatus;
    orderType: E_OrderType;
    paymentTransactionId?: string;
    paymentTransaction?: unknown;
    netvalveMidId?: string;
    meta?: { ip?: string; [key: string]: unknown };
    pricingId?: string;
    pricing?: {
        id: string;
        type?: string;
        price?: number;
        taxRate?: number;
        country?: {
            id: string;
            name: string;
            iso2: string;
            iso3: string;
        };
        currency?: {
            id: string;
            code: string;
            symbol: string;
        };
    };
}

export interface I_Input_QueryOrder {
    id?: string;
    isDel?: boolean;
    createdAt?: string;
    updatedAt?: string;
    userId?: string;
    amount?: number;
    status?: E_OrderStatus;
    orderType?: E_OrderType;
    paymentTransactionId?: string;
    netvalveMidId?: string;
    meta?: { ip?: string; [key: string]: unknown };
    pricingId?: string;
}
