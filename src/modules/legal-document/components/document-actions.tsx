import { History, Save } from 'lucide-react';

import { useTranslate } from '#shared/i18n';
import { cn } from '#shared/util';

import type { I_DocumentActionsProps } from './document-action.type';

export function DocumentActions({
    onShowPublishConfirm,
    onShowDraft,
    onShowHistory,
    disabledPublish,
    currentDocument,
    currentContent,
}: I_DocumentActionsProps) {
    const { t } = useTranslate('legal-document');

    const hasContentChanged = currentDocument?.content !== currentContent;
    const disabledDraft = !hasContentChanged;

    return (
        <div className="flex items-center space-x-4">
            <button
                type="button"
                onClick={onShowHistory}
                className="flex items-center px-4 py-2 text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-slate-700 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors duration-200"
            >
                <History size={18} className="mr-2" />
                {t('actions.history')}
            </button>

            <button
                type="button"
                onClick={onShowPublishConfirm}
                disabled={disabledPublish}
                className={cn(
                    'flex items-center px-4 py-2 rounded-lg transition-colors duration-200 cursor-pointer',
                    {
                        'bg-gray-400 text-gray-200 cursor-not-allowed': disabledPublish,
                        'bg-green-600 dark:bg-green-500 text-white hover:bg-green-700 dark:hover:bg-green-600': !disabledPublish,
                    },
                )}
            >
                <Save size={18} className="mr-2" />
                {t('actions.publish')}
            </button>

            <button
                type="button"
                onClick={onShowDraft}
                disabled={disabledDraft}
                className={cn(
                    'flex items-center px-4 py-2 rounded-lg transition-colors duration-200 cursor-pointer',
                    {
                        'bg-gray-400 text-gray-200 cursor-not-allowed': disabledDraft,
                        'bg-purple-600 dark:bg-purple-500 text-white hover:bg-purple-700 dark:hover:bg-purple-600': !disabledDraft,
                    },
                )}
            >
                <Save size={18} className="mr-2" />
                {t('actions.draft')}
            </button>
        </div>
    );
}
