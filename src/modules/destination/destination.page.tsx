import { log } from '@cyberskill/shared/react/log';
import { toast } from '@cyberskill/shared/react/toast';
import { Globe } from 'lucide-react';
import { motion } from 'motion/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { E_DestinationRating, E_DestinationType, Input_CreateDestination, Input_UpdateDestination, T_Destination } from '#shared/graphql';

import { ConfirmDialog } from '#shared/component/confirm-dialog';
import { useTranslate } from '#shared/i18n';
import { usePortal } from '#shared/portal';

import type { I_DestinationFormRef } from './destination.type';

import { DestinationForm } from './destination-form';
import { DestinationList } from './destination-list';
import { getDestinationText } from './destination-text';
import { useCreateDestination, useDeleteDestination, useGetDestinations, useUpdateDestination } from './destination.hook';

const DEFAULT_SEARCH_LIMIT = 1000;
const DIACRITICS_RE = /[\u0300-\u036F]/g;
const NON_SEARCH_CHAR_RE = /[^\p{L}\p{N}]+/gu;
const WHITESPACE_RE = /\s+/g;

/** Normalize a string for fuzzy-ish search: lowercase + remove diacritics + collapse whitespace */
function normalizeSearch(str: string): string {
    return str
        .toLowerCase()
        .normalize('NFD')
        .replace(DIACRITICS_RE, '')
        .replace(NON_SEARCH_CHAR_RE, ' ')
        .replace(WHITESPACE_RE, ' ')
        .trim();
}

