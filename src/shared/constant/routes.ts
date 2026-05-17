import {
    BarChart3,
    BrainCircuit,
    ClipboardList,
    DollarSign,
    FileText,
    Flag,
    Globe,
    Image,
    KeyRound,
    MessageSquare,
    ReceiptText,
    ScrollText,
    Send,
    Settings,
    Shield,
    Tag,
    UserCheck,
    Zap,
} from 'lucide-react';

const BASE = {
    AUTH: '/auth',
    ADMIN: '/',
};

export const ROUTES = {
    ERROR: {
        NOT_FOUND: '/not-found',
        FORBIDDEN: '/forbidden',
    },
    AUTH: {
        LOGIN: `${BASE.AUTH}/login`,
    },
    ADMIN: {
        BASE: BASE.ADMIN,
    },
};

export const SIDEBAR_ITEMS = [
    {
        category: 'MAIN',
        items: [
            {
                icon: BarChart3,
                label: 'Dashboard',
                path: BASE.ADMIN,
            },
            {
                icon: MessageSquare,
                label: 'Messages',
                path: `/message`,
            },
            {
                icon: Zap,
                label: 'Push Chat',
                path: `/push-chat`,
            },
        ],
    },
    {
        category: 'DESTINATION',
        items: [
            {
                icon: Globe,
                label: 'Clubs & Resorts',
                path: `${BASE.ADMIN}destination`,
                status: 'DONE',
            },
        ],
    },
    {
        category: 'CONTENT',
        items: [
            {
                icon: FileText,
                label: 'Blogs & Podcasts',
                path: `${BASE.ADMIN}blog`,
                status: 'DONE',
            },
            {
                icon: Tag,
                label: 'Tags',
                path: `${BASE.ADMIN}tag`,
                status: 'DONE',
            },
            {
                icon: Tag,
                label: 'Catalogue',
                path: `${BASE.ADMIN}catalogue`,
                status: 'DONE',
            },
        ],
    },
    {
        category: 'ADVERTISEMENTS',
        items: [
            {
                icon: Image,
                label: 'Advertisements',
                path: `${BASE.ADMIN}advertisement`,
                status: 'DONE',
            },
        ],
    },
    {
        category: 'MARKETING',
        items: [
            // {
            //     icon: Mail,
            //     label: 'Email Campaigns',
            //     path: `${BASE.ADMIN}email-campaign`,
            // },
            {
                icon: Tag,
                label: 'Promo Codes',
                path: `${BASE.ADMIN}promo-code`,
                status: 'DONE',
            },
            {
                icon: DollarSign,
                label: 'Pricing',
                path: `${BASE.ADMIN}pricing`,
                status: 'DONE',
            },
            {
                icon: ReceiptText,
                label: 'Payments',
                path: `${BASE.ADMIN}payments`,
                status: 'DONE',
            },
        ],
    },
    {
        category: 'MODERATION',
        items: [
            {
                icon: Shield,
                label: 'Moderation Dashboard',
                path: `${BASE.ADMIN}moderation/dashboard`,
            },
            {
                icon: UserCheck,
                label: 'Age Verification',
                path: `${BASE.ADMIN}moderation/age-verification`,
                status: 'DONE',
            },
            {
                icon: Image,
                label: 'Pictures & Video',
                path: `${BASE.ADMIN}moderation/media`,
                status: 'DONE',
            },
            {
                icon: Flag,
                label: 'Reports',
                path: `${BASE.ADMIN}moderation/report`,
            },
            {
                icon: KeyRound,
                label: 'Keywords',
                path: `${BASE.ADMIN}moderation/keyword`,
                status: 'DONE',
            },
            {
                icon: ClipboardList,
                label: 'Logs',
                path: `${BASE.ADMIN}moderation/log`,
            },
            {
                icon: BrainCircuit,
                label: 'AI Moderation',
                path: `${BASE.ADMIN}moderation/ai`,
            },
        ],
    },
    {
        category: 'SYSTEM',
        items: [
            {
                icon: Settings,
                label: 'Settings',
                path: `${BASE.ADMIN}settings`,
            },
            {
                icon: Shield,
                label: 'Admin Control',
                path: `${BASE.ADMIN}admin-control`,
                status: 'DONE',
            },
            {
                icon: ScrollText,
                label: 'Legal Docs',
                path: `${BASE.ADMIN}legal-document`,
                status: 'DONE',
            },
            {
                icon: Send,
                label: 'Auto Email',
                path: `${BASE.ADMIN}auto-email`,
            },
        ],
    },
];

export const PRIVATE_ROUTES = SIDEBAR_ITEMS.flatMap(category =>
    category.items.map(item => item.path),
);

export const PUBLIC_ROUTES = [
    ROUTES.AUTH.LOGIN,
    ROUTES.ERROR.FORBIDDEN,
    ROUTES.ERROR.NOT_FOUND,
];
