import { useMutation } from '@cyberskill/shared/react/apollo-client';
import { toast } from '@cyberskill/shared/react/toast';
import { useCallback } from 'react';

import type { uploadMutation, uploadMutationVariables } from '#shared/graphql';

import { uploadDocument } from '#shared/graphql';
import { useTranslate } from '#shared/i18n';

export interface I_UseUploadOptions {
    onSuccess?: (url: string) => void;
    onError?: (error: Error) => void;
}

export function useUpload({
    onSuccess,
    onError,
}: I_UseUploadOptions = {}) {
    const { t } = useTranslate('destination');

    const [upload, { loading }] = useMutation<uploadMutation, uploadMutationVariables>(
        uploadDocument,
        {
            onCompleted: (data) => {
                const { success, message, result } = data.upload;
                if (success && result) {
                    const uploadedUrl = typeof result === 'string' ? result : (result as any)?.url || '';
                    if (uploadedUrl) {
                        toast.success(t('success-upload') || 'File uploaded successfully');
                        onSuccess?.(uploadedUrl);
                    }
                    else {
                        const error = new Error('Upload failed: No URL returned');
                        toast.error(message || t('error-upload') || 'Failed to upload file');
                        onError?.(error);
                    }
                }
                else {
                    const error = new Error(message || 'Upload failed');
                    toast.error(message || t('error-upload') || 'Failed to upload file');
                    onError?.(error);
                }
            },
            onError: (error) => {
                toast.error(error.message || t('error-upload') || 'Failed to upload file');
                onError?.(error);
            },
        },
    );

    const uploadFile = useCallback(
        async (variables: uploadMutationVariables): Promise<string> => {
            try {
                const result = await upload({
                    variables,
                });

                const uploadedUrl = result.data?.upload?.result;
                const url = typeof uploadedUrl === 'string' ? uploadedUrl : (uploadedUrl as any)?.url || '';

                if (url) {
                    return url;
                }

                throw new Error('Upload failed: No URL returned');
            }
            catch (err) {
                const error = err instanceof Error ? err : new Error('Upload failed');
                throw error;
            }
        },
        [upload],
    );

    const uploadMultipleFiles = useCallback(
        async (files: File[], variables: Omit<uploadMutationVariables, 'file'>): Promise<string[]> => {
            const uploadPromises = files.map(file => uploadFile({ ...variables, file }));
            const results = await Promise.all(uploadPromises);
            return results.filter((result): result is string => result !== null && result !== '');
        },
        [uploadFile],
    );

    return {
        upload: uploadFile,
        uploadMultiple: uploadMultipleFiles,
        loading,
    };
}
