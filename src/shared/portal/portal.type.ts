export interface I_HeaderContent {
    title: string;
    description?: string;
    icon?: React.ComponentType<{ className?: string }>;
}

export interface I_PortalContext {
    setHeader: (content: I_HeaderContent | null) => void;
}
