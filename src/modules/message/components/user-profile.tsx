import { Calendar, Clock, Flag, Mail, MapPin, Phone, Shield, Star, Users, X } from 'lucide-react';
import * as React from 'react';

import type { T_Conversation } from '#shared/graphql';

import { Button } from '#shared/component';

const UNDERSCORE_RE = /_/g;

interface I_UserProfileProps {
    onClose: () => void;
    conversation: T_Conversation;
}

function UserProfile({ onClose, conversation }: I_UserProfileProps) {
    const userInfo = conversation.lastMessage?.content?.contactAdmin;
    const displayName = conversation.name || userInfo?.username || 'Unknown User';

    return (
        <div className="w-96 border-l border-white/20 dark:border-slate-700/20 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm">
            <div className="p-6 border-b border-white/20 dark:border-slate-700/20 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-slate-800/80 dark:to-slate-700/80">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold bg-gradient-to-r from-gray-900 via-purple-800 to-pink-800 dark:from-white dark:via-purple-200 dark:to-pink-200 bg-clip-text text-transparent">
                        User Profile
                    </h3>
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 p-2 rounded-xl transition-all duration-200"
                    >
                        <X size={20} />
                    </Button>
                </div>
            </div>

            <div className="p-6 space-y-6">
                {/* Profile Header */}
                <div className="text-center">
                    <div className="relative inline-block mb-4">
                        <div className="size-28 rounded-3xl bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center text-white text-4xl font-bold ring-4 ring-white dark:ring-slate-700 shadow-2xl">
                            {displayName.charAt(0).toUpperCase()}
                        </div>
                        <div className="absolute -bottom-2 -right-2 size-6 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full border-3 border-white dark:border-slate-700 shadow-lg animate-pulse"></div>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">{displayName}</h2>
                    <div className="flex items-center justify-center space-x-2">
                        <Shield className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        <p className="text-sm font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wide">
                            {conversation.type}
                        </p>
                    </div>
                    {conversation.createdBy && (
                        <div className="mt-2 text-center">
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Created by:
                                {' '}
                                <span className="font-medium text-gray-700 dark:text-gray-300">
                                    {conversation.createdBy.username}
                                </span>
                            </p>
                        </div>
                    )}
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/50 dark:to-pink-900/50 rounded-xl p-4 text-center">
                        <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center mx-auto mb-2">
                            <Star className="w-4 h-4 text-white" />
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-300 font-medium">Topic</p>
                        <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
                            {userInfo?.topic?.replace(UNDERSCORE_RE, ' ') || 'N/A'}
                        </p>
                    </div>
                    <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/50 dark:to-teal-900/50 rounded-xl p-4 text-center">
                        <div className="w-8 h-8 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-lg flex items-center justify-center mx-auto mb-2">
                            <Clock className="w-4 h-4 text-white" />
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-300 font-medium">Device</p>
                        <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
                            {userInfo?.device || 'Unknown'}
                        </p>
                    </div>
                </div>

                {/* Contact Information */}
                <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center">
                        <Users className="w-5 h-5 mr-2 text-purple-600 dark:text-purple-400" />
                        Contact Information
                    </h4>
                    <div className="space-y-3">
                        {userInfo?.email && (
                            <div className="flex items-center p-3 bg-white/60 dark:bg-slate-700/60 rounded-xl border border-gray-100 dark:border-slate-600 hover:bg-white/80 dark:hover:bg-slate-700/80 transition-all duration-200">
                                <div className="w-8 h-8 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/50 dark:to-pink-900/50 rounded-lg flex items-center justify-center mr-3">
                                    <Mail className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Email</p>
                                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{userInfo.email}</p>
                                </div>
                            </div>
                        )}

                        {userInfo?.companyName && (
                            <div className="flex items-center p-3 bg-white/60 dark:bg-slate-700/60 rounded-xl border border-gray-100 dark:border-slate-600 hover:bg-white/80 dark:hover:bg-slate-700/80 transition-all duration-200">
                                <div className="w-8 h-8 bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-900/50 dark:to-cyan-900/50 rounded-lg flex items-center justify-center mr-3">
                                    <Phone className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Company</p>
                                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{userInfo.companyName}</p>
                                </div>
                            </div>
                        )}

                        {userInfo?.transactionId && (
                            <div className="flex items-center p-3 bg-white/60 dark:bg-slate-700/60 rounded-xl border border-gray-100 dark:border-slate-600 hover:bg-white/80 dark:hover:bg-slate-700/80 transition-all duration-200">
                                <div className="w-8 h-8 bg-gradient-to-r from-emerald-100 to-teal-100 dark:from-emerald-900/50 dark:to-teal-900/50 rounded-lg flex items-center justify-center mr-3">
                                    <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Transaction ID</p>
                                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{userInfo.transactionId}</p>
                                </div>
                            </div>
                        )}

                        <div className="flex items-center p-3 bg-white/60 dark:bg-slate-700/60 rounded-xl border border-gray-100 dark:border-slate-600 hover:bg-white/80 dark:hover:bg-slate-700/80 transition-all duration-200">
                            <div className="w-8 h-8 bg-gradient-to-r from-orange-100 to-red-100 dark:from-orange-900/50 dark:to-red-900/50 rounded-lg flex items-center justify-center mr-3">
                                <Calendar className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Created</p>
                                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                    {conversation.createdAt ? new Date(conversation.createdAt).toLocaleDateString() : 'N/A'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Message Preview */}
                {userInfo?.message && (
                    <div className="space-y-4">
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            Original Message
                        </h4>
                        <div className="p-4 bg-gray-50 dark:bg-slate-700 rounded-xl border border-gray-200 dark:border-slate-600">
                            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                                {userInfo.message}
                            </p>
                            {userInfo.requestType && (
                                <div className="mt-3">
                                    <span className="inline-block px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full font-medium">
                                        {userInfo.requestType.replace(UNDERSCORE_RE, ' ')}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="space-y-3 pt-4">
                    <Button
                        className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
                    >
                        Reply to Customer
                    </Button>
                    <Button
                        variant="ghost"
                        className="w-full px-6 py-3 flex items-center justify-center text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/50 hover:text-red-700 dark:hover:text-red-300 rounded-xl transition-all duration-200 border-2 border-red-100 dark:border-red-800 hover:border-red-200 dark:hover:border-red-700"
                    >
                        <Flag className="w-4 h-4 mr-2" />
                        Mark as Spam
                    </Button>
                </div>
            </div>
        </div>
    );
}

export default React.memo(UserProfile);
