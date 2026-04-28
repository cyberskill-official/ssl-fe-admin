import { useMutation, useQuery } from '@cyberskill/shared/react/apollo-client';
import { useCallback, useMemo } from 'react';

import type {
    createReportMutation,
    createReportMutationVariables,
    deleteReportMutation,
    deleteReportMutationVariables,
    getReportsQuery,
    getReportsQueryVariables,
    Input_CreateReport,
    Input_QueryReport,
    Input_UpdateReport,
    T_Report,
    T_Response_Report,
    T_Response_Reports,
    updateReportMutation,
    updateReportMutationVariables,
} from '#shared/graphql';

import {
    createReportDocument,
    deleteReportDocument,
    getReportsDocument,
    updateReportDocument,
} from '#shared/graphql';

export function useGetReports(
    filter?: Input_QueryReport,
    options?: getReportsQueryVariables['options'],
) {
    const { data, loading, refetch } = useQuery<getReportsQuery, getReportsQueryVariables>(
        getReportsDocument,
        {
            variables: { filter, options },
            fetchPolicy: 'network-only',
        },
    );

    const reports = useMemo(() => {
        return (data?.getReports?.result?.docs || []).filter(Boolean) as T_Report[];
    }, [data]);

    const totalDocs = data?.getReports?.result?.totalDocs || 0;
    const paginationInfo = {
        limit: data?.getReports?.result?.limit || 0,
        hasPrevPage: data?.getReports?.result?.hasPrevPage || false,
        hasNextPage: data?.getReports?.result?.hasNextPage || false,
        page: data?.getReports?.result?.page || 1,
        totalPages: data?.getReports?.result?.totalPages || 1,
        offset: data?.getReports?.result?.offset || 0,
        prevPage: data?.getReports?.result?.prevPage || null,
        nextPage: data?.getReports?.result?.nextPage || null,
        pagingCounter: data?.getReports?.result?.pagingCounter || 0,
    };

    return { reports, totalDocs, paginationInfo, loading, refetch };
}

export function useUpdateReport() {
    const [updateReport, { loading }] = useMutation<updateReportMutation, updateReportMutationVariables>(
        updateReportDocument,
    );

    const execute = useCallback(
        (
            filter: Input_QueryReport,
            update?: Input_UpdateReport,
            options?: updateReportMutationVariables['options'],
        ) => {
            return updateReport({
                variables: {
                    filter,
                    update,
                    options,
                },
            });
        },
        [updateReport],
    );

    return {
        updateReport: execute,
        loading,
    };
}

export function useDeleteReport() {
    const [deleteReport, { loading }] = useMutation<deleteReportMutation, deleteReportMutationVariables>(
        deleteReportDocument,
    );

    const execute = useCallback(
        (
            filter: Input_QueryReport,
            options?: deleteReportMutationVariables['options'],
        ) => {
            return deleteReport({
                variables: {
                    filter,
                    options,
                },
            });
        },
        [deleteReport],
    );

    return {
        deleteReport: execute,
        loading,
    };
}

export function useCreateReport() {
    const [createReport, { loading }] = useMutation<createReportMutation, createReportMutationVariables>(
        createReportDocument,
    );

    const execute = useCallback((doc: Input_CreateReport) => {
        return createReport({
            variables: { doc },
        });
    }, [createReport]);

    return {
        createReport: execute,
        loading,
    };
}

export type T_UpdateReportResponse = T_Response_Report;
export type T_GetReportsResponse = T_Response_Reports;
