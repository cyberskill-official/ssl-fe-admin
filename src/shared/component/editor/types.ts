import type { LexicalEditor } from 'lexical';

export interface EditorProps {
    value?: string;
    onChange?: (value: string) => void;
    placeholder?: string;
    editable?: boolean;
    showToolbar?: boolean;
    className?: string;
    contentClassName?: string;
    namespace?: string;
    onError?: (error: Error, editor: LexicalEditor) => void;
    autoFocus?: boolean;
}

export interface OnChangePluginProps {
    onChange: (value: string) => void;
}

export interface InitialValuePluginProps {
    value?: string;
}

export interface LoadStatePluginProps {
    editable?: boolean;
}
