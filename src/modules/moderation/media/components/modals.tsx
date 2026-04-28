import { AlertTriangle, MessageSquare, Trash2, X } from 'lucide-react';
import { motion } from 'motion/react';

import { Button } from '#shared/component';
import { Editor } from '#shared/component/editor';
import { useTranslate } from '#shared/i18n';

interface DeleteModalProps {
    isOpen: boolean;
    deleteReason: string;
    mutationLoading: boolean;
    onReasonChange: (value: string) => void;
    onConfirm: () => void;
    onCancel: () => void;
}

export function DeleteModal({
    isOpen,
    deleteReason,
    mutationLoading,
    onReasonChange,
    onConfirm,
    onCancel,
}: DeleteModalProps) {
    const { t } = useTranslate('media');

    if (!isOpen)
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
                className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full shadow-2xl border border-gray-200 dark:border-gray-700"
            >
                <div className="flex items-center text-red-600 mb-4">
                    <AlertTriangle size={24} className="mr-2" />
                    <h3 className="text-lg font-semibold">{t('delete-content-title')}</h3>
                </div>

                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('delete-reason-label')}
                    </label>
                    <Editor
                        value={deleteReason}
                        onChange={onReasonChange}
                        placeholder={t('delete-reason-placeholder')}
                        showToolbar={true}
                        className="border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                        contentClassName="min-h-[75px] outline-none p-3 text-gray-900 dark:text-gray-100"
                    />
                </div>

                <div className="flex justify-end space-x-4">
                    <Button
                        variant="ghost"
                        onClick={onCancel}
                        className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                    >
                        {t('cancel')}
                    </Button>
                    <Button
                        onClick={onConfirm}
                        disabled={!deleteReason || mutationLoading}
                        className="px-4 py-2 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-lg hover:from-red-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {mutationLoading ? 'Rejecting...' : t('delete-content-button')}
                    </Button>
                </div>
            </motion.div>
        </motion.div>
    );
}

interface MessageModalProps {
    isOpen: boolean;
    username: string;
    messageContent: string;
    mutationLoading: boolean;
    onMessageChange: (value: string) => void;
    onConfirm: () => void;
    onCancel: () => void;
}

export function MessageModal({
    isOpen,
    username,
    messageContent,
    mutationLoading,
    onMessageChange,
    onConfirm,
    onCancel,
}: MessageModalProps) {
    if (!isOpen)
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
                className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full shadow-2xl border border-gray-200 dark:border-gray-700"
            >
                <div className="flex items-center text-yellow-600 mb-4">
                    <AlertTriangle size={24} className="mr-2" />
                    <h3 className="text-lg font-semibold">Send Warning Message</h3>
                </div>

                <p className="text-gray-600 dark:text-gray-300 mb-4">
                    Send a warning message to
                    {' '}
                    <span className="font-semibold">{username}</span>
                    {' '}
                    about their content upload.
                </p>

                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Warning Message
                    </label>
                    <Editor
                        value={messageContent}
                        onChange={onMessageChange}
                        placeholder="Enter your warning message here..."
                        showToolbar={true}
                        className="border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                        contentClassName="min-h-[100px] outline-none p-3 text-gray-900 dark:text-gray-100"
                    />
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-3 mb-4">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                        ⚠️ This will send a direct warning to the user about policy violations. Use this feature responsibly.
                    </p>
                </div>

                <div className="flex justify-end space-x-4">
                    <Button
                        variant="ghost"
                        onClick={onCancel}
                        className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={onConfirm}
                        disabled={!messageContent.trim() || mutationLoading}
                        className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-lg hover:from-yellow-600 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        {mutationLoading ? 'Sending...' : 'Send Warning'}
                    </Button>
                </div>
            </motion.div>
        </motion.div>
    );
}

