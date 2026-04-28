import {
    Archive,
    Image as ImageIcon,
    MessageSquare,
    MoreVertical,
    Paperclip,
    Search,
    Send,
    Smile,
    TrendingUp,
    Users,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import type { T_Conversation } from '#shared/graphql';

import { Button, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, Input } from '#shared/component';
import { usePendingCounts } from '#shared/context/pending-count.context';
import { E_ContactTopic, E_ConversationStatus } from '#shared/graphql';
import { usePortal } from '#shared/portal';

import ConversationList from './components/conversation-list';
import MessageThread from './components/message-thread';
import UserProfile from './components/user-profile';
import { useAdminReplyGuest, useArchiveConversation, useGetSupportConversations } from './message.hook';

function Messenger() {
    const { setHeader } = usePortal();
    const { refetch: refetchCounts } = usePendingCounts();
    const [selectedConversation, setSelectedConversation] = useState<T_Conversation | null>(null);
    const [showProfile, setShowProfile] = useState(false);
    const [newMessage, setNewMessage] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<'all' | E_ConversationStatus>('all');
    const [messageRefreshKey, setMessageRefreshKey] = useState(0);

    const options = useMemo(() => ({
        page: 1,
        limit: 20,
        sort: { updatedAt: -1 },
        populate: ['createdBy', 'lastMessage'],
    }), []);

    const { conversations, loading, refetch } = useGetSupportConversations(options);
    const { archive, loading: archiveLoading } = useArchiveConversation();
    /* const { markAsRead } = useMarkConversationAsRead(); */

    const visibleConversations = useMemo(() => {
        let filtered = conversations;

        // Filter by status
        if (filter === 'all') {
            // Exclude archived conversations from 'all' tab
            filtered = filtered.filter(c => c.status !== E_ConversationStatus.ARCHIVED);
        }
        else {
            filtered = filtered.filter(c => c.status === filter);
        }

        // Filter by search term
        const term = search.trim().toLowerCase();
        if (term) {
            filtered = filtered.filter((c) => {
                const name = (c.name || c.lastMessage?.content?.contactAdmin?.username || c.createdBy?.username || '').toLowerCase();
                const lastMessage = (c.lastMessage?.content?.value || c.lastMessage?.content?.contactAdmin?.message || '').toLowerCase();
                return name.includes(term) || lastMessage.includes(term);
            });
        }

        // Sort: NEW status first, then by updatedAt
        filtered = [...filtered].sort((a, b) => {
            if (a.status === E_ConversationStatus.NEW && b.status !== E_ConversationStatus.NEW) {
                return -1;
            }
            if (a.status !== E_ConversationStatus.NEW && b.status === E_ConversationStatus.NEW) {
                return 1;
            }
            // If both have same status priority, sort by updatedAt
            const aTime = new Date(a.updatedAt || 0).getTime();
            const bTime = new Date(b.updatedAt || 0).getTime();
            return bTime - aTime;
        });

        return filtered;
    }, [conversations, search, filter]);

    const { adminReplyGuest, loading: replyLoading } = useAdminReplyGuest();

    useEffect(() => {
        setHeader({
            title: 'Messages',
            description: 'Manage conversations and communicate with your users',
            icon: MessageSquare,
        });
        return () => setHeader(null);
    }, [setHeader]);

    const handleSendMessage = useCallback(async () => {
        console.warn('HandleSendMessage called with:', {
            hasMessage: !!newMessage.trim(),
            hasSelectedConversation: !!selectedConversation,
            selectedConversation: selectedConversation
                ? {
                        id: selectedConversation.id,
                        name: selectedConversation.name,
                        contact: selectedConversation.lastMessage?.content?.contactAdmin,
                        createdBy: selectedConversation.createdBy,
                    }
                : null,
            message: newMessage.trim(),
        });

        if (newMessage.trim() && selectedConversation) {
            setIsTyping(true);
            try {
                const email = selectedConversation.lastMessage?.content?.contactAdmin?.email
                    || selectedConversation.createdBy?.email
                    || 'unknown@example.com';

                const topic = selectedConversation.lastMessage?.content?.contactAdmin?.topic || E_ContactTopic.TECHNICAL_ACCOUNT;

                console.warn('Sending admin reply:', {
                    conversationId: selectedConversation.id,
                    message: newMessage.trim(),
                    email,
                    topic,
                });

                await adminReplyGuest({
                    conversationId: selectedConversation.id || '',
                    message: newMessage.trim(),
                    email,
                    topic,
                });

                setNewMessage('');
                setMessageRefreshKey(prev => prev + 1);
                refetchCounts();
                console.warn('Admin reply sent successfully!');
            }
            catch (error) {
                console.error('Failed to send admin reply:', error);
            }
            finally {
                setIsTyping(false);
            }
        }
        else {
            let reason = 'Unknown';
            if (!newMessage.trim()) {
                reason = 'No message';
            }
            else if (!selectedConversation) {
                reason = 'No conversation selected';
            }

            console.warn('Send message blocked:', { reason });
        }
    }, [newMessage, selectedConversation, adminReplyGuest, refetchCounts]);

    const handleArchiveConversation = useCallback(async () => {
        if (!selectedConversation?.id)
            return;

        const success = await archive(selectedConversation.id);
        if (success) {
            setSelectedConversation(null);
            await refetch();
            refetchCounts();
        }
    }, [selectedConversation, archive, refetch, refetchCounts]);

    const handleSelectConversation = useCallback(async (conversation: T_Conversation) => {
        console.warn('Selected conversation:', {
            id: conversation.id,
            name: conversation.name,
            type: conversation.type,
            status: conversation.status,
            hasContact: !!conversation.lastMessage?.content?.contactAdmin,
            contact: conversation.lastMessage?.content?.contactAdmin,
        });

        setSelectedConversation(conversation);
    }, []);

    const renderIconButtons = (icons: React.ComponentType<any>[]) =>
        icons.map(Icon => (
            <Button
                variant="ghost"
                key={Icon.displayName || Icon.name}
                className="text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/50 p-2 rounded-xl transition-all duration-200 cursor-pointer"
            >
                <Icon size={20} />
            </Button>
        ));

    return (
        <div className="h-[calc(100vh-4rem)] flex bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-white/20 dark:border-slate-700/20">
            {/* Sidebar */}
            <aside className="w-96 border-r border-white/20 dark:border-slate-700/20 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm flex flex-col">
                <header className="p-6 border-b border-white/20 dark:border-slate-700/20 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-slate-800/80 dark:to-slate-700/80">
                    <div className="flex justify-between items-center mb-6">
                        <Button
                            variant="ghost"
                            className="text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/50 p-2 rounded-xl transition-all duration-200"
                        >
                            <MoreVertical size={20} />
                        </Button>
                    </div>

                    <div className="relative mb-6">
                        <Input
                            type="text"
                            placeholder="Search conversations..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 dark:border-slate-600 rounded-xl focus:outline-none focus:border-purple-500 dark:focus:border-purple-400 focus:ring-4 focus:ring-purple-100 dark:focus:ring-purple-900/50 transition-all duration-300 bg-white/80 dark:bg-slate-700/80 backdrop-blur-sm"
                        />
                        <Search className="absolute left-4 top-3.5 text-gray-400 dark:text-gray-500" size={20} />
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <Button
                            variant="ghost"
                            onClick={() => setFilter('all')}
                            className={`flex items-center px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-300 ${
                                filter === 'all'
                                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                                    : 'text-gray-600 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-purple-900/50 hover:text-purple-600 dark:hover:text-purple-400'
                            }`}
                        >
                            All
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={() => setFilter(E_ConversationStatus.NEW)}
                            className={`px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200 ${
                                filter === E_ConversationStatus.NEW
                                    ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg'
                                    : 'text-gray-600 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/50 hover:text-blue-600 dark:hover:text-blue-400'
                            }`}
                        >
                            New
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={() => setFilter(E_ConversationStatus.IN_PROGRESS)}
                            className={`px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200 ${
                                filter === E_ConversationStatus.IN_PROGRESS
                                    ? 'bg-gradient-to-r from-yellow-600 to-yellow-500 text-white shadow-lg'
                                    : 'text-gray-600 dark:text-gray-300 hover:bg-yellow-50 dark:hover:bg-yellow-900/50 hover:text-yellow-600 dark:hover:text-yellow-400'
                            }`}
                        >
                            In Progress
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={() => setFilter(E_ConversationStatus.RESOLVED)}
                            className={`px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200 ${
                                filter === E_ConversationStatus.RESOLVED
                                    ? 'bg-gradient-to-r from-green-600 to-green-500 text-white shadow-lg'
                                    : 'text-gray-600 dark:text-gray-300 hover:bg-green-50 dark:hover:bg-green-900/50 hover:text-green-600 dark:hover:text-green-400'
                            }`}
                        >
                            Resolved
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={() => setFilter(E_ConversationStatus.ARCHIVED)}
                            className={`px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200 ${
                                filter === E_ConversationStatus.ARCHIVED
                                    ? 'bg-gradient-to-r from-gray-600 to-gray-500 text-white shadow-lg'
                                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900/50 hover:text-gray-600 dark:hover:text-gray-400'
                            }`}
                        >
                            Archived
                        </Button>
                    </div>
                </header>

                <ConversationList
                    conversations={visibleConversations}
                    loading={loading}
                    selectedId={selectedConversation?.id ?? null}
                    onSelect={handleSelectConversation}
                />
            </aside>

            {/* Main */}
            {selectedConversation
                ? (
                        <main className="flex-1 flex flex-col bg-white/60 dark:bg-slate-700/60 backdrop-blur-sm">
                            <header className="p-6 border-b border-white/20 dark:border-slate-700/20 bg-gradient-to-r from-white/80 to-purple-50/80 dark:from-slate-800/80 dark:to-slate-700/80 backdrop-blur-sm">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-4">
                                        <button
                                            type="button"
                                            onClick={() => setShowProfile(true)}
                                            className="relative group"
                                        >
                                            <div className="relative">
                                                <div className="size-12 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center text-white font-bold text-lg ring-4 ring-white dark:ring-slate-700 shadow-lg group-hover:ring-purple-200 dark:group-hover:ring-purple-600 transition-all duration-300">
                                                    {selectedConversation.name?.charAt(0)?.toUpperCase() || 'U'}
                                                </div>
                                                <span className="absolute -bottom-1 -right-1 size-4 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full border-3 border-white dark:border-slate-700 shadow-lg animate-pulse"></span>
                                            </div>
                                        </button>
                                        <div>
                                            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                                                {selectedConversation.name || selectedConversation.lastMessage?.content?.contactAdmin?.username || 'Unknown User'}
                                            </h3>
                                            <div className="flex items-center space-x-2">
                                                <div className="flex items-center space-x-1 text-emerald-600 dark:text-emerald-400">
                                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                                    <p className="text-sm font-medium">Online</p>
                                                </div>
                                                <span className="px-2 py-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs rounded-full font-semibold shadow-lg">
                                                    {selectedConversation.type}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        {renderIconButtons([Search])}
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    className="text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/50 size-10 rounded-xl transition-all duration-200"
                                                >
                                                    <MoreVertical size={20} />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem
                                                    onClick={handleArchiveConversation}
                                                    disabled={archiveLoading || selectedConversation?.status === E_ConversationStatus.ARCHIVED}
                                                    className="flex items-center space-x-2"
                                                >
                                                    <Archive size={16} />
                                                    <span>Archive Conversation</span>
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                            </header>

                            <MessageThread
                                key={`${selectedConversation.id}-${messageRefreshKey}`}
                                conversationId={selectedConversation.id!}
                                conversation={selectedConversation}
                                onUpdate={async () => {
                                    const result = await refetch();
                                    if (result.data?.getConversations?.result?.docs) {
                                        const updated = result.data.getConversations.result.docs.find(
                                            c => c?.id === selectedConversation.id,
                                        );
                                        if (updated) {
                                            setSelectedConversation(updated as T_Conversation);
                                        }
                                    }
                                    setMessageRefreshKey(prev => prev + 1);
                                }}
                            />

                            <footer className="p-6 border-t border-white/20 dark:border-slate-700/20 bg-gradient-to-r from-white/80 to-purple-50/80 dark:from-slate-800/80 dark:to-slate-700/80 backdrop-blur-sm">
                                <div className="flex items-center space-x-3">
                                    {renderIconButtons([Paperclip, ImageIcon])}
                                    <div className="flex-1 relative">
                                        <textarea
                                            value={newMessage}
                                            onChange={e => setNewMessage(e.target.value)}
                                            placeholder={selectedConversation ? 'Type your admin reply... (Shift+Enter to send)' : 'Select a conversation to reply'}
                                            className="w-full px-4 py-3 border-2 border-gray-200 dark:border-slate-600 rounded-xl focus:outline-none focus:border-purple-500 dark:focus:border-purple-400 focus:ring-4 focus:ring-purple-100 dark:focus:ring-purple-900/50 transition-all duration-300 bg-white/80 dark:bg-slate-700/80 backdrop-blur-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 resize-none overflow-hidden"
                                            rows={1}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && e.shiftKey) {
                                                    handleSendMessage();
                                                    e.preventDefault();
                                                }
                                            }}
                                            onInput={(e) => {
                                                const target = e.target as HTMLTextAreaElement;
                                                target.style.height = 'auto';
                                                target.style.height = `${Math.min(target.scrollHeight, 150)}px`;
                                            }}
                                        />
                                    </div>
                                    <Button
                                        variant="ghost"
                                        className="text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/50 p-2 rounded-xl transition-all duration-200"
                                    >
                                        <Smile size={20} />
                                    </Button>
                                    <Button
                                        onClick={handleSendMessage}
                                        disabled={!newMessage.trim() || isTyping || replyLoading || !selectedConversation}
                                        className={`p-3 rounded-xl transition-all duration-300 ${
                                            newMessage.trim() && !isTyping && !replyLoading && selectedConversation
                                                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transform hover:scale-105'
                                                : 'bg-gray-100 dark:bg-slate-600 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                                        }`}
                                    >
                                        {(isTyping || replyLoading)
                                            ? (
                                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                )
                                            : (
                                                    <Send size={20} />
                                                )}
                                    </Button>
                                </div>
                            </footer>
                        </main>
                    )
                : (
                        <section className="flex-1 flex flex-col items-center justify-center bg-gradient-to-br from-white/40 to-purple-50/40 dark:from-slate-800/40 dark:to-slate-700/40 backdrop-blur-sm text-center p-12">
                            <div className="max-w-md">
                                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl mb-8 shadow-2xl">
                                    <MessageSquare className="w-10 h-10 text-white" />
                                </div>
                                <h3 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-purple-800 to-pink-800 dark:from-white dark:via-purple-200 dark:to-pink-200 bg-clip-text text-transparent mb-4">
                                    Start a Conversation
                                </h3>
                                <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
                                    Choose a conversation from the list to start messaging and connect with your community.
                                </p>
                                <div className="mt-8 flex items-center justify-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                                    <div className="flex items-center space-x-2">
                                        <Users className="w-4 h-4" />
                                        <span>Active conversations</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <TrendingUp className="w-4 h-4" />
                                        <span>Real-time messaging</span>
                                    </div>
                                </div>
                            </div>
                        </section>
                    )}

            {/* Profile Sidebar */}
            {showProfile && selectedConversation && (
                <UserProfile
                    onClose={() => setShowProfile(false)}
                    conversation={selectedConversation}
                />
            )}
        </div>
    );
}

export default Messenger;
