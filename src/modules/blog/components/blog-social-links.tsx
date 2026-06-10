import { LinkIcon, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { Button } from '#shared/component';
import { E_SocialPlatform } from '#shared/graphql';
import { useTranslate } from '#shared/i18n';

import type { I_BlogSocialLink, I_BlogSocialLinksProps } from '../blog.type';

const SOCIAL_PLATFORMS = [
    { value: E_SocialPlatform.FACEBOOK, label: 'Facebook' },
    { value: E_SocialPlatform.BLUESKY, label: 'Blusky' },
    { value: E_SocialPlatform.TWITTER, label: 'Twitter' },
    { value: E_SocialPlatform.INSTAGRAM, label: 'Instagram' },
    { value: E_SocialPlatform.LINKEDIN, label: 'LinkedIn' },
    { value: E_SocialPlatform.YOUTUBE, label: 'YouTube' },
    { value: E_SocialPlatform.TIKTOK, label: 'TikTok' },
    { value: E_SocialPlatform.PINTEREST, label: 'Pinterest' },
    { value: E_SocialPlatform.REDDIT, label: 'Reddit' },
    { value: E_SocialPlatform.SNAPCHAT, label: 'Snapchat' },
    { value: E_SocialPlatform.MEDIUM, label: 'Medium' },
    { value: E_SocialPlatform.TUMBLR, label: 'Tumblr' },
    { value: E_SocialPlatform.VIMEO, label: 'Vimeo' },
    { value: E_SocialPlatform.OTHER, label: 'Other' },
];

export function BlogSocialLinks({ socialLinks: formSocialLinks, onSocialLinksChange }: I_BlogSocialLinksProps) {
    const { t } = useTranslate('blog');
    const [socialLinks, setSocialLinks] = useState<I_BlogSocialLink[]>(
        formSocialLinks?.map((link, index) => ({
            id: `social-${index}`,
            type: link?.type as E_SocialPlatform | null,
            url: link?.url || '',
        })) || [],
    );

    const _handleAddSocialLink = () => {
        const newLink: I_BlogSocialLink = {
            id: `social-${Date.now()}`,
            type: null,
            url: '',
        };
        const updatedLinks = [...socialLinks, newLink];
        setSocialLinks(updatedLinks);
        onSocialLinksChange(updatedLinks);
    };

    const _handleRemoveSocialLink = (id: string) => {
        const updatedLinks = socialLinks.filter(link => link.id !== id);
        setSocialLinks(updatedLinks);
        onSocialLinksChange(updatedLinks);
    };

    const _handleChangeSocialLink = (id: string, field: 'type' | 'url', value: string | E_SocialPlatform) => {
        const updatedLinks = socialLinks.map((link) => {
            if (link.id === id) {
                if (field === 'type') {
                    return { ...link, type: value as E_SocialPlatform };
                }
                return { ...link, [field]: value };
            }
            return link;
        });
        setSocialLinks(updatedLinks);
        onSocialLinksChange(updatedLinks);
    };

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t('social-media-links')}
            </h3>
            {socialLinks.length === 0
                ? (
                        <div className="text-center py-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl">
                            <LinkIcon className="mx-auto text-gray-400 dark:text-gray-500 mb-4" size={48} />
                            <p className="text-gray-500 dark:text-gray-400 mb-4">
                                {t('no-social-links')}
                            </p>
                        </div>
                    )
                : (
                        <div className="space-y-4">
                            {socialLinks.map((link, index) => (
                                <div
                                    key={link.id}
                                    className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600"
                                >
                                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                {t('platform')}
                                                {' '}
                                                {index + 1}
                                            </label>
                                            <select
                                                value={link.type || ''}
                                                onChange={e => _handleChangeSocialLink(link.id, 'type', e.target.value as E_SocialPlatform)}
                                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm"
                                            >
                                                <option value="">{t('select-platform')}</option>
                                                {SOCIAL_PLATFORMS.map(platform => (
                                                    <option key={platform.value} value={platform.value}>
                                                        {platform.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                {t('url')}
                                            </label>
                                            <div className="relative">
                                                <LinkIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" size={20} />
                                                <input
                                                    type="url"
                                                    value={link.url}
                                                    onChange={e => _handleChangeSocialLink(link.id, 'url', e.target.value)}
                                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm"
                                                    placeholder="https://"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={() => _handleRemoveSocialLink(link.id)}
                                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-lg transition-all duration-200"
                                        aria-label={t('remove-social-link')}
                                    >
                                        <Trash2 size={16} />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
            <div className="flex justify-center pt-2">
                <Button
                    type="button"
                    variant="outline"
                    onClick={_handleAddSocialLink}
                    className="text-purple-600 border-purple-300 hover:bg-purple-50 dark:text-purple-400 dark:border-purple-600 dark:hover:bg-purple-900/20"
                >
                    {t('add-platform')}
                </Button>
            </div>
        </div>
    );
}
