import { toast } from '@cyberskill/shared/react/toast';
import { Coins, Cookie, HistoryIcon, Lock, ScrollText, Shield, Star } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import type { T_LegalDocumentHistory } from '#shared/graphql';

import { Button, Dialog, DialogContent, DialogTitle, Editor, Tabs, TabsContent, TabsList, TabsTrigger } from '#shared/component';
import { E_LegalDocumentStatus, E_LegalDocumentType } from '#shared/graphql';
import { useTranslate } from '#shared/i18n';
import { usePortal } from '#shared/portal';
import { cn } from '#shared/util';

import { DocumentActions } from './components/document-actions';
import { useGetLegalDocuments, usePublishLegalDocument, useRestoreLegalDocument, useSaveDraftLegalDocument } from './legal-document.hook';

const tabIcons = {
    [E_LegalDocumentType.TERM_AND_CONDITION]: Shield,
    [E_LegalDocumentType.PRIVACY_POLICY]: Lock,
    [E_LegalDocumentType.COOKIE_POLICY]: Cookie,
    [E_LegalDocumentType.CODE_OF_ETHICS]: Star,
    [E_LegalDocumentType.TERM_OF_SALE]: Coins,
};

export default function LegalDocs() {
    const { t } = useTranslate('legal-document');
    const { setHeader } = usePortal();
    const [selectedTab, setSelectedTab] = useState<E_LegalDocumentType | undefined>(undefined);
    const [documentsContent, setDocumentsContent] = useState<{ [key in E_LegalDocumentType]?: string }>({});
    const [showHistory, setShowHistory] = useState(false);
    const [selectedCompareVersions, setSelectedCompareVersions] = useState<string[]>([]);
    const lastDocumentIdsRef = useRef<string>('');

    const { legalDocuments, loading: loadingDocuments, refetch } = useGetLegalDocuments({}, {
        populate: ['history.updatedBy'],
    });
    const { publishLegalDocument } = usePublishLegalDocument();
    const { saveDraftLegalDocument } = useSaveDraftLegalDocument();
    const [loadingRestore] = useState(false);
    const { restoreLegalDocument } = useRestoreLegalDocument();

    const currentDocument = legalDocuments?.find(doc => doc.type === selectedTab);
    const filteredHistory = (currentDocument?.history?.filter((h): h is T_LegalDocumentHistory => h !== null && h !== undefined) || [])
        .slice()
        .sort((a, b) => (a.version ?? 0) - (b.version ?? 0));

    const handleVersionCardClick = (version: string) => {
        if (!version) {
            return;
        }

        setSelectedCompareVersions((prev: string[]): string[] => {
            const arr: string[] = prev.filter((v: string): v is string => typeof v === 'string');

            if (arr.includes(version)) {
                return arr.filter((v: string) => v !== version);
            }
            else if (arr.length < 2) {
                return [...arr, version];
            }
            else {
                return [arr[1] ?? version, version];
            }
        });
    };

    const findVersionObj = (ver: string): T_LegalDocumentHistory | null => {
        if (!ver) {
            return null;
        }
        const found = filteredHistory.find(h => h.version?.toString() === ver);

        return found || null;
    };
    const leftVersion = findVersionObj(selectedCompareVersions[0] || '');
    const rightVersion = findVersionObj(selectedCompareVersions[1] || '');
    const canCompare = selectedCompareVersions.length === 2 && selectedCompareVersions[0] !== selectedCompareVersions[1] && leftVersion !== null && rightVersion !== null;

    const _handleEditorChange = useCallback((type: E_LegalDocumentType, content: string) => {
        setDocumentsContent(prev => ({
            ...prev,
            [type]: content,
        }));
    }, []);

    const _handleRestore = useCallback(async (documentId: string, version: number, restoredContent: string, documentType: E_LegalDocumentType) => {
        setDocumentsContent(prev => ({
            ...prev,
            [documentType]: restoredContent,
        }));

        await restoreLegalDocument({ id: documentId, version });
        await refetch();
    }, [restoreLegalDocument, refetch]);

    const _extractTextFromLexical = (lexicalContent: string): string => {
        try {
            const parsed = JSON.parse(lexicalContent);
            const extractText = (node: any): string => {
                if (typeof node === 'string') {
                    return node;
                }
                if (node?.text) {
                    return node.text;
                }
                if (node?.children) {
                    return node.children.map(extractText).join(' ');
                }
                return '';
            };
            return extractText(parsed.root) || '';
        }
        catch {
            return lexicalContent || '';
        }
    };

    const _formatDate = (date: Date | string | undefined) => {
        if (!date) {
            return t('unknown');
        }

        const dateObj = typeof date === 'string' ? new Date(date) : date;

        return `${dateObj.toLocaleDateString()} - ${dateObj.toLocaleTimeString()}`;
    };

    const _formatUsername = (history: T_LegalDocumentHistory) => {
        const user = history.updatedBy;

        if (!user) {
            return t('unknown');
        }

        return `${user.username}`;
    };

    useEffect(() => {
        setHeader({
            title: t('title'),
            description: t('subtitle'),
            icon: ScrollText,
        });

        return () => setHeader(null);
    }, [setHeader, t]);

    useEffect(() => {
        if (legalDocuments && !loadingDocuments) {
            const currentDocumentIds = legalDocuments
                .map(doc => `${doc.id}-${doc.version}`)
                .sort()
                .join('|');

            if (currentDocumentIds !== lastDocumentIdsRef.current) {
                const initialContent: { [key in E_LegalDocumentType]?: string } = {};
                legalDocuments.forEach((doc) => {
                    if (doc.type) {
                        initialContent[doc.type] = doc.content || '';
                    }
                });
                // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect
                setDocumentsContent(initialContent);
                lastDocumentIdsRef.current = currentDocumentIds;
            }
        }
    }, [legalDocuments, loadingDocuments]);

    return (
        <div className="p-6">
            {/* Header */}
            <div className="sticky top-0 z-20 px-8 py-6 flex items-center justify-end backdrop-blur-md bg-white/60 dark:bg-slate-900/60 border-b border-border dark:border-slate-700 shadow-lg rounded-b-3xl" style={{ boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15)' }}>
                <div className="flex gap-3">
                    <DocumentActions
                        onShowDraft={async () => {
                            if (selectedTab) {
                                await saveDraftLegalDocument({ type: selectedTab, content: documentsContent[selectedTab] ?? '' });
                                await refetch();
                                // Clear local state to show fresh data from backend
                                setDocumentsContent((prev) => {
                                    const newState = { ...prev };
                                    delete newState[selectedTab];
                                    return newState;
                                });
                            }
                        }}
                        onShowPublishConfirm={async () => {
                            if (selectedTab) {
                                const contentToPublish: string = documentsContent[selectedTab] || currentDocument?.content || '';

                                if (!contentToPublish || contentToPublish.trim() === '') {
                                    toast.error('Content cannot be empty');
                                    return;
                                }

                                await saveDraftLegalDocument({ type: selectedTab, content: contentToPublish });
                                await publishLegalDocument({ type: selectedTab });
                                await refetch();
                                setDocumentsContent((prev) => {
                                    const newState = { ...prev };
                                    delete newState[selectedTab];
                                    return newState;
                                });
                            }
                        }}
                        onShowHistory={() => setShowHistory(true)}
                        disabledPublish={!currentDocument || currentDocument.status === E_LegalDocumentStatus.PUBLISHED}
                        currentDocument={currentDocument}
                        currentContent={selectedTab ? (documentsContent[selectedTab] || '') : ''}
                    />
                </div>
            </div>
            {/* Tabs & Editor */}
            <div className="p-6">
                <Tabs value={selectedTab ?? ''} onValueChange={v => setSelectedTab(v as E_LegalDocumentType)}>
                    <TabsList className="flex gap-4 justify-center bg-white/40 dark:bg-slate-800/40 rounded-full shadow-lg p-2 backdrop-blur-md border border-border dark:border-slate-700 transition-all duration-500">
                        {Object.values(E_LegalDocumentType).map((type) => {
                            const Icon = tabIcons[type];
                            return (
                                <TabsTrigger
                                    key={type}
                                    value={type}
                                    className="flex items-center p-6 rounded-full text-base font-semibold transition-all duration-300 bg-transparent hover:bg-purple-100/60 dark:hover:bg-purple-900/40 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-purple-400 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-400/80 data-[state=active]:to-blue-400/80 data-[state=active]:text-white data-[state=active]:shadow-xl dark:data-[state=active]:from-purple-700/80 dark:data-[state=active]:to-blue-700/80 dark:data-[state=active]:text-white"
                                    style={{ boxShadow: '0 2px 8px 0 rgba(124, 58, 237, 0.10)' }}
                                >
                                    <Icon className="w-5 h-5 drop-shadow" />
                                    <span className="transition-all duration-300">{t(`documents.${type}.title`)}</span>
                                </TabsTrigger>
                            );
                        })}
                    </TabsList>
                    {Object.values(E_LegalDocumentType).map((type) => {
                        const document = legalDocuments.find(doc => doc.type === type);
                        const hasLocalContent = documentsContent[type] !== undefined;
                        const content = hasLocalContent ? documentsContent[type]! : (document?.content || '');

                        return (
                            <TabsContent key={type} value={type} className="mt-0 transition-all duration-500">
                                <div className="bg-white/90 dark:bg-slate-900/90 rounded-2xl shadow-2xl border border-border dark:border-slate-700 transition-all duration-500">
                                    <Editor
                                        value={content}
                                        onChange={val => _handleEditorChange(type, val)}
                                        showToolbar={true}
                                        className="bg-background dark:bg-slate-800 rounded-lg border border-border dark:border-slate-600 min-h-[400px]"
                                        contentClassName="min-h-[400px] outline-none p-2"
                                        autoFocus={type === selectedTab}
                                    />
                                </div>
                            </TabsContent>
                        );
                    })}
                </Tabs>
            </div>
            {/* Document History Modal */}
            <Dialog open={showHistory} onOpenChange={setShowHistory}>
                <DialogContent
                    className="max-w-[1100px] w-full bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm border border-white/20 dark:border-slate-700/20 px-0 sm:max-w-auto"
                    aria-describedby="document-history-description"
                >
                    <DialogTitle className="text-foreground flex items-center justify-between px-8 pt-8 pb-4 border-b border-gray-100 dark:border-slate-700">
                        <span className="flex items-center gap-2 text-xl font-semibold">
                            <HistoryIcon />
                            {t('history.title')}
                        </span>
                    </DialogTitle>
                    <div id="document-history-description" className="sr-only">
                        {t('history.description')}
                    </div>
                    <div className="mb-6 px-8 pt-6 pb-2">
                        <div className="flex gap-3 overflow-x-auto max-w-[1040px] mx-auto pb-2 mb-6 border-b border-gray-100 dark:border-slate-700 show-scrollbar">
                            {filteredHistory.map((h) => {
                                const isSelected = selectedCompareVersions.includes(h.version?.toString() || '');
                                const isActive = h.version === currentDocument?.version;

                                return (
                                    <div
                                        key={h.version}
                                        className={cn(
                                            'min-w-[260px] max-w-[260px] px-4 py-3 rounded-lg border transition-all duration-200 flex flex-col items-start cursor-pointer relative',
                                            isSelected
                                                ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/30 shadow-lg'
                                                : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700',
                                            selectedCompareVersions.length === 2 && !isSelected && 'opacity-60 pointer-events-none',
                                        )}
                                        aria-pressed={isSelected}
                                        onClick={() => handleVersionCardClick(h.version?.toString() || '')}
                                    >
                                        <span className="text-xs text-muted-foreground mb-1">
                                            {t('history.version')}
                                            {' '}
                                            {h.version}
                                        </span>
                                        <span className="text-sm font-medium text-foreground">{_formatDate(h.updatedAt)}</span>
                                        <span className="text-xs text-muted-foreground mb-2">
                                            {t('history.edited-by')}
                                            {' '}
                                            {_formatUsername(h)}
                                        </span>
                                        <div className="flex items-center gap-2 mt-auto">
                                            {isActive && (
                                                <span className="px-2 py-0.5 text-xs font-medium text-green-800 dark:text-green-200 bg-green-100 dark:bg-green-900/50 rounded-full">
                                                    {t('status.active')}
                                                </span>
                                            )}
                                            {!isActive && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (currentDocument?.id && h.version !== undefined) {
                                                            const restoredContentValue = h.content || '';
                                                            _handleRestore(
                                                                currentDocument.id,
                                                                Number(h.version),
                                                                restoredContentValue,
                                                                currentDocument.type!,
                                                            );
                                                        }
                                                    }}
                                                    disabled={loadingRestore || !currentDocument?.id}
                                                    className="px-2 py-0.5 text-xs font-semibold text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 border-purple-200 dark:border-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/50 rounded-full shadow-sm"
                                                >
                                                    {loadingRestore ? t('actions.restoring') : t('actions.restore')}
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        {/* Side-by-side comparison */}
                        {canCompare
                            ? (
                                    <div className="flex gap-6 mt-4">
                                        {/* Left Version */}
                                        <div className="flex-1 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-600 rounded-lg p-4">
                                            <div className="mb-2 flex items-center gap-2">
                                                <span className="text-xs text-muted-foreground">{t('compare.left-version')}</span>
                                                <span className="text-xs font-semibold text-purple-700 dark:text-purple-300">{leftVersion?.version}</span>
                                            </div>
                                            <div className="text-sm font-mono leading-relaxed whitespace-pre-wrap border-t pt-2 mt-2">
                                                {_extractTextFromLexical(leftVersion?.content || '')}
                                            </div>
                                        </div>
                                        {/* Right Version */}
                                        <div className="flex-1 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-600 rounded-lg p-4">
                                            <div className="mb-2 flex items-center gap-2">
                                                <span className="text-xs text-muted-foreground">{t('compare.right-version')}</span>
                                                <span className="text-xs font-semibold text-purple-700 dark:text-purple-300">{rightVersion?.version}</span>
                                            </div>
                                            <div className="text-sm font-mono leading-relaxed whitespace-pre-wrap border-t pt-2 mt-2">
                                                {_extractTextFromLexical(rightVersion?.content || '')}
                                            </div>
                                        </div>
                                    </div>
                                )
                            : (
                                    <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg text-center text-sm text-yellow-800 dark:text-yellow-200 mt-4">
                                        {selectedCompareVersions.length < 2
                                            ? t('compare.select-both-versions')
                                            : t('compare.select-different-versions')}
                                    </div>
                                )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
