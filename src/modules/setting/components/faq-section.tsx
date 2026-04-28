import { Loading } from '@cyberskill/shared/react/loading';
import { toast } from '@cyberskill/shared/react/toast';
import { HelpCircle, Plus } from 'lucide-react';
import { useCallback, useMemo, useRef, useState } from 'react';

import type { Input_CreateSetting } from '#shared/graphql';

import { Button } from '#shared/component';
import { E_SettingType } from '#shared/graphql';
import { useTranslate } from '#shared/i18n';

import type { I_FAQEntry } from './faq.type';

import { FAQEntryRow } from './faq-entry-row';
import { useCreateFAQSetting, useGetFAQSetting, useUpdateFAQSetting } from './faq.hook';

function createEntry(i = 0): I_FAQEntry {
    return {
        id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${i}`,
        question: '',
        answer: '',
        isPublished: true,
    };
}

export function FAQSection() {
    const { t } = useTranslate('settings');
    const [touchedRows, setTouchedRows] = useState<Record<string, boolean>>({});
    const rowRefsRef = useRef<Record<string, HTMLDivElement | null>>({});

    const { entries, setEntries, hasExistingData, setHasExistingData, loading: loadingGetSetting } = useGetFAQSetting();
    const { createSetting, loading: loadingCreateSetting } = useCreateFAQSetting();
    const { updateSetting, loading: loadingUpdateSetting } = useUpdateFAQSetting();

    const isLoading = loadingCreateSetting || loadingUpdateSetting;

    const isValid = useMemo(() =>
        entries.length > 0
        && entries.every(
            entry =>
                entry.question.trim()
                && entry.answer.trim(),
        ), [entries]);

    const firstInvalidIndex = useMemo(() =>
        entries.findIndex(
            entry =>
                !entry.question.trim()
                || !entry.answer.trim(),
        ), [entries]);

    const _scrollToFirstInvalid = useCallback(() => {
        if (firstInvalidIndex !== -1) {
            const invalidEntry = entries[firstInvalidIndex];
            if (invalidEntry) {
                const ref = rowRefsRef.current[invalidEntry.id];
                if (ref) {
                    ref.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
        }
    }, [firstInvalidIndex, entries]);

    const _handleCreateEntry = useCallback(() => {
        setEntries((prev) => {
            const newEntries = [...prev, createEntry(prev.length)];
            setTimeout(() => {
                const last = newEntries.at(-1);
                if (last) {
                    const ref = rowRefsRef.current[last.id];
                    if (ref) {
                        const input = ref.querySelector('input');
                        if (input)
                            input.focus();
                    }
                }
            }, 0);
            return newEntries;
        });
    }, [setEntries]);

    const _handleRowTouched = useCallback((id: string) => {
        setTouchedRows(prev => ({ ...prev, [id]: true }));
    }, []);

    const _handleChangeEntry = useCallback((id: string, field: 'question' | 'answer' | 'isPublished', value: string | boolean) => {
        const newEntries = entries.map((entry) => {
            if (entry.id === id) {
                return { ...entry, [field]: value };
            }
            return entry;
        });

        setEntries(newEntries);
        _handleRowTouched(id);

        if (field === 'isPublished') {
            const faqEntries = newEntries
                .filter(e => e.question.trim() && e.answer.trim())
                .map(e => ({
                    question: e.question.trim(),
                    answer: e.answer.trim(),
                    isPublished: e.isPublished,
                }));

            const faqData: Input_CreateSetting = {
                type: E_SettingType.FAQ,
                value: {
                    faq: {
                        entries: faqEntries,
                    },
                },
            };

            if (hasExistingData) {
                updateSetting(faqData).then(() => {
                    setHasExistingData(true);
                });
            }
            else {
                createSetting(faqData).then(() => {
                    setHasExistingData(true);
                });
            }
        }
    }, [entries, setEntries, _handleRowTouched, hasExistingData, updateSetting, createSetting, setHasExistingData]);

    const _handleDeleteEntry = useCallback((id: string) => {
        const newEntries = entries.filter(item => item.id !== id);
        setEntries(newEntries);

        // Auto-persist deletion
        const faqEntries = newEntries
            .filter(e => e.question.trim() && e.answer.trim())
            .map(e => ({
                question: e.question.trim(),
                answer: e.answer.trim(),
                isPublished: e.isPublished,
            }));

        const faqData: Input_CreateSetting = {
            type: E_SettingType.FAQ,
            value: {
                faq: {
                    entries: faqEntries,
                },
            },
        };

        if (hasExistingData) {
            updateSetting(faqData).then(() => {
                setHasExistingData(true);
            });
        }
        else {
            createSetting(faqData).then(() => {
                setHasExistingData(true);
            });
        }
    }, [entries, setEntries, hasExistingData, updateSetting, createSetting, setHasExistingData]);

    const _handleSaveEntries = useCallback(() => {
        if (!isValid) {
            toast.error(t('faq.error-invalid-entries'));
            _scrollToFirstInvalid();
            return;
        }

        const faqEntries = entries
            .filter(e => e.question.trim() && e.answer.trim())
            .map(e => ({
                question: e.question.trim(),
                answer: e.answer.trim(),
                isPublished: e.isPublished,
            }));

        const faqData: Input_CreateSetting = {
            type: E_SettingType.FAQ,
            value: {
                faq: {
                    entries: faqEntries,
                },
            },
        };

        if (hasExistingData) {
            updateSetting(faqData).then(() => {
                setHasExistingData(true);
            });
        }
        else {
            createSetting(faqData).then(() => {
                setHasExistingData(true);
            });
        }
    }, [entries, isValid, t, hasExistingData, createSetting, updateSetting, setHasExistingData, _scrollToFirstInvalid]);

    return (
        <>
            {(loadingGetSetting || isLoading) && <Loading full />}
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 dark:border-slate-700/20 relative">
                <div className="flex items-center justify-between p-8 border-b border-white/20 dark:border-slate-700/20 bg-gradient-to-r from-white/80 to-purple-50/80 dark:from-slate-800/80 dark:to-slate-700/80">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-gradient-to-r from-green-600 to-teal-600 rounded-xl">
                            <HelpCircle className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-green-800 to-teal-800 dark:from-white dark:via-green-200 dark:to-teal-200 bg-clip-text text-transparent">
                            {t('faq.title')}
                        </h3>
                    </div>
                    <Button
                        variant="ghost"
                        className="px-6 py-3 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={_handleSaveEntries}
                        type="button"
                        disabled={isLoading || !isValid}
                    >
                        {isLoading
                            ? (
                                    <div className="flex items-center space-x-2">
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        <span>{t('faq.saving')}</span>
                                    </div>
                                )
                            : (
                                    t('faq.cta-save-changes')
                                )}
                    </Button>
                </div>
                <div className="p-8">
                    <p className="text-gray-600 dark:text-gray-300 mb-6">
                        {t('faq.description')}
                    </p>
                    <div className="space-y-4">
                        {entries.map((entry, entryIndex) => (
                            <div
                                key={entry.id}
                                ref={(el: HTMLDivElement | null) => { rowRefsRef.current[entry.id] = el; }}
                                className="transform hover:scale-[1.01] transition-all duration-300"
                            >
                                <FAQEntryRow
                                    entry={entry}
                                    index={entryIndex}
                                    onChange={(field, value) => _handleChangeEntry(entry.id, field, value)}
                                    onRemove={() => _handleDeleteEntry(entry.id)}
                                    touched={!!touchedRows[entry.id]}
                                    canDelete={entries.length > 1}
                                />
                            </div>
                        ))}
                    </div>
                    <Button
                        variant="outline"
                        className="mt-6 px-6 py-3 border-2 border-green-200 dark:border-green-700 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/50 hover:border-green-300 dark:hover:border-green-600 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105"
                        onClick={_handleCreateEntry}
                        type="button"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        {t('faq.cta-add-entry')}
                    </Button>
                </div>
            </div>
        </>
    );
}
