import { useMutation, useQuery } from '@cyberskill/shared/react/apollo-client';
import { toast } from '@cyberskill/shared/react/toast';
import { useCallback, useEffect, useState } from 'react';

import type {
    createSettingMutation,
    createSettingMutationVariables,
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

import type { I_FAQEntry } from './faq.type';

export function useGetFAQSetting() {
    const [entries, setEntries] = useState<I_FAQEntry[]>([]);
    const [hasExistingData, setHasExistingData] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);

    const { loading, data, error } = useQuery<getSettingQuery, getSettingQueryVariables>(
        getSettingDocument,
        {
            variables: {
                filter: { type: E_SettingType.FAQ },
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
                && 'entries' in settingValue
                && settingValue.entries) {
                const existingEntries = settingValue.entries;
                const formattedEntries = existingEntries
                    .filter((entry): entry is NonNullable<typeof entry> => entry !== null)
                    .map((entry, index) => ({
                        id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${index}`,
                        question: entry.question || '',
                        answer: entry.answer || '',
                        isPublished: entry.isPublished ?? true,
                    }));

                // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect
                setEntries(formattedEntries);
                // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect
                setHasExistingData(true);
            }
        }
    }, [data, loading, isLoaded]);

    return {
        entries,
        setEntries,
        hasExistingData,
        setHasExistingData,
        loading,
    };
}

export function useCreateFAQSetting() {
    const { t } = useTranslate('settings');

    const [createSetting, { loading }] = useMutation<createSettingMutation, createSettingMutationVariables>(createSettingDocument, {
        onCompleted: (response) => {
            const { success, message } = response.createSetting;

            if (success) {
                toast.success(t('faq.success-save'));
            }
            else {
                toast.error(message || t('faq.error-save'));
            }
        },
        onError: (error) => {
            toast.error(error.message);
        },
    });

    const execute = useCallback((faqData: Input_CreateSetting) => {
        return createSetting({
            variables: {
                doc: faqData,
            },
        });
    }, [createSetting]);

    return {
        createSetting: execute,
        loading,
    };
}

export function useUpdateFAQSetting() {
    const { t } = useTranslate('settings');

    const [updateSetting, { loading }] = useMutation<updateSettingMutation, updateSettingMutationVariables>(updateSettingDocument, {
        onCompleted: (response) => {
            const { success, message } = response.updateSetting;

            if (success) {
                toast.success(t('faq.success-save'));
            }
            else {
                toast.error(message || t('faq.error-save'));
            }
        },
        onError: (error) => {
            toast.error(error.message);
        },
    });

    const execute = useCallback((faqData: Input_UpdateSetting) => {
        return updateSetting({
            variables: {
                filter: { type: E_SettingType.FAQ },
                update: faqData,
            },
        });
    }, [updateSetting]);

    return {
        updateSetting: execute,
        loading,
    };
}