interface PermanentDeleteModalProps {
    isOpen: boolean;
    mutationLoading: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

export function PermanentDeleteModal({
    isOpen,
    mutationLoading,
    onConfirm,
    onCancel,
}: PermanentDeleteModalProps) {
    if (!isOpen)
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
                className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full shadow-2xl border border-gray-200 dark:border-gray-700"
            >
                <div className="flex items-center text-red-600 mb-4">
                    <AlertTriangle size={24} className="mr-2" />
                    <h3 className="text-lg font-semibold">Permanent Delete</h3>
                </div>

                <p className="text-gray-600 dark:text-gray-300 mb-4">
                    Are you sure you want to permanently delete this content? This action cannot be undone.
                </p>

                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-3 mb-4">
                    <p className="text-sm text-red-800 dark:text-red-200">
                        ⚠️ This will permanently remove the content from the system. This action is irreversible.
                    </p>
                </div>

                <div className="flex justify-end space-x-4">
                    <Button
                        variant="ghost"
                        onClick={onCancel}
                        className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={onConfirm}
                        disabled={mutationLoading}
                        className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Trash2 className="w-4 h-4 mr-2" />
                        {mutationLoading ? 'Deleting...' : 'Delete Permanently'}
                    </Button>
                </div>
            </motion.div>
        </motion.div>
    );
}

interface ImageModalProps {
    isOpen: boolean;
    imageUrl: string;
    onClose: () => void;
}

export function ImageModal({ isOpen, imageUrl, onClose }: ImageModalProps) {
    if (!isOpen)
        return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="relative max-w-7xl max-h-full"
                onClick={e => e.stopPropagation()}
            >
                <Button
                    variant="ghost"
                    onClick={onClose}
                    className="absolute top-4 right-4 text-white bg-black/50 hover:bg-black/70 rounded-full z-10"
                >
                    <X size={24} />
                </Button>
                <img
                    src={imageUrl}
                    alt="Full size view"
                    className="max-w-full max-h-[90vh] object-contain rounded-lg"
                />
            </motion.div>
        </motion.div>
    );
}

interface SuspendDialogProps {
    isOpen: boolean;
    username: string;
    suspendReason: string;
    mutationLoading: boolean;
    onReasonChange: (value: string) => void;
    onConfirm: () => void;
    onCancel: () => void;
}

export function SuspendDialog({
    isOpen,
    username,
    suspendReason,
    mutationLoading,
    onReasonChange,
    onConfirm,
    onCancel,
}: SuspendDialogProps) {
    const { t } = useTranslate('media');

    if (!isOpen)
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
                className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full shadow-2xl border border-gray-200 dark:border-gray-700"
            >
                <div className="flex items-center text-red-600 mb-4">
                    <AlertTriangle size={24} className="mr-2" />
                    <h3 className="text-lg font-semibold">{t('suspend-account-title')}</h3>
                </div>
                <p className="text-gray-600 dark:text-gray-300 mb-2">
                    {t('suspend-account-confirmation', { username })}
                </p>
                <p className="text-sm text-gray-500 mb-4">
                    {t('suspend-account-description')}
                </p>

                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('suspension-reason-label')}
                    </label>
                    <Editor
                        value={suspendReason}
                        onChange={onReasonChange}
                        placeholder={t('suspension-reason-placeholder')}
                        showToolbar={true}
                        className="border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                        contentClassName="min-h-[75px] outline-none p-3 text-gray-900 dark:text-gray-100"
                    />
                </div>
                <div className="flex justify-end space-x-4">
                    <Button
                        variant="ghost"
                        onClick={onCancel}
                        className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                    >
                        {t('cancel')}
                    </Button>
                    <Button
                        onClick={onConfirm}
                        disabled={!suspendReason.trim() || mutationLoading}
                        className="px-4 py-2 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-lg hover:from-red-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {mutationLoading ? 'Suspending...' : t('suspend-account-button')}
                    </Button>
                </div>
            </motion.div>
        </motion.div>
    );
}
