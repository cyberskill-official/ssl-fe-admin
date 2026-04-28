import { FileText, User, X, Zap } from 'lucide-react';
import { motion } from 'motion/react';

import type { T_ModerationMedia } from '#shared/graphql';

import { Badge, Button } from '#shared/component';
import { Editor, LexicalPreview } from '#shared/component/editor';
import { E_NoteType } from '#shared/graphql';
import { useTranslate } from '#shared/i18n';

interface NotesModalProps {
    isOpen: boolean;
    selectedItem: T_ModerationMedia | null;
    newNote: string;
    noteEditorKey: number;
    mutationLoading: boolean;
    onNoteChange: (value: string) => void;
    onSubmit: () => void;
    onClose: () => void;
}

export function NotesModal({
    isOpen,
    selectedItem,
    newNote,
    noteEditorKey,
    mutationLoading,
    onNoteChange,
    onSubmit,
    onClose,
}: NotesModalProps) {
    const { t } = useTranslate('media');

    if (!isOpen || !selectedItem)
        return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-2xl w-full shadow-2xl border border-gray-200 dark:border-gray-700 max-h-[90vh] overflow-y-auto"
            >
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                        {t('notes-for', { username: selectedItem.uploadedBy?.username })}
                    </h3>
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                        <X size={20} />
                    </Button>
                </div>

                {/* Add New Note */}
                <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl">
                    <Editor
                        key={noteEditorKey}
                        value={newNote}
                        valueKey={noteEditorKey}
                        onChange={onNoteChange}
                        placeholder={t('add-note-placeholder')}
                        showToolbar={true}
                        className="border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 mb-2"
                        contentClassName="min-h-[75px] outline-none p-3 text-gray-900 dark:text-gray-100"
                    />
                    <Button
                        onClick={onSubmit}
                        disabled={!newNote.trim() || mutationLoading}
                        className="mt-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:from-purple-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Zap className="w-4 h-4 mr-2" />
                        {mutationLoading ? 'Adding...' : t('add-note')}
                    </Button>
                </div>

                {/* Notes List */}
                <div className="space-y-4 max-h-96 overflow-y-auto">
                    {!selectedItem.notes || selectedItem.notes.length === 0
                        ? (
                                <div className="text-center py-8 text-gray-500">
                                    <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                    {t('no-notes-yet')}
                                </div>
                            )
                        : (
                                selectedItem.notes.map((note, index) => (
                                    <motion.div
                                        key={note?.content ? `note-${selectedItem.id}-${note.content.substring(0, 50)}-${index}` : `note-${selectedItem.id}-${index}`}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        className="bg-gray-50 dark:bg-gray-700 p-4 rounded-xl border border-gray-200 dark:border-gray-600"
                                    >
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                                                    <User className="w-3 h-3 text-white" />
                                                </div>
                                                <span className="text-sm text-gray-600 dark:text-gray-300">
                                                    {t('by')}
                                                    {' '}
                                                    {(note && note.createdBy?.username) || t('unknown')}
                                                </span>
                                            </div>
                                            <Badge
                                                className={`text-xs font-medium px-2 py-1 rounded-full ${
                                                    note && note.type === E_NoteType.CONTENT_REVIEW
                                                        ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                                                        : note && note.type === E_NoteType.MEMBER_NOTE
                                                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300'
                                                            : note && note.type === E_NoteType.USER_REPORT
                                                                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300'
                                                                : note && note.type === E_NoteType.AUTOMATED_DETECTION
                                                                    ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300'
                                                                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                                                }`}
                                            >
                                                {note && note.type ? t(note.type.toLowerCase()) : t('unknown')}
                                            </Badge>
                                        </div>
                                        <div className="text-sm text-gray-700 dark:text-gray-300">
                                            <LexicalPreview
                                                content={note?.content || ''}
                                                className="prose prose-slate dark:prose-invert max-w-none p-0"
                                            />
                                        </div>
                                    </motion.div>
                                ))
                            )}
                </div>
            </motion.div>
        </motion.div>
    );
}
