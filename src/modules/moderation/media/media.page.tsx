import { Check, Clock, Eye, Image, RefreshCw, Shield } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';

import type { T_ModerationMedia } from '#shared/graphql';

import { Button } from '#shared/component';
import { usePendingCounts } from '#shared/context/pending-count.context';
import { E_ModerationMediaStatus, E_NoteType } from '#shared/graphql';
import { useTranslate } from '#shared/i18n';
import { usePortal } from '#shared/portal';

import type { I_Input_Note } from './media.type';

import { useUpdateUser } from '../../user/user.hook';
import { MediaFilters } from './components/media-filters';
import { MediaSection } from './components/media-section';
import { MediaStatsCards } from './components/media-stats-cards';
import { DeleteModal, ImageModal, MessageModal, PermanentDeleteModal, SuspendDialog } from './components/modals';
import { NotesModal } from './components/notes-modal';
import { RejectedMediaTable } from './components/rejected-media-table';
import {
    useApproveModerationMedia,
    useGetModerationMedias,
    useModerationMedia,
    useRejectModerationMedia,
} from './media.hook';

export default function MediaPage() {
    const { t } = useTranslate('media');
    const { setHeader } = usePortal();
    const { refetch: refetchCounts } = usePendingCounts();
    const { updateUser, loading: updatingUser } = useUpdateUser();

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState<T_ModerationMedia | null>(null);
    const [deleteReason, setDeleteReason] = useState('');
    const [showNotesModal, setShowNotesModal] = useState(false);
    const [showSuspendDialog, setShowSuspendDialog] = useState(false);
    const [userToSuspend, setUserToSuspend] = useState<{ id: string; name: string } | null>(null);
    const [suspendReason, setSuspendReason] = useState('');
    const [newNote, setNewNote] = useState('');
    const [noteEditorKey, setNoteEditorKey] = useState(0);
    const [showImageModal, setShowImageModal] = useState(false);
    const [selectedImageUrl, setSelectedImageUrl] = useState<string>('');
    const [showMessageModal, setShowMessageModal] = useState(false);
    const [messageToUser, setMessageToUser] = useState<{ id: string; username: string } | null>(null);
    const [showPermanentDeleteModal, setShowPermanentDeleteModal] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<string | null>(null);
    const [messageContent, setMessageContent] = useState('');

    const [showDeletedItems, setShowDeletedItems] = useState(false);
    const [showApprovedItems, setShowApprovedItems] = useState(true);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(50);

    const buildFilter = (): Record<string, unknown> => {
        const filter: Record<string, unknown> = {};
        if (statusFilter !== 'all') {
            const statusValue = statusFilter.toUpperCase();
            if (statusValue === 'PENDING')
                filter['status'] = E_ModerationMediaStatus.PENDING;
            else if (statusValue === 'APPROVED')
                filter['status'] = E_ModerationMediaStatus.APPROVED;
            else if (statusValue === 'REJECTED')
                filter['status'] = E_ModerationMediaStatus.REJECTED;
        }
        return filter;
    };

    const {
        moderationMedias,
        totalDocs,
        totalPages,
        hasNextPage,
        hasPrevPage,
        loading: loadingMedias,
        refetch,
    } = useGetModerationMedias(
        buildFilter(),
        {
            page,
            limit,
            sort: { createdAt: -1 },
            populate: ['uploadedBy', 'moderatedBy'],
            includeDeletedEntities: true,
        },
    );

    const {
        updateModerationMedia,
        deleteModerationMedia,
        loading: baseMutationLoading,
    } = useModerationMedia();
    const { approveModerationMedia, loading: approvingMedia } = useApproveModerationMedia();
    const { rejectModerationMedia, loading: rejectingMedia } = useRejectModerationMedia();
    const mutationLoading = baseMutationLoading || approvingMedia || rejectingMedia;

    useEffect(() => {
        setHeader({
            title: t('title'),
            description: t('description'),
            icon: Image,
        });
        return () => setHeader(null);
    }, [setHeader, t]);

    const _handleAddNote = async (content: string, currentUser: { id: string; username: string }) => {
        if (!selectedItem?.id)
            return;

        try {
            const newNoteObj: I_Input_Note = {
                type: E_NoteType.MEMBER_NOTE,
                content,
            };

            const currentNotes = (selectedItem.notes || []).map(note => ({
                type: note?.type || E_NoteType.MEMBER_NOTE,
                content: note?.content || '',
            }));

            await updateModerationMedia(
                { id: selectedItem.id },
                { notes: [...currentNotes, newNoteObj] },
            );

            const displayNote = {
                type: E_NoteType.MEMBER_NOTE,
                content,
                createdBy: { id: currentUser.id, username: currentUser.username },
            };

            setSelectedItem(prev => prev
                ? { ...prev, notes: [...(prev.notes || []), displayNote] }
                : null);

            refetch();
        }
        catch (error) {
            console.error('Error adding note:', error);
        }
    };

    const _handleSuspend = async () => {
        if (userToSuspend && suspendReason.trim()) {
            try {
                await updateUser({ id: userToSuspend.id }, { isActive: false });
                setShowSuspendDialog(false);
                setUserToSuspend(null);
                setSuspendReason('');
            }
            catch (error) {
                console.error('Error suspending user:', error);
            }
        }
    };

    const _openNotes = (item: T_ModerationMedia) => {
        setSelectedItem(item);
        setShowNotesModal(true);
    };

    const _handleApprove = async (item: T_ModerationMedia) => {
        if (!item.id)
            return;

        try {
            await approveModerationMedia(item.id);
            refetch();
            refetchCounts();
        }
        catch (error) {
            console.error('Error approving media:', error);
        }
    };

    const _handleDelete = async () => {
        if (!selectedItem?.id || !deleteReason)
            return;

        try {
            await rejectModerationMedia(selectedItem.id, deleteReason);

            setShowDeleteModal(false);
            setSelectedItem(null);
            setDeleteReason('');
            refetch();
            refetchCounts();
        }
        catch (error) {
            console.error('Error rejecting media:', error);
        }
    };

    const _handlePermanentDelete = async (itemId: string) => {
        setItemToDelete(itemId);
        setShowPermanentDeleteModal(true);
    };

    const _confirmPermanentDelete = async () => {
        if (!itemToDelete)
            return;

        try {
            await deleteModerationMedia({ id: itemToDelete });
            refetch();
            setShowPermanentDeleteModal(false);
            setItemToDelete(null);
        }
        catch (error) {
            console.error('Error permanently deleting media:', error);
        }
    };

    const _handleSubmitNote = async () => {
        if (newNote.trim() && selectedItem) {
            const currentUser = { id: 'current-user-id', username: 'current-user' };
            await _handleAddNote(newNote.trim(), currentUser);
            setNewNote('');
            setNoteEditorKey(prev => prev + 1);
        }
    };

    const _handleAcceptMistake = async (item: T_ModerationMedia) => {
        if (!item.id)
            return;

        try {
            await approveModerationMedia(item.id);
            refetch();
        }
        catch (error) {
            console.error('Error accepting content:', error);
        }
    };

    const _handleRejectApproved = async (item: T_ModerationMedia) => {
        if (!item.id)
            return;

        try {
            await rejectModerationMedia(item.id, 'Rejected after review - approved by mistake');
            refetch();
        }
        catch (error) {
            console.error('Error rejecting approved content:', error);
        }
    };

    const _handleViewFullSize = (imageUrl: string) => {
        setSelectedImageUrl(imageUrl);
        setShowImageModal(true);
    };

    const _handleSendMessage = (userId: string, username: string) => {
        setMessageToUser({ id: userId, username });
        setShowMessageModal(true);
    };

    const _handleSubmitMessage = async () => {
        if (!messageToUser || !messageContent.trim())
            return;
        console.warn('Sending message to:', messageToUser.username, 'Content:', messageContent);
        setShowMessageModal(false);
        setMessageToUser(null);
        setMessageContent('');
    };

    const filteredItems = moderationMedias.filter((item) => {
        const matchesSearch = !searchTerm || item.uploadedBy?.username?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all'
            || (statusFilter === 'pending' && item.status === E_ModerationMediaStatus.PENDING)
            || (statusFilter === 'approved' && item.status === E_ModerationMediaStatus.APPROVED)
            || (statusFilter === 'rejected' && item.status === E_ModerationMediaStatus.REJECTED);
        return matchesSearch && matchesStatus;
    });

    const pendingItems = filteredItems.filter(item => item.status === E_ModerationMediaStatus.PENDING);
    const rejectedItems = filteredItems.filter(item => item.status === E_ModerationMediaStatus.REJECTED);
    const approvedItems = filteredItems.filter(item => item.status === E_ModerationMediaStatus.APPROVED);

    const stats = {
        pending: pendingItems.length,
        approved: approvedItems.length,
        rejected: rejectedItems.length,
        total: moderationMedias.length,
    };

    if (loadingMedias) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-300">Loading media content...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
            {/* Header Section */}
            <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
                <div className="p-6">
                    <div className="flex items-center justify-between">
                        <Button
                            onClick={() => refetch()}
                            disabled={loadingMedias}
                            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl px-6 py-2 shadow-lg transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            title="Refresh to see new content"
                        >
                            <RefreshCw className={`w-4 h-4 ${loadingMedias ? 'animate-spin' : ''}`} />
                            {loadingMedias ? 'Refreshing...' : 'Refresh'}
                        </Button>

                        <MediaStatsCards stats={stats} />
                    </div>

                    <MediaFilters
                        searchTerm={searchTerm}
                        statusFilter={statusFilter}
                        viewMode={viewMode}
                        limit={limit}
                        onSearchChange={(val) => {
                            setSearchTerm(val);
                            setPage(1);
                        }}
                        onStatusChange={(val) => {
                            setStatusFilter(val);
                            setPage(1);
                        }}
                        onViewModeChange={setViewMode}
                        onLimitChange={(newLimit) => {
                            setLimit(newLimit);
                            setPage(1);
                        }}
                    />

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="mt-4 flex items-center justify-between">
                            <div className="text-sm text-gray-600 dark:text-gray-300">
                                Showing
                                {' '}
                                {((page - 1) * limit) + 1}
                                {' '}
                                to
                                {' '}
                                {Math.min(page * limit, totalDocs)}
                                {' '}
                                of
                                {' '}
                                {totalDocs}
                                {' '}
                                items
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="ghost"
                                    onClick={() => setPage(page - 1)}
                                    disabled={!hasPrevPage || loadingMedias}
                                    className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm"
                                >
                                    Previous
                                </Button>
                                <span className="flex items-center px-4 py-2 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-lg">
                                    Page
                                    {' '}
                                    {page}
                                    {' '}
                                    of
                                    {' '}
                                    {totalPages}
                                </span>
                                <Button
                                    variant="ghost"
                                    onClick={() => setPage(page + 1)}
                                    disabled={!hasNextPage || loadingMedias}
                                    className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm"
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Main Content */}
            <div className="p-6">
                {/* Rejected Content Section */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-12"
                >
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-r from-red-400 to-pink-500 rounded-lg flex items-center justify-center">
                                <Shield className="w-5 h-5 text-white" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                                Removed Content (
                                {rejectedItems.length}
                                )
                            </h2>
                        </div>

                        <Button
                            variant="ghost"
                            onClick={() => setShowDeletedItems(!showDeletedItems)}
                            className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                        >
                            <Eye className="w-4 h-4 mr-2" />
                            {showDeletedItems ? 'Hide' : 'Show'}
                            {' '}
                            Removed
                        </Button>
                    </div>

                    <AnimatePresence>
                        {showDeletedItems && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                            >
                                <RejectedMediaTable
                                    items={rejectedItems}
                                    mutationLoading={mutationLoading}
                                    updatingUser={updatingUser}
                                    onAcceptMistake={_handleAcceptMistake}
                                    onOpenNotes={_openNotes}
                                    onSuspendUser={async (userId) => {
                                        await updateUser({ id: userId }, { isActive: false });
                                    }}
                                    onPermanentDelete={_handlePermanentDelete}
                                    onViewFullSize={_handleViewFullSize}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>

                {/* Pending Content Section */}
                <MediaSection
                    title="Pending Review"
                    icon={Clock}
                    iconGradient="bg-gradient-to-r from-yellow-400 to-orange-500"
                    items={pendingItems}
                    viewMode={viewMode}
                    status="pending"
                    mutationLoading={mutationLoading}
                    onApprove={_handleApprove}
                    onReject={(item) => {
                        setSelectedItem(item);
                        setShowDeleteModal(true);
                    }}
                    onOpenNotes={_openNotes}
                    onSendMessage={_handleSendMessage}
                    onViewFullSize={_handleViewFullSize}
                    emptyMessage={t('no-pending-content')}
                    emptyDescription={t('all-content-moderated')}
                />

                {/* Approved Content Section */}
                <MediaSection
                    title="Approved Content"
                    icon={Check}
                    iconGradient="bg-gradient-to-r from-green-400 to-emerald-500"
                    items={approvedItems}
                    viewMode={viewMode}
                    status="approved"
                    mutationLoading={mutationLoading}
                    showItems={showApprovedItems}
                    onToggleShow={() => setShowApprovedItems(!showApprovedItems)}
                    onRejectApproved={_handleRejectApproved}
                    onOpenNotes={_openNotes}
                    onSendMessage={_handleSendMessage}
                    onSuspendUser={setUserToSuspend}
                    onViewFullSize={_handleViewFullSize}
                    emptyMessage="No Approved Content"
                    emptyDescription="No content has been approved yet"
                />
            </div>

            {/* Modals */}
            <AnimatePresence>
                <DeleteModal
                    isOpen={showDeleteModal && !!selectedItem}
                    deleteReason={deleteReason}
                    mutationLoading={mutationLoading}
                    onReasonChange={setDeleteReason}
                    onConfirm={_handleDelete}
                    onCancel={() => {
                        setShowDeleteModal(false);
                        setSelectedItem(null);
                        setDeleteReason('');
                    }}
                />

                <NotesModal
                    isOpen={showNotesModal}
                    selectedItem={selectedItem}
                    newNote={newNote}
                    noteEditorKey={noteEditorKey}
                    mutationLoading={mutationLoading}
                    onNoteChange={setNewNote}
                    onSubmit={_handleSubmitNote}
                    onClose={() => {
                        setShowNotesModal(false);
                        setSelectedItem(null);
                    }}
                />

                <SuspendDialog
                    isOpen={showSuspendDialog}
                    username={userToSuspend?.name || ''}
                    suspendReason={suspendReason}
                    mutationLoading={mutationLoading}
                    onReasonChange={setSuspendReason}
                    onConfirm={_handleSuspend}
                    onCancel={() => {
                        setShowSuspendDialog(false);
                        setUserToSuspend(null);
                        setSuspendReason('');
                    }}
                />

                <ImageModal
                    isOpen={showImageModal}
                    imageUrl={selectedImageUrl}
                    onClose={() => setShowImageModal(false)}
                />

                <MessageModal
                    isOpen={showMessageModal && !!messageToUser}
                    username={messageToUser?.username || ''}
                    messageContent={messageContent}
                    mutationLoading={mutationLoading}
                    onMessageChange={setMessageContent}
                    onConfirm={_handleSubmitMessage}
                    onCancel={() => {
                        setShowMessageModal(false);
                        setMessageToUser(null);
                        setMessageContent('');
                    }}
                />

                <PermanentDeleteModal
                    isOpen={showPermanentDeleteModal}
                    mutationLoading={mutationLoading}
                    onConfirm={_confirmPermanentDelete}
                    onCancel={() => {
                        setShowPermanentDeleteModal(false);
                        setItemToDelete(null);
                    }}
                />
            </AnimatePresence>
        </div>
    );
}
