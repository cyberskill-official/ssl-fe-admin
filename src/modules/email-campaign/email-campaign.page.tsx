import { log } from '@cyberskill/shared/react/log';
import { toast } from '@cyberskill/shared/react/toast';
import { Mail } from 'lucide-react';
import { useEffect, useState } from 'react';

import type { T_EmailCampaign } from '#shared/graphql';

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '#shared/component';
import { ConfirmDialog } from '#shared/component/confirm-dialog';
import { useTranslate } from '#shared/i18n';
import { usePortal } from '#shared/portal';

import { EmailCampaignForm } from './email-campaign-form';
import { EmailCampaignList } from './email-campaign-list';
import {
    useCampaignPermissions,
    useCreateEmailCampaign,
    useDeleteEmailCampaign,
    useGetEmailCampaigns,
    useSendEmailCampaign,
    useUpdateEmailCampaign,
} from './email-campaign.hook';
import { processEmailContent } from './email-campaign.utils';

export function EmailCampaignPage() {
    const { t } = useTranslate('email-campaign');
    const { setHeader } = usePortal();
    const { canEditCampaign, getEditRestrictionMessage }
        = useCampaignPermissions();

    const [showForm, setShowForm] = useState(false);
    const [editingEmailCampaign, setEditingEmailCampaign]
        = useState<T_EmailCampaign | null>(null);
    const [formMode, setFormMode] = useState<'create' | 'update'>('create');
    const [emailCampaignToDelete, setEmailCampaignToDelete]
        = useState<T_EmailCampaign | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [selectedStatus, setSelectedStatus] = useState<
    'all' | 'sent' | 'scheduled' | 'draft'
    >('all');

    const filter = {
        ...(debouncedSearch && { name: debouncedSearch }),
        ...(selectedStatus === 'sent' && { isSent: true }),
        ...(selectedStatus === 'scheduled' && { isScheduled: true, isSent: false }),
        ...(selectedStatus === 'draft' && { isScheduled: false, isSent: false }),
    };

    const { emailCampaigns, loading, refetch, totalDocs } = useGetEmailCampaigns(
        Object.keys(filter).length > 0 ? filter : undefined,
        { page, limit: pageSize },
    );
    const { createEmailCampaign, loading: creatingEmailCampaign }
        = useCreateEmailCampaign();
    const { updateEmailCampaign, loading: updatingEmailCampaign }
        = useUpdateEmailCampaign();
    const { deleteEmailCampaign } = useDeleteEmailCampaign();
    const { sendEmailCampaign, loading: sendingEmailCampaign }
        = useSendEmailCampaign();

    useEffect(() => {
        setHeader({
            title: t('title'),
            description: t('description'),
            icon: Mail,
        });
        return () => setHeader(null);
    }, [setHeader, t]);

    const validCampaigns = emailCampaigns.filter(
        (campaign): campaign is NonNullable<typeof campaign> => campaign != null,
    );

    const _handleCreateEmailCampaign = () => {
        setEditingEmailCampaign(null);
        setFormMode('create');
        setShowForm(true);
    };

    const _handleEditEmailCampaign = (emailCampaign: T_EmailCampaign) => {
    // Check if campaign can be edited
        if (!canEditCampaign(emailCampaign)) {
            const message = getEditRestrictionMessage(emailCampaign);
            if (message) {
                toast.error(message);
            }
            return;
        }

        setEditingEmailCampaign(emailCampaign);
        setFormMode('update');
        setShowForm(true);
    };

    const _handleDeleteEmailCampaign = (emailCampaign: T_EmailCampaign) => {
        setEmailCampaignToDelete(emailCampaign);
    };

    const _handleToggleStatus = async (
        emailCampaignId: string,
        currentIsScheduled: boolean,
    ) => {
        const emailCampaign = validCampaigns.find(c => c?.id === emailCampaignId);

        if (!emailCampaign) {
            toast.error(t('error.campaign-not-found'));
            return;
        }

        setUpdatingStatusId(emailCampaignId);
        try {
            if (currentIsScheduled) {
                await sendEmailCampaign({ id: emailCampaignId });
            }
            else {
                await updateEmailCampaign(
                    { id: emailCampaignId },
                    {
                        isScheduled: !currentIsScheduled,
                    },
                );
            }
            await refetch();
        }
        catch (error) {
            log.error('Error updating email campaign status:', error);
            toast.error(t('error-update-status'));
        }
        finally {
            setUpdatingStatusId(null);
        }
    };

    const _handleFormSubmit = async (formData: Partial<T_EmailCampaign>) => {
        try {
            const processedContent = processEmailContent(formData.content || '');

            if (formMode === 'update' && editingEmailCampaign?.id) {
                await updateEmailCampaign(
                    { id: editingEmailCampaign.id },
                    {
                        name: formData.name,
                        subject: formData.subject,
                        senderName: formData.senderName,
                        senderEmail: formData.senderEmail,
                        content: processedContent,
                        target: formData.target,
                        isScheduled: formData.isScheduled,
                        scheduledDate: formData.scheduledDate,
                        scheduledTime: formData.scheduledTime,
                    },
                );
            }
            else if (formMode === 'create') {
                await createEmailCampaign({
                    name: formData.name!,
                    subject: formData.subject!,
                    senderName: formData.senderName!,
                    senderEmail: formData.senderEmail!,
                    content: processedContent,
                    target: formData.target!,
                    isScheduled: formData.isScheduled,
                    scheduledDate: formData.scheduledDate,
                    scheduledTime: formData.scheduledTime,
                });
            }

            setShowForm(false);
            setEditingEmailCampaign(null);
            await refetch();
        }
        catch (error) {
            log.error('Error saving email campaign:', error);
            toast.error(t('error-save'));
        }
    };

    const _handleFormCancel = () => {
        setShowForm(false);
        setEditingEmailCampaign(null);
        setFormMode('create');
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
        }, 300);

        return () => clearTimeout(timer);
    }, [search]);

    useEffect(() => {
        refetch();
    }, [selectedStatus, debouncedSearch, refetch]);

    return (
        <div className="container mx-auto space-y-6 flex flex-col bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
            <div className="flex-1 border rounded-lg p-4 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 overflow-auto">
                <EmailCampaignList
                    emailCampaigns={validCampaigns}
                    loading={loading}
                    onEditEmailCampaign={_handleEditEmailCampaign}
                    onCreateEmailCampaign={_handleCreateEmailCampaign}
                    onDeleteEmailCampaign={_handleDeleteEmailCampaign}
                    onToggleStatus={_handleToggleStatus}
                    updatingStatusId={updatingStatusId || undefined}
                    totalDocs={totalDocs}
                    page={page}
                    pageSize={pageSize}
                    onPageChange={setPage}
                    onPageSizeChange={setPageSize}
                    search={search}
                    onSearchChange={setSearch}
                    selectedStatus={selectedStatus}
                    onStatusFilterChange={setSelectedStatus}
                />
            </div>
            <Dialog open={showForm} onOpenChange={setShowForm}>
                <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {formMode === 'update'
                                ? t('update-campaign')
                                : t('create-campaign')}
                        </DialogTitle>
                    </DialogHeader>
                    <EmailCampaignForm
                        emailCampaign={editingEmailCampaign || undefined}
                        mode={formMode}
                        onSubmit={_handleFormSubmit}
                        onCancel={_handleFormCancel}
                        loading={
                            creatingEmailCampaign
                            || updatingEmailCampaign
                            || sendingEmailCampaign
                        }
                    />
                </DialogContent>
            </Dialog>
            <ConfirmDialog
                open={!!emailCampaignToDelete}
                title={t('delete-campaign')}
                description={(
                    <span>
                        {t('confirm.delete-campaign')}
            &nbsp;
                        <b>{emailCampaignToDelete?.name}</b>
                        ?
                    </span>
                )}
                onCancel={() => setEmailCampaignToDelete(null)}
                onConfirm={async () => {
                    if (!emailCampaignToDelete?.id) {
                        toast.error(t('error.campaign-not-found'));
                        return;
                    }
                    setDeleting(true);
                    await deleteEmailCampaign({ id: emailCampaignToDelete.id });
                    setDeleting(false);
                    setEmailCampaignToDelete(null);
                    await refetch();
                }}
                loading={deleting}
                confirmLabel={t('delete')}
                cancelLabel={t('cancel')}
            />
        </div>
    );
}

export default EmailCampaignPage;
