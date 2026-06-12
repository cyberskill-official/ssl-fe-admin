import { Editor } from '#shared/component/editor';
import { useTranslate } from '#shared/i18n';

import type { I_DocumentEditorProps } from './document-editor.type';

export function DocumentEditor({ type, value, onChange }: I_DocumentEditorProps) {
    const { t } = useTranslate();

    return (
        <Editor
            value={value}
            onChange={onChange}
            placeholder={t(`legal-document.documents.${type}.placeholder`)}
            showToolbar={true}
            className="border border-gray-200 dark:border-slate-600 rounded-lg p-4 bg-gray-50 dark:bg-slate-800"
            contentClassName="min-h-[400px] outline-none p-2"
            autoFocus={false}
        />
    );
}
