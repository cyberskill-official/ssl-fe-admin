import { useMutation, useQuery } from '@cyberskill/shared/react/apollo-client';
import { toast } from '@cyberskill/shared/react/toast';
import { useCallback } from 'react';

import type {
    CreateEmailCampaignMutation,
    CreateEmailCampaignMutationVariables,
    DeleteEmailCampaignMutation,
    DeleteEmailCampaignMutationVariables,
    GetEmailCampaignQuery,
    GetEmailCampaignQueryVariables,
    GetEmailCampaignsQuery,
    GetEmailCampaignsQueryVariables,
    SendCampaignNowMutation,
    SendCampaignNowMutationVariables,
    T_EmailCampaign,
    UpdateEmailCampaignMutation,
    UpdateEmailCampaignMutationVariables,
} from '#shared/graphql';

import {
    CreateEmailCampaignDocument,
    DeleteEmailCampaignDocument,
    GetEmailCampaignDocument,
    GetEmailCampaignsDocument,
    SendCampaignNowDocument,
    UpdateEmailCampaignDocument,
} from '#shared/graphql';
import { useTranslate } from '#shared/i18n';

export function useGetEmailCampaigns(
    filter?: GetEmailCampaignsQueryVariables['filter'],
    options?: GetEmailCampaignsQueryVariables['options'],
) {
    const { data, loading, refetch } = useQuery<
        GetEmailCampaignsQuery,
        GetEmailCampaignsQueryVariables
    >(GetEmailCampaignsDocument, {
        variables: { filter, options },
        fetchPolicy: 'cache-and-network',
    });

    const emailCampaigns = data?.getEmailCampaigns?.result?.docs || [];
    const totalDocs = data?.getEmailCampaigns?.result?.totalDocs || 0;
    const totalPages = data?.getEmailCampaigns?.result?.totalPages || 0;
    const hasNextPage = data?.getEmailCampaigns?.result?.hasNextPage || false;
    const hasPrevPage = data?.getEmailCampaigns?.result?.hasPrevPage || false;
    const page = data?.getEmailCampaigns?.result?.page || 1;
    const limit = data?.getEmailCampaigns?.result?.limit || 10;

    return {
        emailCampaigns,
        totalDocs,
        totalPages,
        hasNextPage,
        hasPrevPage,
        page,
        limit,
        loading,
        refetch,
    };
}

export function useCreateEmailCampaign() {
    const { t } = useTranslate('email-campaign');
    const [createEmailCampaign, { loading }] = useMutation<
        CreateEmailCampaignMutation,
        CreateEmailCampaignMutationVariables
    >(CreateEmailCampaignDocument);

    const execute = useCallback(
        async (campaignData: CreateEmailCampaignMutationVariables['doc']) => {
            try {
                const result = await createEmailCampaign({
                    variables: { doc: campaignData },
                });

                if (result.data?.createEmailCampaign?.success) {
                    toast.success(t('success-save'));
                    return {
                        success: true,
                        result: result.data.createEmailCampaign.result,
                    };
                }
                else {
                    const message
                        = result.data?.createEmailCampaign?.message || t('error-save');
                    toast.error(message);
                    throw new Error(message);
                }
            }
            catch (error) {
                const errorMessage
                    = error instanceof Error ? error.message : t('error-save');
                toast.error(errorMessage);
                throw error;
            }
        },
        [createEmailCampaign, t],
    );

    return { createEmailCampaign: execute, loading };
}

export function useUpdateEmailCampaign() {
    const { t } = useTranslate('email-campaign');
    const [updateEmailCampaign, { loading }] = useMutation<
        UpdateEmailCampaignMutation,
        UpdateEmailCampaignMutationVariables
    >(UpdateEmailCampaignDocument);

    const execute = useCallback(
        async (
            filter: UpdateEmailCampaignMutationVariables['filter'],
            update: UpdateEmailCampaignMutationVariables['update'],
            options?: UpdateEmailCampaignMutationVariables['options'],
        ) => {
            try {
                const result = await updateEmailCampaign({
                    variables: { filter, update, options },
                });

                if (result.data?.updateEmailCampaign?.success) {
                    toast.success(t('success-save'));
                    return {
                        success: true,
                        result: result.data.updateEmailCampaign.result,
                    };
                }
                else {
                    const message
                        = result.data?.updateEmailCampaign?.message || t('error-save');
                    toast.error(message);
                    throw new Error(message);
                }
            }
            catch (error) {
                if (error && typeof error === 'object' && 'graphQLErrors' in error) {
                    const graphQLErrors = (error as any).graphQLErrors;
                    if (graphQLErrors && graphQLErrors.length > 0) {
                        const firstError = graphQLErrors[0];
                        if (
                            firstError.message
                            === 'Cannot update a campaign that has already been sent.'
                        ) {
                            const message
                                = t('error-campaign-already-sent')
                                    || 'Cannot update a campaign that has already been sent.';
                            toast.error(message);
                            throw new Error(message);
                        }
                    }
                }

                // Handle network errors that might contain GraphQL errors
                if (error && typeof error === 'object' && 'networkError' in error) {
                    const networkError = (error as any).networkError;
                    if (
                        networkError
                        && networkError.result
                        && networkError.result.errors
                    ) {
                        const graphQLErrors = networkError.result.errors;
                        if (graphQLErrors && graphQLErrors.length > 0) {
                            const firstError = graphQLErrors[0];
                            if (
                                firstError.message
                                === 'Cannot update a campaign that has already been sent.'
                            ) {
                                const message
                                    = t('error-campaign-already-sent')
                                        || 'Cannot update a campaign that has already been sent.';
                                toast.error(message);
                                throw new Error(message);
                            }
                        }
                    }
                }

                const errorMessage
                    = error instanceof Error ? error.message : t('error-save');
                toast.error(errorMessage);
                throw error;
            }
        },
        [updateEmailCampaign, t],
    );

    return { updateEmailCampaign: execute, loading };
}

