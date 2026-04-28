import { Plus, Save, Send, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import {
    Button,
    ConfirmDialog,
    Editor,
    Input,
    Tabs,
    TabsContent,
    TabsList,
} from '#shared/component';
import { useTranslate } from '#shared/i18n';
import { usePortal } from '#shared/portal';
import { cn } from '#shared/util';

import type {
    EditorData,
    EditorNode,
    I_EmailTemplate,
} from './email-template.type';

import { useAutoEmail } from './email-template.hook';
import { EMAIL_TEMPLATE_CONSTANTS } from './email-template.type';

const HTML_TAG_RE = /<[^>]*>/g;

export default function EmailTemplate() {
    const {
        selectedTemplate,
        editedContent,
        editedSubject,
        templates,
        templatesLoading,
        createLoading,
        updateLoading,
        deleteLoading,
        _handleTemplateSelect,
        setSelectedTemplate,
        setEditedContent,
        setEditedSubject,
        createTemplate,
        deleteTemplate,
        saveCurrentTemplate,
    } = useAutoEmail();
    const { t } = useTranslate('email');
    const { setHeader } = usePortal();
    const [tab, setTab] = useState('edit');
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newTemplateName, setNewTemplateName] = useState('');
    const [newTemplateKey, setNewTemplateKey] = useState('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    useEffect(() => {
        setHeader({
            title: t('title'),
            description: t('description'),
            icon: Send,
        });
        return () => setHeader(null);
    }, [setHeader, t]);

    const handleSelect = useCallback(
        (tpl: I_EmailTemplate) => {
            _handleTemplateSelect(tpl);
            setTab('edit');
            setShowCreateForm(false);
        },
        [_handleTemplateSelect],
    );

    const handleSave = useCallback(() => {
        if (selectedTemplate) {
            saveCurrentTemplate();
        }
    }, [selectedTemplate, saveCurrentTemplate]);

    const handleCreateNew = useCallback(() => {
        setShowCreateForm(true);
        setSelectedTemplate(null);
        setNewTemplateName('');
        setNewTemplateKey('');
        setEditedContent('');
        setEditedSubject('');
        setTab('edit');
    }, [setSelectedTemplate, setEditedContent, setEditedSubject]);

    const handleCreateSubmit = useCallback(async () => {
        try {
            await createTemplate({
                name: newTemplateName,
                templateKey: newTemplateKey,
                subject: editedSubject,
                content: editedContent,
            });
            // Only handle UI cleanup - API success/error is handled in hook
            setShowCreateForm(false);
            setNewTemplateName('');
            setNewTemplateKey('');
        }
        catch (error) {
            // Hook already handles validation and error toasts
            console.error('Failed to create template:', error);
        }
    }, [
        newTemplateName,
        newTemplateKey,
        editedSubject,
        editedContent,
        createTemplate,
    ]);

    const handleDelete = useCallback(async () => {
        if (!selectedTemplate) {
            return;
        }
        setShowDeleteConfirm(true);
    }, [selectedTemplate]);

    const confirmDelete = useCallback(async () => {
        if (!selectedTemplate) {
            return;
        }

        try {
            await deleteTemplate({ id: selectedTemplate.id });
            setShowDeleteConfirm(false);
        }
        catch (error) {
            console.error('Failed to delete template:', error);
        }
    }, [selectedTemplate, deleteTemplate]);

    function getContentSnippet(content: string | undefined): string {
        if (!content)
            return '';

        let textContent = content;
        try {
            const parsed: EditorData = JSON.parse(content);
            if (parsed.root && parsed.root.children) {
                textContent = extractTextFromEditorJson(parsed);
            }
        }
        catch {
            textContent = content.replace(HTML_TAG_RE, '');
        }

        return textContent.length > EMAIL_TEMPLATE_CONSTANTS.CONTENT_SNIPPET_LENGTH
            ? `${textContent.slice(
                0,
                EMAIL_TEMPLATE_CONSTANTS.CONTENT_SNIPPET_LENGTH,
            )}...`
            : textContent;
    }

    function extractTextFromEditorJson(editorData: EditorData): string {
        if (!editorData || !editorData.root || !editorData.root.children) {
            return '';
        }

        function extractFromNode(node: EditorNode): string {
            if (!node) {
                return '';
            }

            if (node.text) {
                return node.text;
            }

            if (node.children && Array.isArray(node.children)) {
                return node.children.map(extractFromNode).join(' ');
            }

            return '';
        }

        return editorData.root.children.map(extractFromNode).join(' ').trim();
    }

    return (
        <div className="max-w-6xl mx-auto p-6 animate-in fade-in-50 duration-700">
            <div className="bg-gradient-to-br from-gray-200 to-slate-400 dark:from-slate-800 dark:to-slate-900 rounded-3xl shadow-2xl border border-slate-200/60 dark:border-slate-700/60 flex flex-col lg:flex-row overflow-hidden backdrop-blur-sm transform transition-all duration-500 hover:shadow-3xl hover:scale-[1.002]">
                {/* Sidebar */}
                <aside className="w-full lg:w-72 bg-gradient-to-b from-slate-50/80 to-slate-100/80 dark:from-slate-700/80 dark:to-slate-800/80 border-r border-slate-200/60 dark:border-slate-600/60 flex flex-col min-h-[600px] backdrop-blur-sm">
                    <div className="sticky top-0 z-10 bg-gradient-to-r from-slate-100/90 to-slate-50/90 dark:from-slate-700/90 dark:to-slate-800/90 px-6 py-4 border-b border-slate-200/60 dark:border-slate-600/60 flex items-center justify-end backdrop-blur-md">
                        <Button
                            size="icon"
                            variant="outline"
                            className="border-slate-200 dark:border-slate-600 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:from-blue-900/20 dark:hover:to-purple-900/20 transition-all duration-300 hover:scale-110 hover:shadow-lg hover:border-blue-300 dark:hover:border-purple-500"
                            onClick={handleCreateNew}
                            disabled={createLoading}
                            aria-label={t('create-template')}
                            title={t('create-template')}
                        >
                            <Plus className="transition-transform duration-300 group-hover:rotate-90" />
                        </Button>
                    </div>
                    <ul className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                        {templatesLoading
                            ? (
                                    <li className="text-center py-8 text-muted-foreground animate-pulse">
                                        <div className="inline-flex items-center gap-2">
                                            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                            {t('loading')}
                                        </div>
                                    </li>
                                )
                            : (
                                    templates
                                        .filter(
                                            (template): template is I_EmailTemplate =>
                                                template !== null && typeof template === 'object',
                                        )
                                        .map((template: I_EmailTemplate, index) => (
                                            <li
                                                key={template.id}
                                                onClick={() => handleSelect(template)}
                                                className={cn(
                                                    'rounded-2xl px-4 py-4 cursor-pointer transition-all duration-300 border border-transparent transform hover:scale-[1.02] animate-in slide-in-from-left',
                                                    selectedTemplate?.id === template.id
                                                        ? 'bg-gradient-to-r from-blue-100/90 to-purple-100/90 dark:from-blue-900/40 dark:to-purple-900/40 border-blue-300 dark:border-purple-500 shadow-lg text-blue-900 dark:text-purple-100 scale-[1.02]'
                                                        : 'hover:bg-gradient-to-r hover:from-slate-100/80 hover:to-slate-50/80 dark:hover:from-slate-600/60 dark:hover:to-slate-700/60 text-foreground hover:shadow-md hover:border-slate-300 dark:hover:border-slate-500',
                                                )}
                                                style={{ animationDelay: `${index * 100}ms` }}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 animate-pulse"></div>
                                                    <span className="font-semibold truncate max-w-[120px]">
                                                        {template.name}
                                                    </span>
                                                    <span className="text-xs text-slate-400 dark:text-slate-500 ml-auto bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full">
                                                        {new Date(template.updatedAt).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                <div className="text-xs text-muted-foreground truncate mt-2 pl-4">
                                                    📧
                                                    {' '}
                                                    {template.subject}
                                                </div>
                                                <div className="text-xs text-muted-foreground truncate mt-1 pl-4 opacity-75">
                                                    {getContentSnippet(template.content)}
                                                </div>
                                            </li>
                                        ))
                                )}
                    </ul>
                </aside>
                {/* Main Panel */}
                <main className="flex-1 p-8 bg-gradient-to-br from-white via-slate-50/50 to-blue-50/30 dark:from-slate-800 dark:via-slate-700/50 dark:to-slate-900/30 min-h-[600px] flex flex-col backdrop-blur-sm">
                    {showCreateForm
                        ? (
                                <div className="relative flex flex-col h-full animate-in slide-in-from-right duration-500">
                                    <div className="flex items-center justify-between mb-6">
                                        <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent tracking-tight">
                                            ✨
                                            {' '}
                                            {t('create-new-template')}
                                        </h2>
                                        <Button
                                            variant="ghost"
                                            onClick={() => setShowCreateForm(false)}
                                            className="text-muted-foreground hover:text-foreground transition-all duration-300 hover:scale-110 hover:bg-red-50 dark:hover:bg-red-900/20"
                                        >
                                            ✕
                                            {' '}
                                            {t('cancel')}
                                        </Button>
                                    </div>

                                    <div className="space-y-6 mb-6">
                                        <div className="group">
                                            <label className="block text-base font-semibold text-foreground mb-3 transition-colors group-hover:text-blue-600">
                                                {t('template-name')}
                                            </label>
                                            <Input
                                                type="text"
                                                value={newTemplateName}
                                                onChange={e => setNewTemplateName(e.target.value)}
                                                placeholder={t('enter-template-name')}
                                                className="w-full px-4 py-4 text-lg border border-slate-200 dark:border-slate-600 rounded-xl transition-all duration-300 focus:scale-[1.02] focus:border-blue-400 focus:shadow-lg hover:shadow-md bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm"
                                            />
                                        </div>
                                        <div className="group">
                                            <label className="block text-base font-semibold text-foreground mb-3 transition-colors group-hover:text-purple-600">
                                                🔑
                                                {' '}
                                                {t('template-key')}
                                            </label>
                                            <Input
                                                type="text"
                                                value={newTemplateKey}
                                                onChange={e => setNewTemplateKey(e.target.value)}
                                                placeholder={t('enter-template-key')}
                                                className="w-full px-4 py-4 text-lg border border-slate-200 dark:border-slate-600 rounded-xl transition-all duration-300 focus:scale-[1.02] focus:border-purple-400 focus:shadow-lg hover:shadow-md bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm"
                                            />
                                        </div>
                                    </div>

                                    <div className="mb-6 group">
                                        <label className="block text-base font-semibold text-foreground mb-3 transition-colors group-hover:text-green-600">
                                            {t('subject')}
                                        </label>
                                        <Input
                                            type="text"
                                            value={editedSubject}
                                            onChange={e => setEditedSubject(e.target.value)}
                                            placeholder={t('enter-subject')}
                                            className="w-full px-4 py-4 text-lg border border-slate-200 dark:border-slate-600 rounded-xl transition-all duration-300 focus:scale-[1.02] focus:border-green-400 focus:shadow-lg hover:shadow-md bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm"
                                        />
                                    </div>

                                    <div className="mb-6 flex-1 flex flex-col group">
                                        <label className="block text-base font-semibold text-foreground mb-3 transition-colors group-hover:text-indigo-600">
                                            {t('content')}
                                        </label>
                                        <div className="flex-1 min-h-[300px] transition-all duration-300 hover:scale-[1.01]">
                                            <Editor
                                                value={editedContent}
                                                onChange={setEditedContent}
                                                showToolbar={true}
                                                className="bg-white/90 dark:bg-slate-700/90 rounded-xl border border-slate-200/60 dark:border-slate-600/60 min-h-[300px] shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur-sm"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex gap-3 mt-6">
                                        <div className="flex-1" />
                                        <Button
                                            variant="default"
                                            onClick={handleCreateSubmit}
                                            disabled={
                                                createLoading || !newTemplateName || !newTemplateKey
                                            }
                                            className="flex items-center gap-3 px-8 py-4 text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transform transition-all duration-300 hover:scale-105 hover:shadow-xl rounded-xl"
                                        >
                                            <Save size={22} className="animate-pulse" />
                                            {createLoading
                                                ? (
                                                        <>
                                                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                            {t('creating')}
                                                        </>
                                                    )
                                                : (
                                                        `${t('create-template')}`
                                                    )}
                                        </Button>
                                    </div>
                                </div>
                            )
                        : selectedTemplate
                            ? (
                                    <div className="relative flex flex-col h-full animate-in fade-in duration-500">
                                        <div className="flex items-center justify-between mb-6 p-4 bg-gradient-to-r from-blue-50/50 to-purple-50/50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl border border-blue-200/30 dark:border-purple-700/30 backdrop-blur-sm">
                                            <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent tracking-tight flex-1 truncate">
                                                {selectedTemplate.name}
                                            </h2>
                                            <div className="flex items-center gap-3">
                                                <Button
                                                    variant="destructive"
                                                    onClick={handleDelete}
                                                    disabled={deleteLoading}
                                                    className="flex items-center gap-2 transition-all duration-300 hover:scale-105 hover:shadow-lg"
                                                >
                                                    <Trash2 size={16} />
                                                    {deleteLoading
                                                        ? (
                                                                <>
                                                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                                    {t('delete')}
                                                                    ...
                                                                </>
                                                            )
                                                        : (
                                                                `${t('delete')}`
                                                            )}
                                                </Button>
                                                <Button
                                                    variant={tab === 'edit' ? 'default' : 'ghost'}
                                                    onClick={() => setTab('edit')}
                                                    className={cn(
                                                        'px-6 py-3 rounded-xl transition-all duration-300 hover:scale-105',
                                                        tab === 'edit'
                                                        && 'bg-gradient-to-r from-blue-500 to-purple-500 shadow-lg',
                                                    )}
                                                >
                                                    Edit
                                                </Button>
                                                <Button
                                                    variant={tab === 'preview' ? 'default' : 'ghost'}
                                                    onClick={() => setTab('preview')}
                                                    className={cn(
                                                        'px-6 py-3 rounded-xl transition-all duration-300 hover:scale-105',
                                                        tab === 'preview'
                                                        && 'bg-gradient-to-r from-green-500 to-teal-500 shadow-lg',
                                                    )}
                                                >
                                                    {t('preview')}
                                                </Button>
                                            </div>
                                        </div>
                                        <Tabs
                                            value={tab}
                                            onValueChange={setTab}
                                            className="flex-1 flex flex-col"
                                        >
                                            <TabsList className="hidden" />
                                            <TabsContent
                                                value="edit"
                                                className="flex-1 flex flex-col animate-in slide-in-from-left duration-300"
                                            >
                                                <div className="mb-6 group">
                                                    <label className="block text-base font-semibold text-foreground mb-3 transition-colors group-hover:text-green-600">
                                                        {t('subject')}
                                                    </label>
                                                    <Input
                                                        type="text"
                                                        value={editedSubject}
                                                        onChange={e => setEditedSubject(e.target.value)}
                                                        className="w-full px-4 py-4 text-lg border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 bg-white/90 dark:bg-slate-700/90 text-foreground placeholder-slate-500 dark:placeholder-slate-400 transition-all duration-300 focus:scale-[1.02] hover:shadow-md backdrop-blur-sm"
                                                    />
                                                </div>
                                                <div className="mb-6 flex-1 flex flex-col group">
                                                    <label className="block text-base font-semibold text-foreground mb-3 transition-colors group-hover:text-indigo-600">
                                                        {t('content')}
                                                    </label>
                                                    <div className="flex-1 min-h-[300px] transition-all duration-300 hover:scale-[1.01]">
                                                        <Editor
                                                            value={editedContent}
                                                            onChange={setEditedContent}
                                                            showToolbar={true}
                                                            className="bg-white/90 dark:bg-slate-700/90 rounded-xl border border-slate-200/60 dark:border-slate-600/60 min-h-[300px] shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur-sm"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="flex gap-3 mt-4">
                                                    <div className="flex-1" />
                                                    <Button
                                                        variant="default"
                                                        onClick={handleSave}
                                                        disabled={updateLoading}
                                                        className="flex items-center gap-3 px-8 py-4 text-lg font-semibold bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 shadow-xl fixed right-12 bottom-12 z-20 transform transition-all duration-300 hover:scale-105 rounded-2xl"
                                                    >
                                                        <Save size={22} className="animate-pulse" />
                                                        {updateLoading
                                                            ? (
                                                                    <>
                                                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                                        {t('updating')}
                                                                    </>
                                                                )
                                                            : (
                                                                    `${t('save-draft')}`
                                                                )}
                                                    </Button>
                                                </div>
                                            </TabsContent>
                                            <TabsContent
                                                value="preview"
                                                className="flex-1 flex flex-col animate-in slide-in-from-right duration-300"
                                            >
                                                <div className="flex-1 flex flex-col items-center justify-center">
                                                    <div className="w-full max-w-2xl mx-auto bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800 border border-slate-200/60 dark:border-slate-600/60 rounded-3xl shadow-2xl p-8 mt-4 mb-8 transform transition-all duration-500 hover:scale-[1.02] hover:shadow-3xl backdrop-blur-sm">
                                                        <div className="mb-6 border-b border-slate-200/60 dark:border-slate-600/60 pb-4">
                                                            <div className="text-xs text-muted-foreground mb-2 font-medium flex items-center gap-2">
                                                                {t('subject')}
                                                            </div>
                                                            <div className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                                                {editedSubject}
                                                            </div>
                                                        </div>
                                                        <div className="overflow-y-auto min-h-[200px] max-h-[400px] rounded-xl bg-white/50 dark:bg-slate-800/50 p-4 backdrop-blur-sm">
                                                            <Editor
                                                                value={editedContent}
                                                                editable={false}
                                                                showToolbar={false}
                                                                className="bg-transparent"
                                                                contentClassName="min-h-[200px] outline-none p-2"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </TabsContent>
                                        </Tabs>
                                    </div>
                                )
                            : (
                                    <div className="flex flex-col items-center justify-center h-full py-12 animate-in fade-in-50 duration-700">
                                        <div className="text-center space-y-4">
                                            <div className="w-24 h-24 mx-auto bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-3xl flex items-center justify-center mb-6">
                                                <Send className="w-12 h-12 text-blue-600 dark:text-blue-400 animate-pulse" />
                                            </div>
                                            <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                                                {t('all-templates')}
                                            </h3>
                                            <p className="text-muted-foreground text-lg">
                                                {t('no-templates-found')}
                                            </p>
                                            <div className="flex justify-center mt-6">
                                                <Button
                                                    onClick={handleCreateNew}
                                                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transform transition-all duration-300 hover:scale-105 px-6 py-3 rounded-xl shadow-lg"
                                                >
                                                    ✨
                                                    {' '}
                                                    {t('create-template')}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                </main>
            </div>

            <ConfirmDialog
                open={showDeleteConfirm}
                title={t('delete-template')}
                description={selectedTemplate && <span>{t('confirm-delete')}</span>}
                onConfirm={confirmDelete}
                onCancel={() => setShowDeleteConfirm(false)}
                loading={deleteLoading}
                confirmLabel={t('delete')}
                cancelLabel={t('cancel')}
            />
        </div>
    );
}
