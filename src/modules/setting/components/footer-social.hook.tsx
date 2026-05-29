import { useMutation, useQuery } from '@cyberskill/shared/react/apollo-client';
import { toast } from '@cyberskill/shared/react/toast';
import { useCallback, useEffect, useState } from 'react';

import type {
    createSettingMutation,
    createSettingMutationVariables,
    E_SocialPlatform,
    getSettingQuery,
    getSettingQueryVariables,
    Input_CreateSetting,
    Input_UpdateSetting,
    updateSettingMutation,
    updateSettingMutationVariables,
} from '#shared/graphql';

import {
    createSettingDocument,
    E_SettingType,
    getSettingDocument,
    updateSettingDocument,
} from '#shared/graphql';
import { useTranslate } from '#shared/i18n';

import type { I_Platform } from './footer-social.type';

export function useGetSetting() {
    const [platforms, setPlatforms] = useState<I_Platform[]>([]);
    const [hasExistingData, setHasExistingData] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);

    const { loading, data, error } = useQuery<getSettingQuery, getSettingQueryVariables>(
        getSettingDocument,
        {
            variables: {
                filter: { type: E_SettingType.FOOTER },
            },
        },
    );

    useEffect(() => {
        if (error) {
            toast.error(error.message);
        }
    }, [error]);

    useEffect(() => {
        if (isLoaded) {
            return;
        }
        if (!loading && data) {
            // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect
            setIsLoaded(true);
            const settingValue = data?.getSetting?.result?.value;
            if (settingValue
                && 'socialLinks' in settingValue
                && settingValue.socialLinks) {
                const existingLinks = settingValue.socialLinks;
                const formattedPlatforms = existingLinks
                    .filter((link): link is NonNullable<typeof link> & { type: E_SocialPlatform } => link !== null && link.type !== null)
                    .map((link, index) => ({
                        id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${index}`,
                        type: link.type,
                        url: link.url || '',
                    }));

                // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect
                setPlatforms(formattedPlatforms);
                // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect
                setHasExistingData(true);
            }
        }
    }, [data, loading, isLoaded]);

    return {
        platforms,
        setPlatforms,
        hasExistingData,
        setHasExistingData,
        loading,
    };
}

export function useCreateSetting() {
    const { t } = useTranslate('settings');

    const [createSetting, { loading }] = useMutation<createSettingMutation, createSettingMutationVariables>(createSettingDocument, {
        onCompleted: (response) => {
            const { success, message } = response.createSetting;

            if (success) {
                toast.success(t('footer.success-save'));
            }
            else {
                toast.error(message || t('footer.error-save'));
            }
        },
        onError: (error) => {
            toast.error(error.message);
        },
    });

    const execute = useCallback((footerData: Input_CreateSetting) => {
        return createSetting({
            variables: {
                doc: footerData,
            },
        });
    }, [createSetting]);

    return {
        createSetting: execute,
        loading,
    };
}

export function useUpdateSetting() {
    const { t } = useTranslate('settings');

    const [updateSetting, { loading }] = useMutation<updateSettingMutation, updateSettingMutationVariables>(updateSettingDocument, {
        onCompleted: (response) => {
            const { success, message } = response.updateSetting;

            if (success) {
                toast.success(t('footer.success-save'));
            }
            else {
                toast.error(message || t('footer.error-save'));
            }
        },
        onError: (error) => {
            toast.error(error.message);
        },
    });

    const execute = useCallback((footerData: Input_UpdateSetting) => {
        return updateSetting({
            variables: {
                filter: { type: E_SettingType.FOOTER },
                update: footerData,
            },
        });
    }, [updateSetting]);

    return {
        updateSetting: execute,
        loading,
    };
}
