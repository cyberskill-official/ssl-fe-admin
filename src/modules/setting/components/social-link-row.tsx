import { Globe, Link, X } from 'lucide-react';
import { useMemo } from 'react';

import { Button, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '#shared/component';
import { useTranslate } from '#shared/i18n';
import { cn, validate } from '#shared/util';

import type { I_SocialLinkRow_Props } from './social-link-row.type';

import { PLATFORM_LIST } from './footer-social.constant';

export function SocialLinkRow({ id, platform, selectedPlatforms, onChange, onRemove, touched, canDelete }: I_SocialLinkRow_Props & { touched?: boolean; canDelete?: boolean }) {
    const { t } = useTranslate('settings');

    const availablePlatforms = useMemo(() =>
        PLATFORM_LIST.filter(pf =>
            !selectedPlatforms.includes(pf.value) || pf.value === platform.type,
        ), [selectedPlatforms, platform.type]);

    const isUrlValid = useMemo(() =>
        platform.url !== '' && validate.isURL(platform.url), [platform.url]);

    return (
        <div className="bg-white/60 dark:bg-slate-700/60 backdrop-blur-sm p-6 rounded-2xl border border-white/20 dark:border-slate-600/20 hover:bg-white/80 dark:hover:bg-slate-700/80 transition-all duration-300 group">
            <div className="flex gap-6 items-start">
                {/* Platform Selection */}
                <div className="flex flex-col gap-2 min-w-[200px]">
                    <Label className="text-sm font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wide flex items-center">
                        <Globe className="w-4 h-4 mr-2 text-purple-600 dark:text-purple-400" />
                        {t('footer.platform')}
                        {' '}
                        {id + 1}
                    </Label>
                    <Select
                        value={platform.type || undefined}
                        onValueChange={value => onChange('type', value)}
                        required
                    >
                        <SelectTrigger className={cn('w-full border-2 rounded-xl transition-all duration-300', {
                            'border-red-300 dark:border-red-600 focus:border-red-500 dark:focus:border-red-400 focus:ring-red-100 dark:focus:ring-red-900/50': !platform.type && touched,
                            'border-gray-200 dark:border-slate-600 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-purple-100 dark:focus:ring-purple-900/50': platform.type || !touched,
                        })}
                        >
                            <SelectValue placeholder={t('footer.select-platform')} />
                        </SelectTrigger>
                        <SelectContent className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm border border-white/20 dark:border-slate-700/20 rounded-xl shadow-xl">
                            {availablePlatforms.map(platform => (
                                <SelectItem
                                    key={platform.value}
                                    value={platform.value}
                                    className="hover:bg-purple-50 dark:hover:bg-purple-900/50 focus:bg-purple-50 dark:focus:bg-purple-900/50 transition-colors duration-200"
                                >
                                    {platform.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* URL Input */}
                <div className="flex-1 flex flex-col gap-2">
                    <Label htmlFor={`url${platform.id}`} className="text-sm font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wide flex items-center">
                        <Link className="w-4 h-4 mr-2 text-purple-600 dark:text-purple-400" />
                        {t('footer.url')}
                    </Label>
                    <div className="flex items-center gap-3">
                        <div className="flex-1 relative">
                            <Input
                                type="url"
                                placeholder="https://"
                                value={platform.url}
                                onChange={e => onChange('url', e.target.value)}
                                required
                                autoComplete="off"
                                pattern="https?://.+"
                                className={cn('border-2 rounded-xl transition-all duration-300', {
                                    'border-emerald-300 dark:border-emerald-600 focus:border-emerald-500 dark:focus:border-emerald-400 focus:ring-emerald-100 dark:focus:ring-emerald-900/50': isUrlValid,
                                    'border-red-300 dark:border-red-600 focus:border-red-500 dark:focus:border-red-400 focus:ring-red-100 dark:focus:ring-red-900/50': !isUrlValid && touched,
                                    'border-gray-200 dark:border-slate-600 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-purple-100 dark:focus:ring-purple-900/50': !touched,
                                })}
                                aria-invalid={!isUrlValid}
                            />
                            {isUrlValid && (
                                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                    <div className="w-5 h-5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center">
                                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                </div>
                            )}
                        </div>
                        {canDelete && (
                            <Button
                                className="p-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/50 hover:text-red-700 dark:hover:text-red-300 rounded-xl transition-all duration-200 border-2 border-red-100 dark:border-red-800 hover:border-red-200 dark:hover:border-red-700"
                                type="button"
                                variant="ghost"
                                onClick={onRemove}
                            >
                                <X className="size-5" />
                            </Button>
                        )}
                    </div>
                    {touched && !isUrlValid && (
                        <p className="text-sm text-red-600 dark:text-red-400 font-medium flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            {t('footer.error-invalid-url')}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
