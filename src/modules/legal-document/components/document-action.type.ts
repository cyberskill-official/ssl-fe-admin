import type { T_LegalDocument } from '#shared/graphql';

export interface I_DocumentActionsProps {
    onShowPublishConfirm: () => void;
    onShowDraft: () => void;
    onShowHistory: () => void;
    disabledPublish?: boolean;
    currentDocument?: T_LegalDocument | null;
    currentContent?: string;
}
