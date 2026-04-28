import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';
import * as React from 'react';

import type { T_Conversation } from '#shared/graphql';

import { E_ConversationStatus } from '#shared/graphql';

const UNDERSCORE_RE = /_/g;

interface I_ConversationListProps {
    conversations: T_Conversation[];
    loading: boolean;
    selectedId: string | null;
    onSelect: (conversation: T_Conversation) => void;
}

function formatConversationDate(date: string | Date): string {
    const d = new Date(date);
    if (isToday(d)) {
        return format(d, 'HH:mm');
    }
    if (isYesterday(d)) {
        return 'Yesterday';
    }
    return format(d, 'dd/MM/yyyy');
}

function isNewConversation(conversation: T_Conversation): boolean {
    // Show "New" badge only if status is NEW
    return conversation.status === E_ConversationStatus.NEW;
}

function ConversationList({
    conversations,
    loading,
    selectedId,
    onSelect,
}: I_ConversationListProps) {
    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center p-8">
                <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!conversations.length) {
        return (
            <div className="flex-1 flex items-center justify-center p-8 text-center">
                <div>
                    <p className="text-gray-500 dark:text-gray-400 text-lg">No conversations found</p>
                    <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">Start a new conversation to get started</p>
                </div>
            </div>
        );
    }

    return (
        <ul className="flex-1 overflow-y-auto p-4 space-y-2">
            {conversations.map((c, index) => (
                <li
                    key={c.id}
                    role="button"
                    tabIndex={0}
                    className={`w-full p-4 rounded-2xl cursor-pointer transition-all duration-300 transform hover:scale-[1.02] ${
                        selectedId === c.id
                            ? 'bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/50 dark:to-pink-900/50 border-2 border-purple-200 dark:border-purple-600 shadow-lg'
                            : 'bg-white/60 dark:bg-slate-700/60 hover:bg-white/80 dark:hover:bg-slate-700/80 border-2 border-transparent hover:border-purple-100 dark:hover:border-purple-600'
                    } backdrop-blur-sm`}
                    onClick={() => onSelect(c)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            onSelect(c);
                        }
                    }}
                    style={{ animationDelay: `${index * 100}ms` }}
                >
                    <div className="flex items-center space-x-4">
                        <div className="relative">
                            <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center text-white font-bold text-lg ring-4 ring-white dark:ring-slate-700 shadow-lg">
                                {(c.name || c.lastMessage?.content?.contactAdmin?.username || 'U').charAt(0).toUpperCase()}
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full border-3 border-white dark:border-slate-700 shadow-lg animate-pulse" />
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex items-baseline justify-between mb-2">
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-gray-900 dark:text-gray-100 truncate text-base">
                                        {c.lastMessage?.content?.contactAdmin?.username
                                            || c.name
                                            || c.createdBy?.username
                                            || c.lastMessage?.content?.contactAdmin?.email
                                            || 'Unknown User'}
                                    </h3>
                                    {c.lastMessage?.content?.contactAdmin?.email && (
                                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                            {c.lastMessage.content.contactAdmin.email}
                                        </p>
                                    )}
                                </div>
                                <div className="text-right ml-2">
                                    <span className="text-xs text-gray-500 dark:text-gray-400 font-medium block">
                                        {c.updatedAt ? formatConversationDate(c.updatedAt) : ''}
                                    </span>
                                    {!isToday(new Date(c.updatedAt)) && (
                                        <span className="text-xs text-gray-400 dark:text-gray-500">
                                            {formatDistanceToNow(new Date(c.updatedAt), { addSuffix: true })}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-gray-600 dark:text-gray-300 truncate leading-relaxed mb-1">
                                        {c.lastMessage?.content?.contactAdmin?.message
                                            || c.lastMessage?.content?.value
                                            || 'No messages yet'}
                                    </p>
                                    <div className="flex items-center space-x-2 mt-1 flex-wrap gap-1">
                                        {/* Status Badge */}
                                        {c.status && (
                                            <span className={`px-2 py-0.5 text-xs rounded-full font-bold ${
                                                c.status === E_ConversationStatus.NEW
                                                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                                    : c.status === E_ConversationStatus.IN_PROGRESS
                                                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                                        : c.status === E_ConversationStatus.RESOLVED
                                                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                                            : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                                            }`}
                                            >
                                                {c.status}
                                            </span>
                                        )}
                                        {c.lastMessage?.content?.contactAdmin?.topic && (
                                            <span className="px-2 py-0.5 text-xs rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 font-medium">
                                                {c.lastMessage.content.contactAdmin.topic.replace(UNDERSCORE_RE, ' ')}
                                            </span>
                                        )}
                                        {c.lastMessage?.content?.contactAdmin?.requestType && (
                                            <span className="px-2 py-0.5 text-xs rounded-full bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 font-medium">
                                                {c.lastMessage.content.contactAdmin.requestType.replace(UNDERSCORE_RE, ' ')}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                {isNewConversation(c) && (
                                    <span className="ml-3 px-2.5 py-1 bg-gradient-to-r from-blue-600 to-blue-500 text-white text-xs rounded-full font-bold shadow-lg min-w-[20px] text-center animate-pulse">
                                        New
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </li>
            ))}
        </ul>
    );
}

export default React.memo(ConversationList);
