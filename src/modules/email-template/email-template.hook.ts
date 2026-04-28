import { useMutation, useQuery } from '@cyberskill/shared/react/apollo-client';
import { toast } from '@cyberskill/shared/react/toast';
import { useCallback, useEffect, useMemo, useState } from 'react';

import type {
    CreateEmailTemplateMutation,
    CreateEmailTemplateMutationVariables,
    DeleteEmailTemplateMutation,
    DeleteEmailTemplateMutationVariables,
    GetEmailTemplatesQuery,
    GetEmailTemplatesQueryVariables,
    UpdateEmailTemplateMutation,
    UpdateEmailTemplateMutationVariables,
} from '#shared/graphql';

import {
    CreateEmailTemplateDocument,
    DeleteEmailTemplateDocument,
    GetEmailTemplatesDocument,
    UpdateEmailTemplateDocument,
} from '#shared/graphql';
import { useTranslate } from '#shared/i18n';

import type { I_EmailTemplate } from './email-template.type';

export function useAutoEmail() {
    const { t } = useTranslate();
    const [selectedTemplate, setSelectedTemplate]
        = useState<I_EmailTemplate | null>(null);
    const [showPreview, setShowPreview] = useState(false);
    const [editedContent, setEditedContent] = useState('');
    const [editedSubject, setEditedSubject] = useState('');

    const {
        data: templatesQuery,
        refetch: refetchTemplates,
        loading: templatesLoading,
        error: templatesError,
    } = useQuery<GetEmailTemplatesQuery, GetEmailTemplatesQueryVariables>(
        GetEmailTemplatesDocument,
        {
            variables: {
                filter: {
                    isDel: false,
                },
                options: {
                    pagination: false,
                    sort: { createdAt: -1 },
                },
            },
            errorPolicy: 'all',
        },
    );

    const [createEmailTemplateMutation, { loading: createLoading }] = useMutation<
        CreateEmailTemplateMutation,
        CreateEmailTemplateMutationVariables
    >(CreateEmailTemplateDocument, {
        onCompleted: (response) => {
            const { success, message } = response.createEmailTemplate;
            if (success) {
                toast.success(t('email-template.created-successfully'));
                refetchTemplates();
            }
            else {
                toast.error(message || t('email-template.create-failed'));
            }
        },
        onError: (error) => {
            toast.error(error.message);
        },
    });

    const [updateEmailTemplateMutation, { loading: updateLoading }] = useMutation<
        UpdateEmailTemplateMutation,
        UpdateEmailTemplateMutationVariables
    >(UpdateEmailTemplateDocument, {
        onCompleted: (response) => {
            const { success, message } = response.updateEmailTemplate;
            if (success) {
                toast.success(t('email-template.updated-successfully'));
                refetchTemplates();
            }
            else {
                toast.error(message || t('email-template.update-failed'));
            }
        },
        onError: (error) => {
            toast.error(error.message);
        },
    });

    const [deleteEmailTemplateMutation, { loading: deleteLoading }] = useMutation<
        DeleteEmailTemplateMutation,
        DeleteEmailTemplateMutationVariables
    >(DeleteEmailTemplateDocument, {
        onCompleted: (response) => {
            const { success, message } = response.deleteEmailTemplate;
            if (success) {
                toast.success(t('email-template.deleted-successfully'));
                refetchTemplates();
                if (selectedTemplate?.id === response.deleteEmailTemplate.result?.id) {
                    setSelectedTemplate(null);
                    setEditedContent('');
                    setEditedSubject('');
                }
            }
            else {
                toast.error(message || t('email-template.delete-failed'));
            }
        },
        onError: (error) => {
            toast.error(error.message);
        },
    });

    const templates = useMemo(() => {
        return templatesQuery?.getEmailTemplates?.result?.docs || [];
    }, [templatesQuery]);

    const _handleTemplateSelect = useCallback((template: I_EmailTemplate) => {
        setSelectedTemplate(template);
        setEditedContent(template.content || '');
        setEditedSubject(template.subject || '');
        setShowPreview(false);
    }, []);

    const createTemplate = useCallback(
        (templateData: CreateEmailTemplateMutationVariables['doc']) => {
            // Validate required fields
            if (!templateData.name || !templateData.templateKey) {
                toast.error(t('email-template.error-required-fields'));
                return Promise.reject(new Error('Required fields missing'));
            }

            return createEmailTemplateMutation({
                variables: { doc: templateData },
            });
        },
        [createEmailTemplateMutation, t],
    );

    const updateTemplate = useCallback(
        (
            filter: UpdateEmailTemplateMutationVariables['filter'],
            update: UpdateEmailTemplateMutationVariables['update'],
        ) => {
            return updateEmailTemplateMutation({
                variables: { filter, update },
            });
        },
        [updateEmailTemplateMutation],
    );

    const deleteTemplate = useCallback(
        (filter: DeleteEmailTemplateMutationVariables['filter']) => {
            return deleteEmailTemplateMutation({
                variables: { filter },
            });
        },
        [deleteEmailTemplateMutation],
    );

    const saveCurrentTemplate = useCallback(() => {
        if (!selectedTemplate) {
            return;
        }

        const updateData = {
            content: editedContent,
            subject: editedSubject,
        };

        return updateTemplate({ id: selectedTemplate.id }, updateData);
    }, [selectedTemplate, editedContent, editedSubject, updateTemplate]);

    useEffect(() => {
        if (templatesError) {
            toast.error(templatesError.message || t('email-template.load-failed'));
        }
    }, [templatesError, t]);

    return {
        selectedTemplate,
        showPreview,
        editedContent,
        editedSubject,
        templates,

        templatesLoading,
        createLoading,
        updateLoading,
        deleteLoading,

        _handleTemplateSelect,
        setSelectedTemplate,
        setShowPreview,
        setEditedContent,
        setEditedSubject,
        createTemplate,
        updateTemplate,
        deleteTemplate,
        saveCurrentTemplate,
        refetchTemplates,
    };
}
