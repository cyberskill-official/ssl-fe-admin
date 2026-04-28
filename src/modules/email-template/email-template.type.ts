import type { I_GenericDocument } from '@cyberskill/shared/node/mongo';

export interface I_EmailTemplate extends I_GenericDocument {
    templateKey?: string;
    name?: string;
    subject?: string;
    content?: string;
    variables?: Array<string | null> | null;
}

// Editdata structure type
export interface EditorNode {
    text?: string;
    children?: EditorNode[];
    type?: string;
    format?: number;
    indent?: number;
    version?: number;
}

export interface EditorData {
    root: {
        children: EditorNode[];
        direction: string | null;
        format: string;
        indent: number;
        type: string;
        version: number;
    };
}

// Constants
export const EMAIL_TEMPLATE_CONSTANTS = {
    CONTENT_SNIPPET_LENGTH: 40,
    MIN_EDITOR_HEIGHT: 300,
    MAX_TEMPLATE_NAME_WIDTH: 120,
    DEBOUNCE_DELAY: 500,
} as const;
