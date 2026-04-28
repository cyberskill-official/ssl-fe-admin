import { toast } from '@cyberskill/shared/react/toast';
import { format } from 'date-fns';
import { Archive, CheckCircle, ChevronDown, ChevronUp, Clock, ExternalLink, Flag, Info, Mail, MessageCircle, Tag, User } from 'lucide-react';
import * as React from 'react';
import { useState } from 'react';

import { Button, Dialog, DialogContent, DialogHeader, DialogTitle, Input } from '#shared/component';
import { LexicalPreview } from '#shared/component/editor/preview';
import { E_ConversationStatus, E_NoteType, E_ReportStatus, E_ReportType } from '#shared/graphql';

import { useAuth } from '../../authn';
import { useCreateReport } from '../../moderation/report/report.hook';
import { useArchiveConversation, useGetMessages, useResolveConversation, useUpdateConversationStatus } from '../message.hook';

const UNDERSCORE_RE = /_/g;

interface I_MessageThreadProps {
    conversationId: string;
    conversation?: any;
    onUpdate?: () => void;
}

function MessageThread({ conversationId, conversation, onUpdate }: I_MessageThreadProps) {
    const { auth } = useAuth();
    const [notes, setNotes] = useState(() => conversation?.notes || '');
    const [showStatusPanel, setShowStatusPanel] = useState(false);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [reportKeyword, setReportKeyword] = useState('');
    const [reportComment, setReportComment] = useState('');
    const [reportTargetUserId, setReportTargetUserId] = useState<string | null>(null);

    const { messages, loading } = useGetMessages(
        { conversationId },
        { sort: { createdAt: 1 }, limit: 50 },
    );

    const { updateStatus, loading: updateStatusLoading } = useUpdateConversationStatus();
    const { resolve, loading: resolveLoading } = useResolveConversation();
    const { archive, loading: archiveLoading } = useArchiveConversation();
    const { createReport, loading: createReportLoading } = useCreateReport();

    const currentStatus = conversation?.status || E_ConversationStatus.NEW;

    const handleStatusChange = async (status: E_ConversationStatus) => {
        try {
            const result = await updateStatus(conversationId, status, undefined, notes || undefined);
            if (result?.data?.updateConversationStatus?.success) {
                // Clear notes immediately after successful update
                setNotes('');
                // Refetch to get latest data from server
                await onUpdate?.();
            }
        }
        catch (error) {
            console.error('Failed to update status:', error);
        }
    };

    const handleResolve = async () => {
        try {
            const result = await resolve(conversationId, notes || undefined);
            if (result?.data?.resolveConversation?.success) {
                // Clear notes immediately after successful update
                setNotes('');
                // Refetch to get latest data from server
                await onUpdate?.();
            }
        }
        catch (error) {
            console.error('Failed to resolve:', error);
        }
    };

    const handleArchive = async () => {
        try {
            await archive(conversationId);
            onUpdate?.();
        }
        catch (error) {
            console.error('Failed to archive:', error);
        }
    };

    if (loading) {
        return (
            <div className="flex-1 overflow-y-auto p-8 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
            </div>
        );
    }

    // Check for initial support/contact message
    const contactAdmin = conversation?.lastMessage?.content?.contactAdmin;

    if (messages.length === 0 && contactAdmin?.message) {
        return (
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {/* Show initial contact message with full details */}
                <div className="flex justify-start animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
                    <div className="flex flex-col max-w-[85%]">
                        {/* Sender name */}
                        <div className="mb-1 text-left">
                            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                                {contactAdmin.username || contactAdmin.email}
                            </span>
                        </div>

                        {/* Message bubble with full form data */}
                        <div className="bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 rounded-2xl rounded-bl-md shadow-lg border border-gray-100 dark:border-slate-600 backdrop-blur-sm overflow-hidden">
                            {/* Support Form Details Section */}
                            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-slate-800 dark:to-slate-700 px-6 py-4 border-b border-gray-200 dark:border-slate-600">
                                <div className="flex items-center gap-2 mb-3">
                                    <Info className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                    <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">Support Request Details</h4>
                                </div>

                                <div className="grid grid-cols-1 gap-3">
                                    {/* Topic */}
                                    {contactAdmin.topic && (
                                        <div className="flex items-start gap-3">
                                            <div className="mt-0.5">
                                                <Tag className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-0.5">Topic</div>
                                                <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                                    {contactAdmin.topic.replace(UNDERSCORE_RE, ' ')}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Username */}
                                    {contactAdmin.username && (
                                        <div className="flex items-start gap-3">
                                            <div className="mt-0.5">
                                                <User className="w-4 h-4 text-green-600 dark:text-green-400" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-0.5">Username</div>
                                                <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 break-words">
                                                    {contactAdmin.username}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Email */}
                                    {contactAdmin.email && (
                                        <div className="flex items-start gap-3">
                                            <div className="mt-0.5">
                                                <Mail className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-0.5">Email</div>
                                                <div className="text-sm font-medium text-gray-900 dark:text-gray-100 break-all">
                                                    {contactAdmin.email}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Request Type */}
                                    {contactAdmin.requestType && (
                                        <div className="flex items-start gap-3">
                                            <div className="mt-0.5">
                                                <MessageCircle className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-0.5">Request Type</div>
                                                <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                                    {contactAdmin.requestType.replace(UNDERSCORE_RE, ' ')}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Profile Link */}
                                    {contactAdmin.profileLink && (
                                        <div className="flex items-start gap-3">
                                            <div className="mt-0.5">
                                                <ExternalLink className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-0.5">Profile Link</div>
                                                <a
                                                    href={contactAdmin.profileLink}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline break-all inline-flex items-center gap-1"
                                                >
                                                    {contactAdmin.profileLink}
                                                    <ExternalLink className="w-3 h-3 flex-shrink-0" />
                                                </a>
                                            </div>
                                        </div>
                                    )}

                                    {/* Transaction ID (if exists) */}
                                    {contactAdmin.transactionId && (
                                        <div className="flex items-start gap-3">
                                            <div className="mt-0.5">
                                                <Tag className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-0.5">Transaction ID</div>
                                                <div className="text-sm font-mono text-gray-900 dark:text-gray-100 break-all">
                                                    {contactAdmin.transactionId}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Payment Date (if exists) */}
                                    {contactAdmin.paymentDate && (
                                        <div className="flex items-start gap-3">
                                            <div className="mt-0.5">
                                                <Tag className="w-4 h-4 text-pink-600 dark:text-pink-400" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-0.5">Payment Date</div>
                                                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                    {contactAdmin.paymentDate}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Message Content Section */}
                            <div className="px-6 py-4">
                                <div className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-2">Message</div>
                                <div className="text-sm leading-relaxed">
                                    {contactAdmin.message && contactAdmin.message.startsWith('{')
                                        ? (
                                                <LexicalPreview
                                                    content={contactAdmin.message}
                                                    className="text-gray-900 dark:text-gray-100"
                                                />
                                            )
                                        : <p className="text-gray-900 dark:text-gray-100">{contactAdmin.message}</p>}
                                </div>

                                {/* Display image if available */}
                                {contactAdmin.image && (
                                    <div className="mt-4">
                                        <div className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-2">Attachment</div>
                                        <img
                                            src={contactAdmin.image}
                                            alt="Help & Support attachment"
                                            className="max-w-full h-auto rounded-lg border border-gray-200 dark:border-slate-600 cursor-zoom-in hover:opacity-90 transition-opacity shadow-md"
                                            onClick={(e) => {
                                                const img = e.currentTarget;
                                                if (img.requestFullscreen) {
                                                    img.requestFullscreen();
                                                }
                                            }}
                                            loading="lazy"
                                        />
                                    </div>
                                )}

                                <p className="text-xs mt-3 text-gray-500 dark:text-gray-400 font-medium">
                                    {conversation.createdAt ? format(new Date(conversation.createdAt), 'HH:mm') : ''}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (messages.length === 0) {
        return (
            <div className="flex-1 overflow-y-auto p-8 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-slate-600 dark:to-slate-500 rounded-2xl flex items-center justify-center mb-4 mx-auto">
                        <div className="w-8 h-8 bg-gray-400 dark:bg-gray-500 rounded-full"></div>
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 font-medium">No messages yet</p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Start the conversation!</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((message, index) => {
                const isFromAdmin = message.sender?.username?.toLowerCase().includes('admin')
                    || message.sender?.email?.toLowerCase().includes('admin')
                    || false;

                const senderName = message.sender?.username || message.sender?.email || 'Unknown';
                const adminName = auth?.user?.username || auth?.user?.email || 'Admin';
                const isTextMessage = message.content?.type === 'TEXT' || message.content?.type?.toUpperCase() === 'TEXT';

                // Check if this message has contactAdmin data (support request)
                const contactAdmin = message.content?.contactAdmin;

                // Render support request message with full details
                if (contactAdmin && index === 0) {
                    return (
                        <div
                            key={message.id}
                            className="flex justify-start animate-in fade-in-0 slide-in-from-bottom-2 duration-300"
                        >
                            <div className="flex flex-col max-w-[85%]">
                                {/* Sender name */}
                                <div className="mb-1 text-left">
                                    <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                                        {contactAdmin.username || contactAdmin.email || senderName}
                                    </span>
                                </div>

                                {/* Message bubble with full form data */}
                                <div className="bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 rounded-2xl rounded-bl-md shadow-lg border border-gray-100 dark:border-slate-600 backdrop-blur-sm overflow-hidden">
                                    {/* Support Form Details Section */}
                                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-slate-800 dark:to-slate-700 px-6 py-4 border-b border-gray-200 dark:border-slate-600">
                                        <div className="flex items-center gap-2 mb-3">
                                            <Info className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                            <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">Support Request Details</h4>
                                        </div>

                                        <div className="grid grid-cols-1 gap-3">
                                            {/* Topic */}
                                            {contactAdmin.topic && (
                                                <div className="flex items-start gap-3">
                                                    <div className="mt-0.5">
                                                        <Tag className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-0.5">Topic</div>
                                                        <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                                            {contactAdmin.topic.replace(UNDERSCORE_RE, ' ')}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Username */}
                                            {contactAdmin.username && (
                                                <div className="flex items-start gap-3">
                                                    <div className="mt-0.5">
                                                        <User className="w-4 h-4 text-green-600 dark:text-green-400" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-0.5">Username</div>
                                                        <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 break-words">
                                                            {contactAdmin.username}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Email */}
                                            {contactAdmin.email && (
                                                <div className="flex items-start gap-3">
                                                    <div className="mt-0.5">
                                                        <Mail className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-0.5">Email</div>
                                                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100 break-all">
                                                            {contactAdmin.email}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Request Type */}
                                            {contactAdmin.requestType && (
                                                <div className="flex items-start gap-3">
                                                    <div className="mt-0.5">
                                                        <MessageCircle className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-0.5">Request Type</div>
                                                        <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                                            {contactAdmin.requestType.replace(UNDERSCORE_RE, ' ')}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Profile Link */}
                                            {contactAdmin.profileLink && (
                                                <div className="flex items-start gap-3">
                                                    <div className="mt-0.5">
                                                        <ExternalLink className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-0.5">Profile Link</div>
                                                        <a
                                                            href={contactAdmin.profileLink}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline break-all inline-flex items-center gap-1"
                                                        >
                                                            {contactAdmin.profileLink}
                                                            <ExternalLink className="w-3 h-3 flex-shrink-0" />
                                                        </a>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Transaction ID */}
                                            {contactAdmin.transactionId && (
                                                <div className="flex items-start gap-3">
                                                    <div className="mt-0.5">
                                                        <Tag className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-0.5">Transaction ID</div>
                                                        <div className="text-sm font-mono text-gray-900 dark:text-gray-100 break-all">
                                                            {contactAdmin.transactionId}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Payment Date */}
                                            {contactAdmin.paymentDate && (
                                                <div className="flex items-start gap-3">
                                                    <div className="mt-0.5">
                                                        <Tag className="w-4 h-4 text-pink-600 dark:text-pink-400" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-0.5">Payment Date</div>
                                                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                            {contactAdmin.paymentDate}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Message Content Section */}
                                    <div className="px-6 py-4">
                                        <div className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-2">Message</div>
                                        <div className="text-sm leading-relaxed">
                                            {contactAdmin.message && contactAdmin.message.startsWith('{')
                                                ? (
                                                        <LexicalPreview
                                                            content={contactAdmin.message}
                                                            className="text-gray-900 dark:text-gray-100"
                                                        />
                                                    )
                                                : <p className="text-gray-900 dark:text-gray-100">{contactAdmin.message}</p>}
                                        </div>

                                        {/* Display image if available */}
                                        {contactAdmin.image && (
                                            <div className="mt-4">
                                                <div className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-2">Attachment</div>
                                                <img
                                                    src={contactAdmin.image}
                                                    alt="Help & Support attachment"
                                                    className="max-w-full h-auto rounded-lg border border-gray-200 dark:border-slate-600 cursor-zoom-in hover:opacity-90 transition-opacity shadow-md"
                                                    onClick={(e) => {
                                                        const img = e.currentTarget;
                                                        if (img.requestFullscreen) {
                                                            img.requestFullscreen();
                                                        }
                                                    }}
                                                    loading="lazy"
                                                />
                                            </div>
                                        )}

                                        <p className="text-xs mt-3 text-gray-500 dark:text-gray-400 font-medium">
                                            {message.createdAt ? format(new Date(message.createdAt), 'HH:mm') : ''}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                }

                // Regular message rendering
                return (
                    <div
                        key={message.id}
                        className={`flex ${
                            isFromAdmin ? 'justify-end' : 'justify-start'
                        } animate-in fade-in-0 slide-in-from-bottom-2 duration-300`}
                        style={{ animationDelay: `${index * 100}ms` }}
                    >
                        <div className="flex flex-col max-w-[70%]">
                            {/* Sender name */}
                            <div className={`mb-1 ${isFromAdmin ? 'text-right' : 'text-left'}`}>
                                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                                    {isFromAdmin ? adminName : senderName}
                                </span>
                            </div>

                            {/* Message bubble */}
                            <div
                                className={`${
                                    isFromAdmin
                                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl rounded-br-md shadow-lg'
                                        : 'bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 rounded-2xl rounded-bl-md shadow-lg border border-gray-100 dark:border-slate-600'
                                } px-6 py-3 backdrop-blur-sm`}
                            >
                                {isTextMessage && (
                                    <div className="flex justify-end mb-2">
                                        <Button
                                            variant="ghost"
                                            onClick={() => {
                                                setReportTargetUserId(message.senderId || null);
                                                setIsReportModalOpen(true);
                                            }}
                                            className="text-yellow-600 hover:text-yellow-700 dark:text-yellow-400 dark:hover:text-yellow-300"
                                            title="Report keyword"
                                            aria-label="Report keyword"
                                        >
                                            <Flag size={14} />
                                            <span className="ml-2">Report</span>
                                        </Button>
                                    </div>
                                )}
                                {/* Message content */}
                                {(message.content?.type === 'TEXT' || message.content?.type?.toUpperCase() === 'TEXT') && (
                                    <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                                        {message.content.value && message.content.value.startsWith('{')
                                            ? (
                                                    <LexicalPreview
                                                        content={message.content.value}
                                                        className={isFromAdmin ? 'text-white' : 'text-gray-900 dark:text-gray-100'}
                                                    />
                                                )
                                            : <p>{message.content.value}</p>}
                                    </div>
                                )}
                                {(message.content?.type === 'IMAGE' || message.content?.type?.toUpperCase() === 'IMAGE') && message.content.value && (
                                    <div className="mt-2">
                                        <img
                                            src={message.content.value}
                                            alt="Message attachment"
                                            className="max-w-full max-h-96 h-auto rounded-lg cursor-zoom-in hover:opacity-90 transition-opacity shadow-md"
                                            onClick={() => {
                                                window.open(message.content?.value || '', '_blank', 'noopener,noreferrer');
                                            }}
                                            loading="lazy"
                                            onError={(e) => {
                                                const target = e.target as HTMLImageElement;
                                                target.style.display = 'none';
                                                const errorDiv = document.createElement('div');
                                                errorDiv.className = 'text-sm text-red-500 p-2 bg-red-50 dark:bg-red-900/20 rounded';
                                                errorDiv.textContent = 'Failed to load image';
                                                target.parentElement?.appendChild(errorDiv);
                                            }}
                                        />
                                    </div>
                                )}
                                {(message.content?.type === 'VIDEO' || message.content?.type?.toUpperCase() === 'VIDEO') && message.content.value && (
                                    <div className="mt-2">
                                        <video
                                            src={message.content.value}
                                            controls
                                            className="max-w-full max-h-96 h-auto rounded-lg shadow-md"
                                            preload="metadata"
                                            onError={(e) => {
                                                const target = e.target as HTMLVideoElement;
                                                target.style.display = 'none';
                                                const errorDiv = document.createElement('div');
                                                errorDiv.className = 'text-sm text-red-500 p-2 bg-red-50 dark:bg-red-900/20 rounded';
                                                errorDiv.textContent = 'Failed to load video';
                                                target.parentElement?.appendChild(errorDiv);
                                            }}
                                        />
                                    </div>
                                )}

                                {/* Timestamp */}
                                <p
                                    className={`text-xs mt-2 ${
                                        isFromAdmin ? 'text-purple-200' : 'text-gray-500 dark:text-gray-400'
                                    } font-medium`}
                                >
                                    {message.createdAt ? format(new Date(message.createdAt), 'HH:mm') : ''}
                                </p>
                            </div>
                        </div>
                    </div>
                );
            })}

            <Dialog
                open={isReportModalOpen}
                onOpenChange={setIsReportModalOpen}
            >
                <DialogContent className="!p-6" aria-label="Report keyword modal">
                    <DialogHeader>
                        <DialogTitle>Report keyword</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                                Keyword
                            </label>
                            <Input
                                value={reportKeyword}
                                onChange={e => setReportKeyword(e.target.value)}
                                placeholder="Enter keyword"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                                Comment (optional)
                            </label>
                            <textarea
                                value={reportComment}
                                onChange={e => setReportComment(e.target.value)}
                                rows={3}
                                className="w-full rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 px-4 py-3 outline-none border border-gray-200 dark:border-slate-600"
                                placeholder="Add more context"
                            />
                        </div>
                        <div className="flex justify-end gap-3">
                            <Button
                                variant="ghost"
                                className="rounded-full"
                                onClick={() => setIsReportModalOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="default"
                                className="rounded-full"
                                onClick={async () => {
                                    const keyword = reportKeyword.trim();
                                    if (!keyword || keyword.length < 2) {
                                        toast.error('Keyword must be at least 2 characters.');
                                        return;
                                    }
                                    if (!auth?.user?.id || !reportTargetUserId)
                                        return;
                                    const notes = reportComment.trim()
                                        ? [
                                                {
                                                    type: E_NoteType.USER_REPORT,
                                                    content: reportComment.trim(),
                                                    createdById: auth.user.id,
                                                },
                                            ]
                                        : undefined;
                                    const result = await createReport({
                                        type: E_ReportType.KEYWORD,
                                        reportedByIds: [auth.user.id],
                                        targetId: reportTargetUserId,
                                        content: keyword,
                                        status: E_ReportStatus.PENDING,
                                        notes,
                                    });
                                    if (result?.data?.createReport?.success) {
                                        setIsReportModalOpen(false);
                                        setReportKeyword('');
                                        setReportComment('');
                                        setReportTargetUserId(null);
                                    }
                                }}
                                disabled={createReportLoading}
                            >
                                {createReportLoading ? 'Submitting...' : 'Submit'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Conversation Management Actions - Collapsible */}
            <div className="sticky bottom-0 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm border-t border-gray-200 dark:border-slate-600 shadow-lg">
                {/* Toggle Button */}
                <div className="p-3 flex justify-center">
                    <Button
                        onClick={() => setShowStatusPanel(!showStatusPanel)}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                        {showStatusPanel ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                        {showStatusPanel ? 'Hide' : 'Manage Status'}
                    </Button>
                </div>

                {/* Collapsible Panel */}
                {showStatusPanel && (
                    <div className="p-4 border-t border-gray-200 dark:border-slate-600 animate-in slide-in-from-bottom-2 duration-200">
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                                <div className="mb-3">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Status:</span>
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                            currentStatus === E_ConversationStatus.NEW
                                                ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
                                                : currentStatus === E_ConversationStatus.IN_PROGRESS
                                                    ? 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300'
                                                    : currentStatus === E_ConversationStatus.RESOLVED
                                                        ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300'
                                                        : 'bg-gray-100 dark:bg-gray-900/50 text-gray-700 dark:text-gray-300'
                                        }`}
                                        >
                                            {currentStatus === E_ConversationStatus.NEW && '🔵 New Message'}
                                            {currentStatus === E_ConversationStatus.IN_PROGRESS && '⏳ In Progress'}
                                            {currentStatus === E_ConversationStatus.RESOLVED && '✅ Resolved'}
                                            {currentStatus === E_ConversationStatus.ARCHIVED && '📦 Archived'}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {currentStatus === E_ConversationStatus.NEW && 'New support message not yet read'}
                                        {currentStatus === E_ConversationStatus.IN_PROGRESS && 'Processing customer support request'}
                                        {currentStatus === E_ConversationStatus.RESOLVED && 'Resolved and ready to archive'}
                                        {currentStatus === E_ConversationStatus.ARCHIVED && 'Archived in storage'}
                                    </p>
                                </div>

                                {/* Display existing notes if any */}
                                {conversation?.notes && (
                                    <div className="mb-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                                        <p className="text-xs font-semibold text-amber-800 dark:text-amber-300 mb-1">Previous notes:</p>
                                        <p className="text-sm text-amber-900 dark:text-amber-100 whitespace-pre-wrap">{conversation.notes}</p>
                                    </div>
                                )}

                                <textarea
                                    value={notes}
                                    onChange={e => setNotes(e.target.value)}
                                    placeholder="Add new internal notes (optional)..."
                                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent resize-none"
                                    rows={2}
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                {(currentStatus === E_ConversationStatus.NEW || currentStatus === E_ConversationStatus.IN_PROGRESS) && (
                                    <Button
                                        onClick={() => handleStatusChange(E_ConversationStatus.IN_PROGRESS)}
                                        disabled={updateStatusLoading}
                                        className="flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        title="Mark as in progress"
                                    >
                                        <Clock size={16} />
                                        {currentStatus === E_ConversationStatus.NEW ? 'Start Processing' : 'In Progress'}
                                    </Button>
                                )}

                                {currentStatus === E_ConversationStatus.IN_PROGRESS && (
                                    <Button
                                        onClick={handleResolve}
                                        disabled={resolveLoading}
                                        className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        title="Mark as resolved"
                                    >
                                        <CheckCircle size={16} />
                                        Resolve
                                    </Button>
                                )}

                                {currentStatus === E_ConversationStatus.RESOLVED && (
                                    <Button
                                        onClick={handleArchive}
                                        disabled={archiveLoading}
                                        className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        title="Archive conversation"
                                    >
                                        <Archive size={16} />
                                        Archive
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

        </div>
    );
}

export default React.memo(MessageThread);