export function DestinationPage() {
    const { t } = useTranslate('destination');
    const { setHeader } = usePortal();
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [search, setSearch] = useState('');
    const [searchLimit, setSearchLimit] = useState(DEFAULT_SEARCH_LIMIT);
    const [selectedType, setSelectedType] = useState<'CLUB' | 'RESORT' | 'ALL'>('ALL');
    const [selectedRating, setSelectedRating] = useState<'GOLD' | 'SILVER' | 'BRONZE' | 'ALL'>('ALL');
    const [selectedStatus, setSelectedStatus] = useState<'ACTIVE' | 'INACTIVE' | 'ALL'>('ALL');
    const [sortField, setSortField] = useState<'name' | 'type' | 'rating' | 'createdAt'>('createdAt');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [deleting, setDeleting] = useState(false);
    const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
    const [destinationToDelete, setDestinationToDelete] = useState<T_Destination | null>(null);
    const destinationFormRef = useRef<I_DestinationFormRef>(null);

    useEffect(() => {
        setHeader({
            title: t('title'),
            description: t('destinations-hint'),
            icon: Globe,
        });

        return () => setHeader(null);
    }, [setHeader, t]);

    const isSearching = search.trim().length > 0;

    const filter = useMemo(() => {
        const filterObj: {
            type?: E_DestinationType;
            rating?: E_DestinationRating;
            isActive?: boolean;
        } = {};

        if (selectedType !== 'ALL') {
            filterObj.type = selectedType as E_DestinationType;
        }

        if (selectedRating !== 'ALL') {
            filterObj.rating = selectedRating as E_DestinationRating;
        }

        if (selectedStatus !== 'ALL') {
            filterObj.isActive = selectedStatus === 'ACTIVE';
        }

        return filterObj;
    }, [selectedType, selectedRating, selectedStatus]);

    const options = useMemo(() => ({
        page: isSearching ? 1 : page,
        limit: isSearching ? searchLimit : pageSize,
        sort: { [sortField]: sortOrder === 'desc' ? -1 : 1 },
        populate: ['createdBy', 'location', 'nearbyHotels.location'],
    }), [page, pageSize, searchLimit, sortField, sortOrder, isSearching]);

    const { destinations: rawDestinations, loading, refetch, totalDocs: rawTotalDocs } = useGetDestinations(filter, options);

    useEffect(() => {
        if (isSearching && rawTotalDocs > searchLimit) {
            // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect
            setSearchLimit(rawTotalDocs);
        }
    }, [isSearching, rawTotalDocs, searchLimit]);

    const filteredDestinations = useMemo(() => {
        if (!isSearching)
            return rawDestinations;
        const searchTerms = normalizeSearch(search).split(' ').filter(Boolean);
        if (searchTerms.length === 0)
            return rawDestinations;

        return rawDestinations.filter((d: T_Destination) => {
            const name = normalizeSearch(getDestinationText(d?.name));
            const address = normalizeSearch(d?.location?.address || '');
            const cityName = normalizeSearch(getDestinationText(d?.location?.city?.name));
            const countryName = normalizeSearch(getDestinationText(d?.location?.country?.name));

            return searchTerms.every(term =>
                name.includes(term)
                || address.includes(term)
                || cityName.includes(term)
                || countryName.includes(term),
            );
        });
    }, [rawDestinations, search, isSearching]);

    const destinations = useMemo(() => {
        if (!isSearching)
            return filteredDestinations;
        const start = (page - 1) * pageSize;
        return filteredDestinations.slice(start, start + pageSize);
    }, [filteredDestinations, page, pageSize, isSearching]);

    const totalDocs = isSearching ? filteredDestinations.length : rawTotalDocs;
    const { createDestination, loading: creatingDestination } = useCreateDestination();
    const { updateDestination, loading: updatingDestination } = useUpdateDestination();
    const { deleteDestination } = useDeleteDestination();

    const _handleCreateDestination = useCallback(() => {
        destinationFormRef.current?.open();
    }, []);

    const _handleEditDestination = useCallback((destination: T_Destination) => {
        destinationFormRef.current?.open(destination);
    }, []);

    const _handleDeleteDestination = useCallback((destination: T_Destination) => {
        setDestinationToDelete(destination);
    }, []);

    const _handleToggleStatus = useCallback(async (destinationId: string, currentIsActive: boolean) => {
        const destination = destinations?.find(d => d.id === destinationId);
        if (!destination) {
            toast.error(t('error.destination-not-found'));
            return;
        }
        setUpdatingStatusId(destinationId);
        try {
            await updateDestination(
                destinationId,
                { isActive: !currentIsActive },
            );
            await refetch();
        }
        catch (error) {
            log.error('Error updating destination status:', error);
            toast.error(t('error-update-status'));
        }
        finally {
            setUpdatingStatusId(null);
        }
    }, [destinations, updateDestination, refetch, t]);

    const _handleCreateSubmit = useCallback(async (data: Input_CreateDestination) => {
        await createDestination(data);
        await refetch();
    }, [createDestination, refetch]);

    const _handleUpdateSubmit = useCallback(async (id: string, data: Input_UpdateDestination) => {
        await updateDestination(id, data);
        // Force refetch to get updated data including location information
        await refetch();

        // Optional: Show success toast
    }, [updateDestination, refetch]);

    const _handlePageChange = useCallback((newPage: number) => {
        setPage(newPage);
    }, []);

    const _handlePageSizeChange = useCallback((newPageSize: number) => {
        setPageSize(newPageSize);
        setPage(1);
    }, []);

    const _handleSearchChange = useCallback((value: string) => {
        setSearch(value);
        setSearchLimit(DEFAULT_SEARCH_LIMIT);
        setPage(1);
    }, []);

    const _handleTypeChange = useCallback((type: 'CLUB' | 'RESORT' | 'ALL') => {
        setSelectedType(type);
        setPage(1);
    }, []);

    const _handleRatingChange = useCallback((rating: 'GOLD' | 'SILVER' | 'BRONZE' | 'ALL') => {
        setSelectedRating(rating);
        setPage(1);
    }, []);

    const _handleStatusChange = useCallback((status: 'ACTIVE' | 'INACTIVE' | 'ALL') => {
        setSelectedStatus(status);
        setPage(1);
    }, []);

    const _handleSortChange = useCallback((field: 'name' | 'type' | 'rating' | 'createdAt', order: 'asc' | 'desc') => {
        setSortField(field);
        setSortOrder(order);
        setPage(1);
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
            {/* Background Pattern */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-200 dark:bg-purple-900/30 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-200 dark:bg-blue-900/30 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
                <div className="absolute top-40 left-40 w-80 h-80 bg-pink-200 dark:bg-pink-900/30 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
            </div>

            {/* Main Content */}
            <div className="relative z-10 p-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <DestinationList
                        destinations={destinations}
                        loading={loading}
                        onEditDestination={_handleEditDestination}
                        onCreateDestination={_handleCreateDestination}
                        onDeleteDestination={_handleDeleteDestination}
                        onToggleStatus={_handleToggleStatus}
                        updatingStatusId={updatingStatusId || undefined}
                        totalDocs={totalDocs}
                        page={page}
                        pageSize={pageSize}
                        onPageChange={_handlePageChange}
                        onPageSizeChange={_handlePageSizeChange}
                        search={search}
                        onSearchChange={_handleSearchChange}
                        selectedType={selectedType}
                        onTypeChange={_handleTypeChange}
                        selectedRating={selectedRating}
                        onRatingChange={_handleRatingChange}
                        selectedStatus={selectedStatus}
                        onStatusChange={_handleStatusChange}
                        sortField={sortField}
                        sortOrder={sortOrder}
                        onSortChange={_handleSortChange}
                    />
                </motion.div>
            </div>

            {/* Form and Dialog Overlays */}
            <DestinationForm
                ref={destinationFormRef}
                onCreateSubmit={_handleCreateSubmit}
                onUpdateSubmit={_handleUpdateSubmit}
                creating={creatingDestination}
                updating={updatingDestination}
            />
            <ConfirmDialog
                open={!!destinationToDelete}
                title={t('delete-destination')}
                description={(
                    <span>
                        {t('confirm.delete-destination')}
                        &nbsp;
                        <b>{getDestinationText(destinationToDelete?.name)}</b>
                        ?
                    </span>
                )}
                onCancel={() => setDestinationToDelete(null)}
                onConfirm={async () => {
                    if (!destinationToDelete?.id) {
                        toast.error(t('error.destination-not-found'));
                        return;
                    }
                    setDeleting(true);
                    await deleteDestination({ id: destinationToDelete.id });
                    setDeleting(false);
                    setDestinationToDelete(null);
                    await refetch();
                }}
                loading={deleting}
                confirmLabel={t('delete')}
                cancelLabel={t('cancel')}
            />
        </div>
    );
}

export default DestinationPage;
