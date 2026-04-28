import { useMutation, useQuery } from '@cyberskill/shared/react/apollo-client';
import { toast } from '@cyberskill/shared/react/toast';
import { useCallback } from 'react';

import type {
    getLegalDocumentQuery,
    getLegalDocumentQueryVariables,
    getLegalDocumentsQuery,
    getLegalDocumentsQueryVariables,
    publishLegalDocumentMutation,
    publishLegalDocumentMutationVariables,
    restoreLegalDocumentMutation,
    restoreLegalDocumentMutationVariables,
    saveDraftLegalDocumentMutation,
    saveDraftLegalDocumentMutationVariables,
    T_LegalDocument,
} from '#shared/graphql';

import {
    getLegalDocumentDocument,
    getLegalDocumentsDocument,
    publishLegalDocumentDocument,
    restoreLegalDocumentDocument,
    saveDraftLegalDocumentDocument,
} from '#shared/graphql';
import { useTranslate } from '#shared/i18n';

export function useGetLegalDocument(
    filter: getLegalDocumentQueryVariables['filter'],
    projection: getLegalDocumentQueryVariables['projection'],
    options: getLegalDocumentQueryVariables['options'],
    populate: getLegalDocumentQueryVariables['populate'],
) {
    const { data, loading, refetch } = useQuery<
        getLegalDocumentQuery,
        getLegalDocumentQueryVariables
    >(getLegalDocumentDocument, {
        variables: { filter, projection, options, populate },
        fetchPolicy: 'network-only',
    });

    const legalDocument = data?.getLegalDocument?.result || null;

    return { legalDocument, loading, refetch };
}

export function useGetLegalDocuments(
    filter?: getLegalDocumentsQueryVariables['filter'],
    options?: getLegalDocumentsQueryVariables['options'],
) {
    const { data, loading, refetch } = useQuery<
        getLegalDocumentsQuery,
        getLegalDocumentsQueryVariables
    >(getLegalDocumentsDocument, {
        variables: { filter, options },
        fetchPolicy: 'network-only',
    });

    const legalDocuments: T_LegalDocument[]
        = data?.getLegalDocuments?.result?.docs?.filter(
            (ld): ld is T_LegalDocument => ld !== null && ld !== undefined,
        ) || [];
    const totalDocs = data?.getLegalDocuments?.result?.totalDocs || 0;
    const totalPages = data?.getLegalDocuments?.result?.totalPages || 1;
    const hasNextPage = data?.getLegalDocuments?.result?.hasNextPage || false;
    const hasPrevPage = data?.getLegalDocuments?.result?.hasPrevPage || false;
    const page = data?.getLegalDocuments?.result?.page || 1;
    const limit = data?.getLegalDocuments?.result?.limit || 10;

    return {
        legalDocuments,
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

export function useSaveDraftLegalDocument() {
    const { t } = useTranslate('legal-document');
    const [saveDraftLegalDocument, { loading }] = useMutation<
        saveDraftLegalDocumentMutation,
        saveDraftLegalDocumentMutationVariables
    >(saveDraftLegalDocumentDocument, {
        onCompleted: (data) => {
            const { success, message } = data.saveDraftLegalDocument;
            if (success) {
                toast.success(t('draft-save'));
            }
            else {
                toast.error(message || t('error-save'));
            }
        },
        onError: (error) => {
            toast.error(error.message);
        },
    });

    const execute = useCallback(
        (legalDocumentData: saveDraftLegalDocumentMutationVariables['doc']) => {
            return saveDraftLegalDocument({
                variables: { doc: legalDocumentData },
            });
        },
        [saveDraftLegalDocument],
    );

    return { saveDraftLegalDocument: execute, loading };
}

export function usePublishLegalDocument() {
    const { t } = useTranslate('legal-document');
    const [publishLegalDocument, { loading }] = useMutation<
        publishLegalDocumentMutation,
        publishLegalDocumentMutationVariables
    >(publishLegalDocumentDocument, {
        onCompleted: (data) => {
            const { success, message } = data.publishLegalDocument;
            if (success) {
                toast.success(t('public-save'));
            }
            else {
                toast.error(message || t('error-save'));
            }
        },
        onError: (error) => {
            toast.error(error.message);
        },
    });

    const execute = useCallback(
        (legalDocumentData: publishLegalDocumentMutationVariables['doc']) => {
            return publishLegalDocument({
                variables: { doc: legalDocumentData },
            });
        },
        [publishLegalDocument],
    );

    return { publishLegalDocument: execute, loading };
}

export function useRestoreLegalDocument() {
    const { t } = useTranslate('legal-document');
    const [restoreLegalDocument, { loading }] = useMutation<
        restoreLegalDocumentMutation,
        restoreLegalDocumentMutationVariables
    >(restoreLegalDocumentDocument, {
        onCompleted: (data) => {
            const { success, message } = data.restoreLegalDocument;
            if (success) {
                toast.success(t('restore-save'));
            }
            else {
                toast.error(message || t('error-save'));
            }
        },
        onError: (error) => {
            toast.error(error.message);
        },
    });

    const execute = useCallback(
        (legalDocumentData: restoreLegalDocumentMutationVariables['doc']) => {
            return restoreLegalDocument({
                variables: { doc: legalDocumentData },
            });
        },
        [restoreLegalDocument],
    );

    return { restoreLegalDocument: execute, loading };
}
