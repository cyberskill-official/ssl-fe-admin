import { format } from 'date-fns';
import { Clock, Eye, MessageSquare, Send, ShieldCheck, ShieldX, Sparkles, TrendingUp, UserCheck, Users, UserX, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';

import type { E_PushChatAudience } from '#shared/graphql';

import { Button, Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '#shared/component';
import { Editor } from '#shared/component/editor';
import { LexicalPreview } from '#shared/component/editor/preview';
import { usePortal } from '#shared/portal';

import { useGetPushChatMessages, useGetPushChatStats, useSendPushChat } from './push-chat.hook';

const audienceMap: Record<E_PushChatAudience, { label: string; badge: string; icon: any; description: string }> = {
    ALL: {
        label: 'All Profiles',
        badge: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white',
        icon: Users,
        description: 'Send to all users',
    },
    MEMBERS: {
        label: 'Members Only',
        badge: 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white',
        icon: UserCheck,
        description: 'Premium members only',
    },
    NON_MEMBERS: {
        label: 'Non-Members',
        badge: 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white',
        icon: UserX,
        description: 'Convert to members',
    },
    AGE_VERIFIED: {
        label: 'Age Verified',
        badge: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white',
        icon: ShieldCheck,
        description: 'Age verified users',
    },
    NOT_AGE_VERIFIED: {
        label: 'Not Age Verified',
        badge: 'bg-gradient-to-r from-rose-500 to-red-500 text-white',
        icon: ShieldX,
        description: 'Needs age verification',
    },
};

export default function PushChat() {
    const { setHeader } = usePortal();
    const [content, setContent] = useState('');
    const [targetAudience, setTargetAudience] = useState<E_PushChatAudience>('ALL' as E_PushChatAudience);
    const [showClearConfirm, setShowClearConfirm] = useState(false);
    const [editorKey, setEditorKey] = useState(0);

    // Hooks API
    const { messages, loading: loadingMessages, refetch: refetchMessages } = useGetPushChatMessages(
        { isDel: false },
        { sort: { createdAt: -1 }, limit: 50, page: 1, populate: 'sentBy' },
    );
    const { stats, loading: loadingStats, refetch: refetchStats } = useGetPushChatStats();
    const { sendPushChat, loading: sending } = useSendPushChat();

    useEffect(() => {
        setHeader({
            title: 'Push Chat',
            description: 'Connect with your audience instantly. Send targeted messages that drive engagement and conversions',
            icon: Zap,
        });
        return () => setHeader(null);
    }, [setHeader]);

    const clearContent = () => {
        setContent('');
        setEditorKey(prev => prev + 1);
        setShowClearConfirm(false);
    };

    const handleClear = () => {
        if (content.trim().length > 100) {
            setShowClearConfirm(true);
        }
        else {
            clearContent();
        }
    };

    const handleSubmit = async () => {
        if (!content.trim())
            return;

        const result = await sendPushChat({
            content: content.trim(),
            targetAudience,
        });

        if (result.data?.sendPushChat?.success) {
            setContent('');
            setEditorKey(prev => prev + 1);
            refetchMessages();
            refetchStats();
        }
    };

    const getAudienceLabel = (a: E_PushChatAudience) => audienceMap[a]?.label || a;
    const getAudienceBadgeClass = (a: E_PushChatAudience) => audienceMap[a]?.badge || '';
    const getAudienceIcon = (a: E_PushChatAudience) => audienceMap[a]?.icon || MessageSquare;

    const characterCount = content.length;
    const maxCharacters = 500;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-6">
            <div className="grid lg:grid-cols-3 gap-8">
                {/* Left Column - Message Creation */}
                <div className="lg:col-span-2">
                    <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-white/20 dark:border-slate-700/20">
                        {/* Audience Selector */}
                        <div className="mb-8">
                            <label className="block text-sm font-semibold mb-4 text-gray-700 dark:text-gray-200 uppercase tracking-wide">
                                Target Audience
                            </label>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {(['ALL', 'MEMBERS', 'NON_MEMBERS', 'AGE_VERIFIED', 'NOT_AGE_VERIFIED'] as E_PushChatAudience[]).map((key) => {
                                    const config = audienceMap[key];
                                    const IconComponent = config.icon;
                                    const isSelected = targetAudience === key;
                                    return (
                                        <button
                                            key={key}
                                            type="button"
                                            onClick={() => setTargetAudience(key)}
                                            className={`relative p-6 rounded-xl border-2 transition-all duration-300 hover:scale-105 ${isSelected
                                                ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/50 dark:to-pink-900/50 shadow-lg'
                                                : 'border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 hover:border-gray-300 dark:hover:border-slate-500'
                                            }`}
                                        >
                                            <div className="flex items-center space-x-3">
                                                <div className={`p-2 rounded-lg ${isSelected ? 'bg-purple-100 dark:bg-purple-800' : 'bg-gray-100 dark:bg-slate-600'}`}>
                                                    <IconComponent className={`w-5 h-5 ${isSelected ? 'text-purple-600 dark:text-purple-300' : 'text-gray-600 dark:text-gray-300'}`} />
                                                </div>
                                                <div className="text-left">
                                                    <div className={`font-semibold ${isSelected ? 'text-purple-900 dark:text-purple-100' : 'text-gray-900 dark:text-gray-100'}`}>
                                                        {config.label}
                                                    </div>
                                                    <div className="text-xs text-gray-500 dark:text-gray-400">{config.description}</div>
                                                </div>
                                            </div>
                                            {isSelected && (
                                                <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                                                    <Sparkles className="w-3 h-3 text-white" />
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Message Content */}
                        <div className="mb-8">
                            <label className="block text-sm font-semibold mb-4 text-gray-700 dark:text-gray-200 uppercase tracking-wide">
                                Message Content
                            </label>
                            <div className="relative">
                                <Editor
                                    key={editorKey}
                                    value={content}
                                    onChange={setContent}
                                    showToolbar={true}
                                    className="border-2 border-gray-200 dark:border-slate-600 rounded-xl bg-white/80 dark:bg-slate-700/80 backdrop-blur-sm"
                                    contentClassName="min-h-[192px] outline-none p-4 text-gray-700 dark:text-gray-100"
                                />
                                <div className="absolute bottom-4 right-4 flex items-center space-x-2">
                                    <div className={`text-xs px-2 py-1 rounded-full ${characterCount > maxCharacters * 0.8
                                        ? 'bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400'
                                        : 'bg-gray-100 dark:bg-slate-600 text-gray-500 dark:text-gray-400'
                                    }`}
                                    >
                                        {characterCount}
                                        /
                                        {maxCharacters}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex justify-between items-center">
                            <Button
                                variant="outline"
                                onClick={handleClear}
                                className="px-6 py-3 rounded-xl border-2 hover:bg-red-50 dark:hover:bg-red-900/50 hover:border-red-300 dark:hover:border-red-600 transition-all duration-300"
                            >
                                Clear
                            </Button>
                            <Button
                                disabled={!content.trim() || sending}
                                onClick={handleSubmit}
                                className="px-8 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {sending
                                    ? (
                                            <div className="flex items-center space-x-2">
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                <span>Sending...</span>
                                            </div>
                                        )
                                    : (
                                            <div className="flex items-center space-x-2">
                                                <Send className="w-4 h-4" />
                                                <span>Send Push Chat</span>
                                            </div>
                                        )}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Right Column - Stats & Quick Actions */}
                <div className="space-y-6">
                    {/* Stats Cards */}
                    <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20 dark:border-slate-700/20">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center">
                            <TrendingUp className="w-5 h-5 mr-2 text-purple-600 dark:text-purple-400" />
                            Quick Stats
                        </h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/50 dark:to-pink-900/50 rounded-lg">
                                <span className="text-sm text-gray-600 dark:text-gray-300">Total Sent</span>
                                <span className="font-bold text-purple-600 dark:text-purple-400">
                                    {loadingStats ? '...' : stats?.totalSent || 0}
                                </span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/50 dark:to-teal-900/50 rounded-lg">
                                <span className="text-sm text-gray-600 dark:text-gray-300">This Month</span>
                                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                    {loadingStats ? '...' : stats?.thisMonth || 0}
                                </span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/50 dark:to-cyan-900/50 rounded-lg">
                                <span className="text-sm text-gray-600 dark:text-gray-300">Avg. Length</span>
                                <span className="font-bold text-blue-600 dark:text-blue-400">
                                    {loadingStats ? '...' : stats?.avgLength || 0}
                                    {' '}
                                    chars
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Audience Distribution */}
                    <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/20 dark:border-slate-700/20">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center">
                            <Users className="w-5 h-5 mr-2 text-purple-600 dark:text-purple-400" />
                            Audience Distribution
                        </h3>
                        <div className="space-y-3">
                            {loadingStats
                                ? (
                                        <div className="text-center text-gray-500 dark:text-gray-400 py-4">Loading...</div>
                                    )
                                : (
                                        <>
                                            {[
                                                { key: 'ALL', count: stats?.audienceDistribution?.all || 0, config: audienceMap.ALL },
                                                { key: 'MEMBERS', count: stats?.audienceDistribution?.members || 0, config: audienceMap.MEMBERS },
                                                { key: 'NON_MEMBERS', count: stats?.audienceDistribution?.nonMembers || 0, config: audienceMap.NON_MEMBERS },
                                            ].map(({ key, count, config }) => {
                                                const total = (stats?.totalSent || 0);
                                                const percentage = total > 0 ? (count / total) * 100 : 0;
                                                return (
                                                    <div key={key} className="space-y-2">
                                                        <div className="flex justify-between text-sm">
                                                            <span className="text-gray-600 dark:text-gray-300">{config.label}</span>
                                                            <span className="font-semibold text-gray-900 dark:text-gray-100">{count}</span>
                                                        </div>
                                                        <div className="w-full bg-gray-200 dark:bg-slate-600 rounded-full h-2">
                                                            <div
                                                                className={`h-2 rounded-full transition-all duration-500 ${config.badge.replace('text-white', '')}`}
                                                                style={{ width: `${percentage}%` }}
                                                            >
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </>
                                    )}
                        </div>
                    </div>
                </div>
            </div>
            {/* Sent Messages Section */}
            <div className="mt-12">
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center">
                        <Clock className="w-6 h-6 mr-3 text-purple-600 dark:text-purple-400" />
                        Recent Messages
                    </h2>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                        {messages.length}
                        {' '}
                        message
                        {messages.length !== 1 ? 's' : ''}
                        {' '}
                        sent
                    </div>
                </div>

                <div className="grid gap-6">
                    {loadingMessages
                        ? (
                                <div className="text-center text-gray-500 dark:text-gray-400 py-12">Loading messages...</div>
                            )
                        : messages.length === 0
                            ? (
                                    <div className="text-center text-gray-500 dark:text-gray-400 py-12">No messages sent yet</div>
                                )
                            : (
                                    messages.map((msg, index) => {
                                        if (!msg.createdAt || !msg.targetAudience)
                                            return null;
                                        const formattedDate = format(new Date(msg.createdAt), 'PPpp');
                                        const IconComponent = getAudienceIcon(msg.targetAudience);
                                        return (
                                            <div
                                                key={msg.id}
                                                className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 dark:border-slate-700/20 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                                                style={{ animationDelay: `${index * 100}ms` }}
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1 space-y-4">
                                                        <div className="flex items-center space-x-4">
                                                            <div className="p-2 rounded-lg bg-gray-100 dark:bg-slate-600">
                                                                <IconComponent className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                                                            </div>
                                                            <div className="flex-1">
                                                                <div className="flex items-center space-x-3 mb-2">
                                                                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getAudienceBadgeClass(msg.targetAudience)}`}>
                                                                        {getAudienceLabel(msg.targetAudience)}
                                                                    </span>
                                                                    <time className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                                                                        <Clock className="w-3 h-3 mr-1" />
                                                                        {formattedDate}
                                                                    </time>
                                                                    <span className="text-sm text-gray-500 dark:text-gray-400">
                                                                        {msg.recipientCount || 0}
                                                                        {' '}
                                                                        recipients
                                                                    </span>
                                                                </div>
                                                                <div className="text-gray-700 dark:text-gray-200 leading-relaxed line-clamp-2">
                                                                    <LexicalPreview content={msg.content || ''} className="" />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Detail Dialog */}
                                                    <Dialog>
                                                        <DialogTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                aria-label="View message"
                                                                className="p-2 hover:bg-purple-100 dark:hover:bg-purple-900/50 hover:text-purple-600 dark:hover:text-purple-400 transition-colors duration-200"
                                                            >
                                                                <Eye className="w-5 h-5" />
                                                            </Button>
                                                        </DialogTrigger>
                                                        <DialogContent className="max-w-2xl bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm border border-white/20 dark:border-slate-700/20">
                                                            <DialogHeader>
                                                                <DialogTitle className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center">
                                                                    <MessageSquare className="w-5 h-5 mr-2 text-purple-600 dark:text-purple-400" />
                                                                    Push Chat Message
                                                                </DialogTitle>
                                                                <DialogClose asChild>
                                                                    <Button
                                                                        variant="ghost"
                                                                        className="absolute right-4 top-4 p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg"
                                                                        aria-label="Close dialog"
                                                                    >
                                                                        ×
                                                                    </Button>
                                                                </DialogClose>
                                                            </DialogHeader>
                                                            <div className="space-y-6">
                                                                <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/50 dark:to-pink-900/50 rounded-xl p-6">
                                                                    <LexicalPreview content={msg.content || ''} className="prose max-w-none text-gray-700 dark:text-gray-200 leading-relaxed" />
                                                                </div>
                                                                <footer className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-slate-600">
                                                                    <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                                                                        <Clock className="w-4 h-4" />
                                                                        <span>{formattedDate}</span>
                                                                    </div>
                                                                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getAudienceBadgeClass(msg.targetAudience)}`}>
                                                                        {getAudienceLabel(msg.targetAudience)}
                                                                    </span>
                                                                </footer>
                                                            </div>
                                                        </DialogContent>
                                                    </Dialog>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                </div>
            </div>
            {/* Clear Confirmation Dialog */}
            <Dialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
                <DialogContent className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm border border-white/20 dark:border-slate-700/20">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-gray-800 dark:text-gray-100">Confirm Clear</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <p className="text-gray-600 dark:text-gray-300">The content is quite long. Are you sure you want to clear it?</p>
                    </div>
                    <DialogFooter className="mt-6 flex justify-end space-x-3">
                        <Button
                            variant="outline"
                            onClick={() => setShowClearConfirm(false)}
                            className="px-6 py-2 rounded-xl"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={clearContent}
                            className="px-6 py-2 rounded-xl bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white"
                        >
                            Yes, Clear
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
