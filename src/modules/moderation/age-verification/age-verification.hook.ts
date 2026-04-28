import { useMutation } from '@cyberskill/shared/react/apollo-client';
import { toast } from '@cyberskill/shared/react/toast';

import type {
    approveAgeVerifyMutation,
    approveAgeVerifyMutationVariables,
    rejectAgeVerifyMutation,
    rejectAgeVerifyMutationVariables,
} from '#shared/graphql';

import { approveAgeVerifyDocument, rejectAgeVerifyDocument } from '#shared/graphql';

import type { I_Input_ApproveAgeVerify, I_Input_RejectAgeVerify } from './age-verification.type.js';

export function useApproveAgeVerify() {
    const [approveAgeVerify, { loading: approveLoading }] = useMutation<
        approveAgeVerifyMutation,
        approveAgeVerifyMutationVariables
    >(approveAgeVerifyDocument, {
        onCompleted: (data) => {
            if (data?.approveAgeVerify?.success) {
                toast.success('Age verification approved successfully');
            }
            else {
                toast.error(data?.approveAgeVerify?.message || 'Failed to approve age verification');
            }
        },
        onError: (error) => {
            console.error('Approve age verify error:', error);
            toast.error('Failed to approve age verification');
        },
    });

    const handleApprove = async (input: I_Input_ApproveAgeVerify) => {
        try {
            const result = await approveAgeVerify({
                variables: {
                    userId: input.userId,
                },
            });
            return result;
        }
        catch (error) {
            console.error('Error approving age verification:', error);
            throw error;
        }
    };

    return {
        approveAgeVerify: handleApprove,
        approveLoading,
    };
}

export function useRejectAgeVerify() {
    const [rejectAgeVerify, { loading: rejectLoading }] = useMutation<
        rejectAgeVerifyMutation,
        rejectAgeVerifyMutationVariables
    >(rejectAgeVerifyDocument, {
        onCompleted: (data) => {
            if (data?.rejectAgeVerify?.success) {
                toast.success('Age verification rejected successfully');
            }
            else {
                toast.error(data?.rejectAgeVerify?.message || 'Failed to reject age verification');
            }
        },
        onError: (error) => {
            console.error('Reject age verify error:', error);
            toast.error('Failed to reject age verification');
        },
    });

    const handleReject = async (input: I_Input_RejectAgeVerify) => {
        try {
            const result = await rejectAgeVerify({
                variables: {
                    userId: input.userId,
                    reason: input.reason,
                },
            });
            return result;
        }
        catch (error) {
            console.error('Error rejecting age verification:', error);
            throw error;
        }
    };

    return {
        rejectAgeVerify: handleReject,
        rejectLoading,
    };
}

// Combined hook for both approve and reject operations
export function useAgeVerification() {
    const { approveAgeVerify, approveLoading } = useApproveAgeVerify();
    const { rejectAgeVerify, rejectLoading } = useRejectAgeVerify();

    return {
        approveAgeVerify,
        rejectAgeVerify,
        loading: approveLoading || rejectLoading,
    };
}
