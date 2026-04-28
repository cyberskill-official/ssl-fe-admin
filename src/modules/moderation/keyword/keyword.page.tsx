import { log } from '@cyberskill/shared/react/log';
import { toast } from '@cyberskill/shared/react/toast';
import { KeyRound } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import type { Input_CreateKeyword, Input_UpdateKeyword, T_Keyword } from '#shared/graphql';

import { ConfirmDialog } from '#shared/component';
import { useTranslate } from '#shared/i18n';
import { usePortal } from '#shared/portal';

import type { I_KeywordFormRef } from './keyword.type';

import { KeywordForm } from './keyword-form';
import { KeywordList } from './keyword-list';
import { useCreateKeyword, useDeleteKeyword, useGetKeywords, useUpdateKeyword } from './keyword.hook';

export function KeywordsPage() {
    const { t } = useTranslate('moderation');
    const { setHeader } = usePortal();
    const [keywordToDelete, setKeywordToDelete] = useState<T_Keyword | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
    const [page] = useState(1);
    const [pageSize] = useState(10);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const keywordFormRef = useRef<I_KeywordFormRef>(null);
    const filter = debouncedSearch ? { word: debouncedSearch } : undefined;
    const options = { page, limit: pageSize, sort: { occurrences: -1 }, pagination: false };

    const { keywords, loading, refetch } = useGetKeywords(filter, options);
    const { createKeyword, loading: creatingKeyword } = useCreateKeyword();
    const { updateKeyword, loading: updatingKeyword } = useUpdateKeyword();
    const { deleteKeyword } = useDeleteKeyword();

    useEffect(() => {
        setHeader({
            title: t('keyword.title'),
            description: t('keyword.description'),
            icon: KeyRound,
        });
        return () => setHeader(null);
    }, [setHeader, t]);

    const _handleCreateKeyword = useCallback(() => {
        keywordFormRef.current?.open();
    }, []);

    const _handleEditKeyword = useCallback((keyword: T_Keyword) => {
        keywordFormRef.current?.open(keyword);
    }, []);

    const _handleDeleteKeyword = useCallback((keyword: T_Keyword) => {
        setKeywordToDelete(keyword);
    }, []);

    const _handleToggleStatus = useCallback(async (keywordId: string, currentIsActive: boolean) => {
        const keyword = keywords?.find(k => k?.id === keywordId);

        if (!keyword) {
            toast.error(t('keyword.error.keyword-not-found'));
            return;
        }

        setUpdatingStatusId(keywordId);
        try {
            await updateKeyword(
                { id: keywordId },
                {
                    isActive: !currentIsActive,
                },
            );
            await refetch();
        }
        catch (error) {
            log.error('Error updating keyword status:', error);
            toast.error(t('keyword.error-update-status'));
        }
        finally {
            setUpdatingStatusId(null);
        }
    }, [keywords, updateKeyword, refetch, t]);

    const _handleCreateSubmit = useCallback(async (data: Input_CreateKeyword) => {
        await createKeyword(data as Input_CreateKeyword);
        refetch();
    }, [createKeyword, refetch]);

    const _handleUpdateSubmit = useCallback(async (id: string, data: Input_UpdateKeyword) => {
        await updateKeyword({ id }, data);
        refetch();
    }, [updateKeyword, refetch]);

    const _handleConfirmDelete = useCallback(async () => {
        if (!keywordToDelete?.id) {
            toast.error(t('keyword.error.keyword-not-found'));
            return;
        }
        setDeleting(true);
        await deleteKeyword({ id: keywordToDelete.id });
        setDeleting(false);
        setKeywordToDelete(null);
        await refetch();
    }, [keywordToDelete, deleteKeyword, refetch, t]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
        }, 300);

        return () => clearTimeout(timer);
    }, [search]);

    return (
        <div className="container mx-auto space-y-6 flex flex-col bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
            <div className="flex-1 border rounded-lg p-6 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 overflow-auto">
                {/* Search Bar */}
                <div className="mb-6">
                    <div className="relative max-w-md">
                        <input
                            type="text"
                            placeholder={t('keyword.search-placeholder')}
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full px-4 py-3 pl-10 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                        />
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                    </div>
                </div>
                {/* Keyword List */}
                <KeywordList
                    keywords={(keywords?.filter(Boolean) || []) as T_Keyword[]}
                    loading={loading}
                    onEditKeyword={_handleEditKeyword}
                    onCreateKeyword={_handleCreateKeyword}
                    onDeleteKeyword={_handleDeleteKeyword}
                    onToggleStatus={_handleToggleStatus}
                    updatingStatusId={updatingStatusId || undefined}
                />
            </div>
            {/* Form */}
            <KeywordForm
                ref={keywordFormRef}
                onCreateSubmit={_handleCreateSubmit}
                onUpdateSubmit={_handleUpdateSubmit}
                creating={creatingKeyword}
                updating={updatingKeyword}
            />
            {/* Delete Confirmation */}
            <ConfirmDialog
                open={!!keywordToDelete}
                title={t('keyword.delete-keyword')}
                description={(
                    <span>
                        {t('keyword.confirm.delete-keyword')}
                        &nbsp;
                        <b>{keywordToDelete?.word}</b>
                        ?
                    </span>
                )}
                onCancel={() => setKeywordToDelete(null)}
                onConfirm={_handleConfirmDelete}
                loading={deleting}
                confirmLabel={t('keyword.delete')}
                cancelLabel={t('keyword.cancel')}
            />
        </div>
    );
}

export default KeywordsPage;
