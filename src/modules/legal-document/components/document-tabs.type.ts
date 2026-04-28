import type { E_LegalDocumentType, T_LegalDocument } from '#shared/graphql';

export interface I_DocumentTabsProps {
    documents: T_LegalDocument[];
    documentsContent: Record<E_LegalDocumentType, string>;
    onEditorChange: (type: E_LegalDocumentType, content: string) => void;
    selectedTab: E_LegalDocumentType;
    onTabChange: (type: E_LegalDocumentType) => void;
}
