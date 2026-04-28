import type { I_Input_Location } from '#modules/location/location/location.type';
import type { E_DestinationAgeGroup, E_DestinationRating, E_DestinationType, T_Destination, T_Hotel, T_Seo } from '#shared/graphql';

export type { T_Hotel } from '#shared/graphql';

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
    t: (key: string, params?: Record<string, any>) => string;
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
    location?: I_Input_Location;
    nearbyHotels: T_Hotel[];
    wearImage: string;
    womenDressCode: string;
    menDressCode: string;
    useDefaultText: boolean;
    atmosphereRating: { rate: number; reason: string };
    guestsRating: { rate: number; reason: string };
    facilitiesRating: { rate: number; reason: string };
    serviceRating: { rate: number; reason: string };
    xFactorRating: { rate: number; reason: string };
    highlightSex: string;
    highlightWellness: string;
    highlightBar: string;
    highlightDance: string;
    seo: T_Seo;
    linkTo: string;
    isActive: boolean;
}

export interface I_DestinationPreviewProps {
    formData: I_DestinationFormData;
    t: (key: string, params?: Record<string, any>) => string;
}

export interface I_DestinationFormRef {
    open: (destination?: T_Destination) => void;
    close: () => void;
}
