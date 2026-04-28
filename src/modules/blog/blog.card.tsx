import { Edit, Eye, FileText, Trash2, User } from 'lucide-react';
import { motion } from 'motion/react';

import type { T_Blog } from '#shared/graphql';

import { Badge, Button, Switch } from '#shared/component';

export function BlogCard({
    blog,
    onEdit,
    onDelete,
    onToggleStatus,
    updatingStatusId,
    t,
}: {
    blog: T_Blog;
    onEdit: (blog: T_Blog) => void;
    onDelete: (blog: T_Blog) => void;
    onToggleStatus: (blogId: string, currentIsActive: boolean) => void;
    updatingStatusId?: string;
    t: (key: string, params?: Record<string, any>) => string;
}) {
    const isActive = blog.isActive || false;
    const category = blog.category || '';
    const featuredImage = blog.featuredImage;
    const author = blog.author;

    const _getCategoryColor = (category: string) => {
        const colors: Record<string, string> = {
            SWINGER_CLUB: 'from-purple-400 to-pink-400',
            DATING: 'from-green-400 to-blue-400',
            SEX: 'from-pink-400 to-red-400',
            LIFESTYLE: 'from-orange-400 to-yellow-400',
            TRAVELS: 'from-blue-400 to-cyan-400',
            RELATIONSHIPS: 'from-indigo-400 to-purple-400',
            SEXUALITY: 'from-red-400 to-pink-400',
        };
        return colors[category] || 'from-gray-400 to-gray-600';
    };

    return (
        <motion.div
            whileHover={{ scale: 1.02, y: -4, transition: { duration: 0.2 } }}
            className="group relative bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-xl border border-white/30 dark:border-gray-600/50 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
        >
            {/* Header with Image */}
            <div className="relative h-48 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30">
                {featuredImage
                    ? (
                            <img
                                src={featuredImage}
                                alt={blog.title || 'Blog'}
                                className="w-full h-full object-cover"
                            />
                        )
                    : (
                            <div className="w-full h-full flex items-center justify-center">
                                <FileText className="w-16 h-16 text-purple-400 dark:text-purple-300" />
                            </div>
                        )}
                {/* Status Badge */}
                <div className="absolute top-3 right-3">
                    <Badge
                        className={
                            isActive
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                        }
                    >
                        {isActive ? t('published') : t('draft')}
                    </Badge>
                </div>
                {/* Category Badge */}
                <div className="absolute top-3 left-3">
                    <Badge className={`bg-gradient-to-r ${_getCategoryColor(category)} text-white text-xs`}>
                        {category}
                    </Badge>
                </div>
            </div>

            {/* Content */}
            <div className="p-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-purple-400 to-pink-400">
                        <FileText className="h-4 w-4 text-white" />
                    </div>
                    <Badge variant="outline" className="text-xs border-gray-300 dark:border-gray-500 text-gray-700 dark:text-gray-200 bg-white/50 dark:bg-gray-700/50">
                        {t(blog.type?.toLowerCase() || 'blog')}
                    </Badge>
                </div>

                {/* Blog Title */}
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 text-sm leading-tight line-clamp-2">
                    {blog.title}
                </h3>

                {/* Author */}
                <div className="flex items-center gap-2 mb-3 text-xs text-gray-600 dark:text-gray-300">
                    <User className="w-3 h-3" />
                    <div className="flex items-center gap-1 line-clamp-1">
                        {author
                            ? (
                                    <a
                                        href={`https://development.secretswingerlust.com/profile/${author.username}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:underline font-medium"
                                    >
                                        {author.username}
                                    </a>
                                )
                            : (
                                    <span>{blog.hostName}</span>
                                )}
                    </div>
                </div>

                {/* Created Info */}
                <div className="flex items-center justify-between mb-3 text-xs text-gray-600 dark:text-gray-300">
                    <div>
                        {t('created')}
                        :&nbsp;
                        {new Date(blog.createdAt).toLocaleDateString()}
                    </div>
                    {blog.author?.username && (
                        <div>
                            {t('by')}
                            :&nbsp;
                            {blog.author.username}
                        </div>
                    )}
                </div>

                {/* Read Count */}
                <div className="flex items-center gap-2 mb-3 text-xs text-gray-600 dark:text-gray-300">
                    <Eye className="w-3 h-3" />
                    <span>
                        {blog.readCount || 0}
                        {' '}
                        {t('reads')}
                    </span>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                    <Button
                        onClick={() => onEdit(blog)}
                        className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                    >
                        <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                        onClick={() => onDelete(blog)}
                        className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white"
                    >
                        <Trash2 className="h-3 w-3" />
                    </Button>
                </div>

                {/* Status Toggle */}
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <Switch
                        checked={isActive}
                        onCheckedChange={() => onToggleStatus(blog.id!, isActive)}
                        aria-label={t('toggle-status')}
                        disabled={updatingStatusId === blog.id}
                    />
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                        {isActive ? t('published') : t('draft')}
                    </span>
                </div>
            </div>

            {/* Bottom Gradient Border */}
            <div className="h-1 bg-gradient-to-r from-purple-400 to-pink-400" />
        </motion.div>
    );
}
