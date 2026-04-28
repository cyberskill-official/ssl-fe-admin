import { Trash2 } from 'lucide-react';

import { Button, Input, Textarea } from '#shared/component';
import { useTranslate } from '#shared/i18n';
import { cn } from '#shared/util';

import type { I_FAQEntryRowProps } from './faq.type';

export function FAQEntryRow({
    entry,
    index,
    onChange,
    onRemove,
    touched,
    canDelete,
}: I_FAQEntryRowProps) {
    const { t } = useTranslate('settings');

    const isQuestionInvalid = touched && !entry.question.trim();
    const isAnswerInvalid = touched && !entry.answer.trim();

    return (
        <div className={cn(
            'bg-white/60 dark:bg-slate-700/60 rounded-xl p-6 shadow border border-gray-200 dark:border-slate-600 hover:shadow-lg transition-all duration-300',
            (isQuestionInvalid || isAnswerInvalid) && 'ring-2 ring-red-400 dark:ring-red-500',
        )}
        >
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold">
                        {index + 1}
                    </div>
                    <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">
                        {t('faq.entry')}
                        {' '}
                        #
                        {index + 1}
                    </span>
                </div>
                <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {t('faq.published')}
                        </span>
                        <div className="relative inline-flex h-6 w-11 items-center rounded-full">
                            <Input
                                type="checkbox"
                                checked={entry.isPublished}
                                onChange={e => onChange('isPublished', e.target.checked)}
                                className="sr-only"
                            />
                            <span
                                className={cn(
                                    'block h-6 w-11 bg-gray-200 dark:bg-slate-600 rounded-full transition-colors duration-200',
                                    entry.isPublished && 'bg-green-600 dark:bg-green-500',
                                )}
                            />
                            <span
                                className={cn(
                                    'absolute left-1 h-4 w-4 bg-white dark:bg-slate-200 rounded-full transition-transform duration-200',
                                    entry.isPublished && 'translate-x-5',
                                )}
                            />
                        </div>
                    </label>
                    {canDelete && (
                        <Button
                            variant="ghost"
                            onClick={onRemove}
                            className="text-red-600 hover:text-red-900 dark:hover:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg p-2 transition-all duration-300"
                        >
                            <Trash2 size={18} />
                        </Button>
                    )}
                </div>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('faq.question')}
                        {' '}
                        <span className="text-red-500">*</span>
                    </label>
                    <Input
                        type="text"
                        value={entry.question}
                        onChange={e => onChange('question', e.target.value)}
                        placeholder={t('faq.question-placeholder')}
                        className={cn(
                            'w-full px-4 py-2 bg-white dark:bg-slate-800 border rounded-lg focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 transition-all duration-200',
                            isQuestionInvalid
                                ? 'border-red-500 dark:border-red-400'
                                : 'border-gray-300 dark:border-slate-600',
                        )}
                    />
                    {isQuestionInvalid && (
                        <p className="text-red-500 text-sm mt-1">{t('faq.question-required')}</p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('faq.answer')}
                        {' '}
                        <span className="text-red-500">*</span>
                    </label>
                    <Textarea
                        value={entry.answer}
                        onChange={e => onChange('answer', e.target.value)}
                        placeholder={t('faq.answer-placeholder')}
                        rows={4}
                        className={cn(
                            'w-full px-4 py-2 bg-white dark:bg-slate-800 border rounded-lg focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 transition-all duration-200 resize-none',
                            isAnswerInvalid
                                ? 'border-red-500 dark:border-red-400'
                                : 'border-gray-300 dark:border-slate-600',
                        )}
                    />
                    {isAnswerInvalid && (
                        <p className="text-red-500 text-sm mt-1">{t('faq.answer-required')}</p>
                    )}
                </div>
            </div>
        </div>
    );
}