export function useDeleteEmailCampaign() {
    const { t } = useTranslate('email-campaign');
    const [deleteEmailCampaign, { loading }] = useMutation<
        DeleteEmailCampaignMutation,
        DeleteEmailCampaignMutationVariables
    >(DeleteEmailCampaignDocument);

    const execute = useCallback(
        async (
            filter: DeleteEmailCampaignMutationVariables['filter'],
            options?: DeleteEmailCampaignMutationVariables['options'],
        ) => {
            try {
                const result = await deleteEmailCampaign({
                    variables: { filter, options },
                });

                if (result.data?.deleteEmailCampaign?.success) {
                    toast.success(t('success-delete'));
                    return { success: true };
                }
                else {
                    const message
                        = result.data?.deleteEmailCampaign?.message || t('error-delete');
                    toast.error(message);
                    throw new Error(message);
                }
            }
            catch (error) {
                const errorMessage
                    = error instanceof Error ? error.message : t('error-delete');
                toast.error(errorMessage);
                throw error;
            }
        },
        [deleteEmailCampaign, t],
    );

    return { deleteEmailCampaign: execute, loading };
}

export function useSendEmailCampaign() {
    const { t } = useTranslate('email-campaign');
    const [sendCampaignNow, { loading }] = useMutation<
        SendCampaignNowMutation,
        SendCampaignNowMutationVariables
    >(SendCampaignNowDocument);

    const execute = useCallback(
        async (filter: SendCampaignNowMutationVariables['filter']) => {
            try {
                const result = await sendCampaignNow({
                    variables: { filter },
                });

                if (result.data?.sendCampaignNow?.success) {
                    toast.success(t('success-send'));
                    return { success: true };
                }
                else {
                    const message
                        = result.data?.sendCampaignNow?.message || t('error-send');
                    toast.error(message);
                    throw new Error(message);
                }
            }
            catch (error) {
                const errorMessage
                    = error instanceof Error ? error.message : t('error-send');
                toast.error(errorMessage);
                throw error;
            }
        },
        [sendCampaignNow, t],
    );

    return { sendEmailCampaign: execute, loading };
}

export function useGetEmailCampaign(
    filter: GetEmailCampaignQueryVariables['filter'],
    projection?: GetEmailCampaignQueryVariables['projection'],
    options?: GetEmailCampaignQueryVariables['options'],
    populate?: GetEmailCampaignQueryVariables['populate'],
) {
    const { data, loading, refetch } = useQuery<
        GetEmailCampaignQuery,
        GetEmailCampaignQueryVariables
    >(GetEmailCampaignDocument, {
        variables: { filter, projection, options, populate },
        fetchPolicy: 'cache-and-network',
    });

    const emailCampaign = data?.getEmailCampaign?.result || null;

    return { emailCampaign, loading, refetch };
}

export function useCampaignPermissions() {
    const { t } = useTranslate('email-campaign');

    const canEditCampaign = (
        campaign: T_EmailCampaign | null | undefined,
    ): boolean => {
        if (!campaign)
            return false;
        return !campaign.isSent;
    };

    const getEditRestrictionMessage = (
        campaign: T_EmailCampaign | null | undefined,
    ): string | null => {
        if (!campaign)
            return null;
        if (campaign.isSent) {
            return (
                t('error-campaign-already-sent')
                || 'Cannot edit a campaign that has already been sent.'
            );
        }
        return null;
    };

    return {
        canEditCampaign,
        getEditRestrictionMessage,
    };
}
