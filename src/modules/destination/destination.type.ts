import type { E_DestinationAgeGroup, E_DestinationRating, E_DestinationType, T_Destination } from '#shared/graphql';

interface I_DestinationFormMap {
    latitude?: null | number;
    longitude?: null | number;
}

interface I_DestinationFormLocation {
    address?: null | string;
    cityId?: null | string;
    countryId?: null | string;
    map?: I_DestinationFormMap | null;
}

interface I_DestinationFormRating {
    rate?: null | number;
    reason?: null | string;
}

interface I_DestinationFormSeo {
    altTextForImages?: null | string;
    description?: null | string;
    imageAltTexts?: unknown;
    keywords?: null | string[];
    socialImage?: null | string;
    socialMediaDescription?: null | string;
    title?: null | string;
    urlSlug?: unknown;
}

export interface I_DestinationFormHotel {
    description?: unknown;
    image?: null | string;
    location?: I_DestinationFormLocation | null;
    name?: unknown;
    url?: null | string;
}

export interface I_DestinationListProps {
    destinations: T_Destination[];
    loading?: boolean;
    onEditDestination?: (destination: T_Destination) => void;
    onCreateDestination?: () => void;
    onDeleteDestination?: (destination: T_Destination) => void;
    onToggleStatus?: (destinationId: string, currentIsActive: boolean) => void;
    updatingStatusId?: string;
    totalDocs?: number;
    page?: number;
    pageSize?: number;
    onPageChange?: (page: number) => void;
    onPageSizeChange?: (size: number) => void;
    search?: string;
    onSearchChange?: (value: string) => void;
    selectedType?: 'CLUB' | 'RESORT' | 'ALL';
    onTypeChange?: (type: 'CLUB' | 'RESORT' | 'ALL') => void;
    selectedRating?: 'GOLD' | 'SILVER' | 'BRONZE' | 'ALL';
    onRatingChange?: (rating: 'GOLD' | 'SILVER' | 'BRONZE' | 'ALL') => void;
    selectedStatus?: 'ACTIVE' | 'INACTIVE' | 'ALL';
    onStatusChange?: (status: 'ACTIVE' | 'INACTIVE' | 'ALL') => void;
    sortField?: 'name' | 'type' | 'rating' | 'createdAt';
    sortOrder?: 'asc' | 'desc';
    onSortChange?: (field: 'name' | 'type' | 'rating' | 'createdAt', order: 'asc' | 'desc') => void;
}

export interface I_DestinationCardProps {
    destination: T_Destination;
    onEdit: (destination: T_Destination) => void;
    onDelete: (destination: T_Destination) => void;
    onToggleStatus: (destinationId: string, currentIsActive: boolean) => void;
    updatingStatusId?: string;
    t: (key: string, params?: Record<string, unknown>) => string;
}

export interface I_DestinationFormProps {
    destination?: T_Destination;
    mode: 'create' | 'update';
    onSubmit: (data: Partial<T_Destination>) => void;
    onCancel: () => void;
    loading?: boolean;
}

export interface I_DestinationFormData {
    type: E_DestinationType;
    name: string;
    websiteURL: string;
    ageGroup: E_DestinationAgeGroup;
    rating: E_DestinationRating;
    images: string[];
    introductionHeadline: string;
    introductionContent: string;
    logo: string;
    location?: I_DestinationFormLocation;
    nearbyHotels: I_DestinationFormHotel[];
    wearImage: string;
    womenDressCode: string;
    menDressCode: string;
    useDefaultText: boolean;
    atmosphereRating: I_DestinationFormRating;
    guestsRating: I_DestinationFormRating;
    facilitiesRating: I_DestinationFormRating;
    serviceRating: I_DestinationFormRating;
    xFactorRating: I_DestinationFormRating;
    highlightSex: string;
    highlightWellness: string;
    highlightBar: string;
    highlightDance: string;
    seo: I_DestinationFormSeo;
    linkTo: string;
    isActive: boolean;
}

export interface I_DestinationPreviewProps {
    formData: I_DestinationFormData;
    t: (key: string, params?: Record<string, unknown>) => string;
}

export interface I_DestinationFormRef {
    open: (destination?: T_Destination) => void;
    close: () => void;
}
