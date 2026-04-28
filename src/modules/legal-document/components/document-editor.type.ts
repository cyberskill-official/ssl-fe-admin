import type { E_LegalDocumentType } from '#shared/graphql';

export interface I_DocumentEditorProps {
    type: E_LegalDocumentType;
    value: string;
    onChange: (value: string) => void;
    namespace?: string;
}
