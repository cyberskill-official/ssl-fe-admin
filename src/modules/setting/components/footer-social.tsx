import { Loading } from '@cyberskill/shared/react/loading';
import { toast } from '@cyberskill/shared/react/toast';
import { useCallback, useMemo, useRef, useState } from 'react';

import type { E_SocialPlatform, Input_CreateSetting } from '#shared/graphql';

import { Button } from '#shared/component';
import { E_SettingType } from '#shared/graphql';
import { useTranslate } from '#shared/i18n';
import { validate } from '#shared/util';

import type { I_Platform } from './footer-social.type';

import { PLATFORM_LIST } from './footer-social.constant';
import { useCreateSetting, useGetSetting, useUpdateSetting } from './footer-social.hook';
import { SocialLinkRow } from './social-link-row';

function createLink(i = 0): I_Platform {
    return {
        id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${i}`,
        type: null,
        url: '',
    };
}

export function FooterSocialSection() {
    const { t } = useTranslate('settings');
    const [touchedRows, setTouchedRows] = useState<Record<string, boolean>>({});
    const rowRefsRef = useRef<Record<string, HTMLDivElement | null>>({});

    const { platforms, setPlatforms, hasExistingData, setHasExistingData, loading: loadingGetSetting } = useGetSetting();
    const { createSetting, loading: loadingCreateSetting } = useCreateSetting();
    const { updateSetting, loading: loadingUpdateSetting } = useUpdateSetting();

    const isLoading = loadingCreateSetting || loadingUpdateSetting;

    const selectedPlatforms = useMemo(() =>
        platforms.map(p => p.type).filter((type): type is E_SocialPlatform => type !== null), [platforms]);

    const isValid = useMemo(() =>
        platforms.length > 0
        && platforms.every(
            platform =>
                platform.type
                && platform.url
                && validate.isURL(platform.url),
        ), [platforms]);

    const firstInvalidIndex = useMemo(() =>
        platforms.findIndex(
            platform =>
                !platform.type
                || !platform.url
                || !validate.isURL(platform.url),
        ), [platforms]);

    const _scrollToFirstInvalid = useCallback(() => {
        if (firstInvalidIndex !== -1) {
            const invalidPlatform = platforms[firstInvalidIndex];
            if (invalidPlatform) {
                const ref = rowRefsRef.current[invalidPlatform.id];
                if (ref) {
                    ref.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
        }
    }, [firstInvalidIndex, platforms]);

    const _handleCreatePlatform = useCallback(() => {
        setPlatforms((prev) => {
            const newPlatforms = [...prev, createLink(prev.length)];
            setTimeout(() => {
                const last = newPlatforms.at(-1);
                if (last) {
                    const ref = rowRefsRef.current[last.id];
                    if (ref) {
                        const input = ref.querySelector('input,select');
                        if (input)
                            (input as HTMLElement).focus();
                    }
                }
            }, 0);
            return newPlatforms;
        });
    }, [setPlatforms]);

    const _handleRowTouched = useCallback((id: string) => {
        setTouchedRows(prev => ({ ...prev, [id]: true }));
    }, []);

    const _handleChangePlatform = useCallback((id: string, field: 'type' | 'url', value: E_SocialPlatform | string) => {
        setPlatforms(prev => prev.map((platform) => {
            if (platform.id === id) {
                if (field === 'type') {
                    return { ...platform, type: value as E_SocialPlatform };
                }
                if (field === 'url') {
                    return { ...platform, url: value };
                }
            }

            return platform;
        }));
        _handleRowTouched(id);
    }, [setPlatforms, _handleRowTouched]);

    const _handleDeletePlatform = useCallback((id: string) => {
        setPlatforms(prev => prev.filter(item => item.id !== id));
    }, [setPlatforms]);

    const _handleSavePlatform = useCallback(() => {
        if (!isValid) {
            toast.error(t('footer.error-invalid-links'));
            _scrollToFirstInvalid();
            return;
        }

        const socialLinks = platforms
            .filter(p => p.type && p.url)
            .map(p => ({
                type: p.type,
                url: p.url,
            }));

        const footerData: Input_CreateSetting = {
            type: E_SettingType.FOOTER,
            value: {
                footer: {
                    socialLinks: socialLinks.map(link => ({
                        type: link.type as E_SocialPlatform,
                        url: link.url,
                    })),
                },
            },
        };

        if (hasExistingData) {
            updateSetting(footerData).then(() => {
                setHasExistingData(true);
            });
        }
        else {
            createSetting(footerData).then(() => {
                setHasExistingData(true);
            });
        }
    }, [platforms, isValid, t, hasExistingData, createSetting, updateSetting, setHasExistingData, _scrollToFirstInvalid]);

    return (
        <>
            {(loadingGetSetting || isLoading) && <Loading full />}
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 dark:border-slate-700/20 relative">
                <div className="flex items-center justify-between p-8 border-b border-white/20 dark:border-slate-700/20 bg-gradient-to-r from-white/80 to-purple-50/80 dark:from-slate-800/80 dark:to-slate-700/80">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl">
                            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
                            </svg>
                        </div>
                        <h3 className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-cyan-800 dark:from-white dark:via-blue-200 dark:to-cyan-200 bg-clip-text text-transparent">
                            {t('footer.title')}
                        </h3>
                    </div>
                    <Button
                        variant="ghost"
                        className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={_handleSavePlatform}
                        type="button"
                        disabled={isLoading || !isValid}
                    >
                        {isLoading
                            ? (
                                    <div className="flex items-center space-x-2">
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        <span>{t('footer.saving')}</span>
                                    </div>
                                )
                            : (
                                    t('footer.cta-save-changes')
                                )}
                    </Button>
                </div>
                <div className="p-8">
                    <div className="space-y-4">
                        {platforms.map((platform, platformIndex) => (
                            <div
                                key={platform.id}
                                ref={(el: HTMLDivElement | null) => { rowRefsRef.current[platform.id] = el; }}
                                className="transform hover:scale-[1.01] transition-all duration-300"
                            >
                                <SocialLinkRow
                                    selectedPlatforms={selectedPlatforms}
                                    platform={platform}
                                    id={platformIndex}
                                    onChange={(field, value) => _handleChangePlatform(platform.id, field, value)}
                                    onRemove={() => _handleDeletePlatform(platform.id)}
                                    touched={!!touchedRows[platform.id]}
                                    canDelete={platforms.length > 1}
                                />
                            </div>
                        ))}
                    </div>
                    <Button
                        variant="outline"
                        className="mt-6 px-6 py-3 border-2 border-purple-200 dark:border-purple-700 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/50 hover:border-purple-300 dark:hover:border-purple-600 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105"
                        onClick={_handleCreatePlatform}
                        type="button"
                        disabled={platforms.length === PLATFORM_LIST.length}
                    >
                        +
                        {' '}
                        {t('footer.cta-add-platform')}
                    </Button>
                </div>
            </div>
        </>
    );
}
