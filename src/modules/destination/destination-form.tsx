import type { FieldPath } from 'react-hook-form';

import { useLazyQuery } from '@cyberskill/shared/react/apollo-client';
import {
    Building,
    Calendar,
    Camera,
    Coffee,
    Globe,
    Heart,
    Link as LinkIcon,
    Loader2,
    MapPin,
    Moon,
    Music,
    Palette,
    Save,
    Search,
    Sparkles,
    Star,
    Sun,
    Upload,
    Users,
    X,
    Zap,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Controller, useForm } from 'react-hook-form';

import type { Input_CreateDestination, Input_UpdateDestination, T_City, T_Destination } from '#shared/graphql';

import { useGetCountries } from '#modules/location';
import { useGetCities } from '#modules/location/city/city.hook';
import { useUpload } from '#modules/upload/upload.hook';
import { AutocompleteSelect, Badge, Button, Drawer, DrawerContent, DrawerHeader, DrawerTitle, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Switch } from '#shared/component';
import { Editor } from '#shared/component/editor';
import { FloatLabel } from '#shared/component/float-label';
import { MapTilerPicker } from '#shared/component/map/maptiler';
import { getEnv } from '#shared/env';
import { E_DestinationAgeGroup, E_DestinationRating, E_DestinationType, E_UploadEntity, E_UploadType, getCitiesDocument } from '#shared/graphql';
import { useKeyboardShortcuts } from '#shared/hooks';
import { useTranslate } from '#shared/i18n';
import { E_FormMode } from '#shared/typescript';
import { cn } from '#shared/util';

import type { I_DestinationFormData, I_DestinationFormProps, I_DestinationFormRef, T_Hotel } from './destination.type';

import { useGetDestination } from './destination.hook';

interface I_MapTilerFeature {
    place_type?: string[];
    place_name?: string;
    text?: string;
}

const FORM_DEFAULT_VALUES: I_DestinationFormData = {
    type: E_DestinationType.CLUB,
    name: '',
    websiteURL: '',
    rating: E_DestinationRating.BRONZE,
    location: {
        countryId: '',
        cityId: '',
        address: '',
        map: { latitude: undefined, longitude: undefined },
    },
    images: [],
    introductionHeadline: '',
    introductionContent: '',
    ageGroup: E_DestinationAgeGroup.A18_25,
    logo: '',
    nearbyHotels: [],
    wearImage: '',
    womenDressCode: '',
    menDressCode: '',
    useDefaultText: false,
    atmosphereRating: { rate: 0, reason: '' },
    guestsRating: { rate: 0, reason: '' },
    facilitiesRating: { rate: 0, reason: '' },
    serviceRating: { rate: 0, reason: '' },
    xFactorRating: { rate: 0, reason: '' },
    highlightSex: '',
    highlightWellness: '',
    highlightBar: '',
    highlightDance: '',
    seo: {
        title: '',
        description: '',
        keywords: [],
        socialImage: '',
        socialMediaDescription: '',
        altTextForImages: '',
    },
    linkTo: '',
    isActive: false,
};

export function DestinationForm({ ref, onCreateSubmit, onUpdateSubmit, creating, updating }: Omit<I_DestinationFormProps, 'destination' | 'mode' | 'onSubmit' | 'onCancel' | 'loading'> & {
    onCreateSubmit: (data: Input_CreateDestination) => void;
    onUpdateSubmit: (id: string, data: Input_UpdateDestination) => void;
    creating?: boolean;
    updating?: boolean;
} & { ref?: React.RefObject<I_DestinationFormRef | null> }) {
    const { t } = useTranslate('destination');
    const { upload, loading: uploadLoading } = useUpload();
    const { countries } = useGetCountries({ isDel: false }, { pagination: false });
    const [isOpen, setIsOpen] = useState(false);
    const [mode, setMode] = useState<E_FormMode>(E_FormMode.Create);
    const [currentDestination, setCurrentDestination] = useState<T_Destination>();
    const [socialShareImage, setSocialShareImage] = useState<string | null>(null);
    const [showMapPicker, setShowMapPicker] = useState(false);
    const [showHotelMapPicker, setShowHotelMapPicker] = useState<number | null>(null);
    const [hotelCitiesCache, setHotelCitiesCache] = useState<Record<string, T_City[]>>({});
    const [shouldRefetchCities, setShouldRefetchCities] = useState(false);
    const [refreshingDestination, setRefreshingDestination] = useState(false);

    const { destination: refreshedDestination, refetch: refetchDestination } = useGetDestination(
        { id: currentDestination?.id },
        undefined,
        { populate: ['location', 'nearbyHotels.location'] },
    );

    const destinationToUse = (mode === E_FormMode.Update && refreshedDestination) ? refreshedDestination : currentDestination;

    const [showRatings, setShowRatings] = useState(false);
    const [showHighlights, setShowHighlights] = useState(false);
    const [publishStatus, setPublishStatus] = useState<'draft' | 'published'>('draft');
    const [enabledHighlights, setEnabledHighlights] = useState({
        highlightSex: false,
        highlightWellness: false,
        highlightBar: false,
        highlightDance: false,
    });

    const [getCitiesForCountry] = useLazyQuery(getCitiesDocument, {
        fetchPolicy: 'network-only',
    });

    const formRef = useRef<HTMLFormElement>(null);
    const headerRef = useRef<HTMLDivElement>(null);
    const env = getEnv();

    const {
        register,
        handleSubmit,
        control,
        setValue,
        watch,
        formState: { errors },
        reset,
    } = useForm<I_DestinationFormData>({
        defaultValues: FORM_DEFAULT_VALUES,
        mode: 'onSubmit',
    });

    const selectedCountryId = watch('location.countryId');
    const { cities, loading: citiesLoading, refetch: refetchCities } = useGetCities(
        { isDel: false, countryId: selectedCountryId || undefined },
        { skip: !selectedCountryId, pagination: false },
    );

    useEffect(() => {
        if (selectedCountryId && (refetchCities || shouldRefetchCities)) {
            refetchCities?.();
            if (shouldRefetchCities) {
                // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect
                setShouldRefetchCities(false);
            }
        }
    }, [selectedCountryId, refetchCities, shouldRefetchCities]);

    useEffect(() => {
        if (destinationToUse && cities.length > 0 && mode === E_FormMode.Update) {
            const expectedCityId = destinationToUse.location?.cityId ? String(destinationToUse.location.cityId) : '';
            const currentCityId = watch('location.cityId');

            if (expectedCityId && expectedCityId !== currentCityId) {
                const cityExists = cities.some(city => city.id === expectedCityId);
                if (cityExists) {
                    setValue('location.cityId', expectedCityId);
                }
            }
        }
    }, [cities, destinationToUse, mode, setValue, watch]);

    register('images', {
        required: t('error-images-required'),
        validate: (value) => {
            if (!value || value.length === 0) {
                return t('error-images-required');
            }
            return true;
        },
    });

    useEffect(() => {
        const loadCitiesForHotels = async () => {
            const hotelCountryIds = (watch('nearbyHotels') || [])
                .map((_, index) => watch(`nearbyHotels.${index}.location.countryId`))
                .filter(Boolean);

            const uniqueCountryIds = [...new Set(hotelCountryIds)];

            for (const countryId of uniqueCountryIds) {
                if (countryId && !hotelCitiesCache[countryId]) {
                    try {
                        const result = await getCitiesForCountry({
                            variables: {
                                filter: { isDel: false, countryId },
                                options: { pagination: false },
                            },
                        });

                        if (result.data?.getCities?.result?.docs) {
                            setHotelCitiesCache(prev => ({
                                ...prev,
                                [countryId]: result.data.getCities.result.docs,
                            }));
                        }
                    }
                    catch (error) {
                        console.error('Failed to load cities for country:', countryId, error);
                        setHotelCitiesCache(prev => ({
                            ...prev,
                            [countryId]: [],
                        }));
                    }
                }
            }
        };

        loadCitiesForHotels();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [JSON.stringify((watch('nearbyHotels') || []).map((_, index) => watch(`nearbyHotels.${index}.location.countryId`))), getCitiesForCountry, hotelCitiesCache]);

    useEffect(() => {
        if (destinationToUse) {
            const countryId = destinationToUse.location?.countryId ? String(destinationToUse.location.countryId) : '';
            const type = (destinationToUse.type as E_DestinationType) ?? E_DestinationType.CLUB;
            reset({
                ...FORM_DEFAULT_VALUES,
                type,
                name: destinationToUse.name ?? '',
                websiteURL: destinationToUse.websiteURL ?? '',
                rating: destinationToUse.rating ?? undefined,
                location: {
                    ...destinationToUse.location,
                    countryId,
                    cityId: destinationToUse.location?.cityId ? String(destinationToUse.location.cityId) : '',
                    address: destinationToUse.location?.address ?? '',
                    map: {
                        latitude: destinationToUse.location?.map?.latitude || undefined,
                        longitude: destinationToUse.location?.map?.longitude || undefined,
                    },
                },
                images: (destinationToUse.images as (string | null | undefined)[] ?? []).filter((img): img is string => typeof img === 'string'),
                introductionHeadline: destinationToUse.introductionHeadline ?? '',
                introductionContent: destinationToUse.introductionContent ?? '',
                ageGroup: destinationToUse.ageGroup ?? undefined,
                logo: destinationToUse.logo ?? '',
                nearbyHotels: (destinationToUse.nearbyHotels ?? []).map(hotel => ({
                    name: hotel?.name ?? '',
                    location: {
                        address: hotel?.location?.address ?? '',
                        countryId: hotel?.location?.countryId ?? hotel?.locationId ?? '',
                        cityId: hotel?.location?.cityId ?? '',
                        map: {
                            latitude: hotel?.location?.map?.latitude || undefined,
                            longitude: hotel?.location?.map?.longitude || undefined,
                        },
                    },
                    url: hotel?.url ?? '',
                    description: hotel?.description ?? '',
                    image: hotel?.image ?? '',
                })),
                wearImage: destinationToUse.wearImage ?? '',
                womenDressCode: destinationToUse.womenDressCode ?? '',
                menDressCode: destinationToUse.menDressCode ?? '',
                useDefaultText: destinationToUse.useDefaultText ?? false,
                atmosphereRating: {
                    rate: destinationToUse.atmosphereRating?.rate ?? 0,
                    reason: destinationToUse.atmosphereRating?.reason ?? '',
                },
                guestsRating: {
                    rate: destinationToUse.guestsRating?.rate ?? 0,
                    reason: destinationToUse.guestsRating?.reason ?? '',
                },
                facilitiesRating: {
                    rate: destinationToUse.facilitiesRating?.rate ?? 0,
                    reason: destinationToUse.facilitiesRating?.reason ?? '',
                },
                serviceRating: {
                    rate: destinationToUse.serviceRating?.rate ?? 0,
                    reason: destinationToUse.serviceRating?.reason ?? '',
                },
                xFactorRating: {
                    rate: destinationToUse.xFactorRating?.rate ?? 0,
                    reason: destinationToUse.xFactorRating?.reason ?? '',
                },
                highlightSex: destinationToUse.highlightSex ?? '',
                highlightWellness: destinationToUse.highlightWellness ?? '',
                highlightBar: destinationToUse.highlightBar ?? '',
                highlightDance: destinationToUse.highlightDance ?? '',
                seo: {
                    ...FORM_DEFAULT_VALUES.seo,
                    ...destinationToUse.seo,
                },
                linkTo: destinationToUse.linkTo ?? '',
                isActive: destinationToUse.isActive ?? false,
            });

            const timeout = setTimeout(() => {
                setValue('location.countryId', countryId);
                setValue('type', type);
                if (countryId && refetchCities) {
                    refetchCities();
                }
                // eslint-disable-next-line react-web-api/no-leaked-timeout
                setTimeout(() => {
                    const cityId = destinationToUse.location?.cityId ? String(destinationToUse.location.cityId) : '';
                    if (cityId) {
                        setValue('location.cityId', cityId);
                    }
                }, 200);
            }, 0);

            return () => clearTimeout(timeout);
        }
        else {
            reset(FORM_DEFAULT_VALUES);
        }
    }, [destinationToUse, reset, setValue, refetchCities]);

    useEffect(() => {
        const formData = watch();
        // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect
        setEnabledHighlights({
            highlightSex: !!formData.highlightSex,
            highlightWellness: !!formData.highlightWellness,
            highlightBar: !!formData.highlightBar,
            highlightDance: !!formData.highlightDance,
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [watch('highlightSex'), watch('highlightWellness'), watch('highlightBar'), watch('highlightDance')]);

    useEffect(() => {
        if (destinationToUse) {
            // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect
            setPublishStatus(destinationToUse.isActive ? 'published' : 'draft');

            const hasRatings = [
                destinationToUse.atmosphereRating?.rate,
                destinationToUse.guestsRating?.rate,
                destinationToUse.facilitiesRating?.rate,
                destinationToUse.serviceRating?.rate,
                destinationToUse.xFactorRating?.rate,
            ].some(rate => !!rate);
            // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect
            setShowRatings(hasRatings);

            const hasHighlights = [
                destinationToUse.highlightSex,
                destinationToUse.highlightWellness,
                destinationToUse.highlightBar,
                destinationToUse.highlightDance,
            ].some(val => !!val);
            // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect
            setShowHighlights(hasHighlights);

            // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect
            setEnabledHighlights({
                highlightSex: !!destinationToUse.highlightSex,
                highlightWellness: !!destinationToUse.highlightWellness,
                highlightBar: !!destinationToUse.highlightBar,
                highlightDance: !!destinationToUse.highlightDance,
            });
        }
    }, [destinationToUse]);

    useImperativeHandle(ref, () => ({
        open: async (destination?: T_Destination) => {
            setCurrentDestination(destination);
            setMode(destination ? E_FormMode.Update : E_FormMode.Create);
            setIsOpen(true);
            setSocialShareImage(destination?.seo?.socialImage || null);

            if (destination) {
                setRefreshingDestination(true);
                try {
                    await refetchDestination();
                }
                catch (error) {
                    console.error('Failed to refetch destination:', error);
                }
                finally {
                    setRefreshingDestination(false);
                }
            }
            else {
                reset(FORM_DEFAULT_VALUES);
            }
        },
        close: () => {
            setIsOpen(false);
            setCurrentDestination(undefined);
            reset(FORM_DEFAULT_VALUES);
        },
    }));

    const _handleCancel = useCallback(() => {
        setIsOpen(false);
        setCurrentDestination(undefined);
    }, []);

    const _handleKeyboardSubmit = useCallback(() => {
        if (formRef.current) {
            const submitButton = formRef.current.querySelector('button[type="submit"]') as HTMLButtonElement;
            if (submitButton && !submitButton.disabled) {
                submitButton.click();
            }
        }
    }, []);

    useKeyboardShortcuts({
        isActive: isOpen,
        onEscape: _handleCancel,
        onEnter: _handleKeyboardSubmit,
        requireCtrlOrMeta: true,
    });

    const _handleFileUpload = useCallback(async (file: File): Promise<string | null> => {
        try {
            const url = await upload({
                type: E_UploadType.IMAGE,
                entity: E_UploadEntity.USER,
                file,
                entityId: currentDestination?.id || '',
            });
            return url;
        }
        catch (error) {
            console.error('Upload failed:', error);
            return null;
        }
    }, [upload, currentDestination?.id]);

    const imagesDropzone = useDropzone({
        accept: { 'image/*': ['.jpeg', '.jpg', '.png'] },
        maxFiles: 10,
        onDrop: async (acceptedFiles) => {
            const newUrls = await Promise.all(acceptedFiles.map(file => _handleFileUpload(file)));
            const validUrls = newUrls.filter((url): url is string => url !== null);
            const prev = watch('images') || [];
            const newImages = [...prev, ...validUrls].slice(0, 10);
            setValue('images', newImages);
        },
    });

    const logoDropzone = useDropzone({
        accept: { 'image/*': ['.jpeg', '.jpg', '.png'] },
        maxFiles: 1,
        onDrop: async (acceptedFiles) => {
            const file = acceptedFiles[0];
            if (file) {
                const url = await _handleFileUpload(file);
                if (url) {
                    setValue('logo', url);
                }
            }
        },
    });

    const wearImageDropzone = useDropzone({
        accept: { 'image/*': ['.jpeg', '.jpg', '.png'] },
        maxFiles: 1,
        onDrop: async (acceptedFiles) => {
            const file = acceptedFiles[0];
            if (file) {
                const url = await _handleFileUpload(file);
                if (url) {
                    setValue('wearImage', url);
                }
            }
        },
    });

    const seoImageDropzone = useDropzone({
        accept: { 'image/*': ['.jpeg', '.jpg', '.png'] },
        maxFiles: 1,
        onDrop: async (acceptedFiles) => {
            const file = acceptedFiles[0];
            if (file) {
                const url = await _handleFileUpload(file);
                if (url) {
                    setSocialShareImage(url);
                    setValue('seo.socialImage', url);
                }
            }
        },
    });

    const _handleRatingChange = (category: keyof Pick<I_DestinationFormData, 'atmosphereRating' | 'guestsRating' | 'facilitiesRating' | 'serviceRating' | 'xFactorRating'>, rate: number) => {
        setValue(category, { ...watch(category), rate });
    };

    const _handleHighlightChange = (category: keyof Pick<I_DestinationFormData, 'highlightSex' | 'highlightWellness' | 'highlightBar' | 'highlightDance'>, description: string) => {
        setValue(category, description);
    };

    const _handleMapLocationSelect = (data: { lng: number; lat: number; address: string; countryId: string; cityId?: string }) => {
        console.warn('Map location selected:', data);
        setValue('location.address', data.address);
        setValue('location.countryId', data.countryId);
        setValue('location.cityId', data.cityId || '');
        setValue('location.map.latitude', data.lat);
        setValue('location.map.longitude', data.lng);

        setShowMapPicker(false);
    };

    const _handleCoordinatePaste = useCallback(async (lat: number, lng: number) => {
        setValue('location.map.latitude', lat, { shouldDirty: true });
        setValue('location.map.longitude', lng, { shouldDirty: true });
        try {
            const response = await fetch(`https://api.maptiler.com/geocoding/${lng},${lat}.json?key=${env.VITE_MAPTILER_KEY}`);
            const geo = await response.json();

            if (geo?.features && geo.features.length > 0) {
                let bestAddress = '';

                const addressFeature = geo.features.find((feature: I_MapTilerFeature) =>
                    feature.place_type?.includes('address')
                    || feature.place_type?.includes('poi')
                    || feature.place_type?.includes('postcode'),
                );

                if (addressFeature) {
                    bestAddress = addressFeature.place_name || addressFeature.text;
                }

                if (!bestAddress) {
                    const detailedFeature = geo.features.reduce((prev: I_MapTilerFeature, curr: I_MapTilerFeature) => {
                        const prevLength = prev?.place_name?.length || 0;
                        const currLength = curr?.place_name?.length || 0;
                        return currLength > prevLength ? curr : prev;
                    });
                    bestAddress = detailedFeature?.place_name || detailedFeature?.text;
                }

                if (!bestAddress) {
                    bestAddress = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
                }

                setValue('location.address', bestAddress);
                const countryFeature = geo.features.find((feature: I_MapTilerFeature) =>
                    feature.place_type?.includes('country'),
                );

                if (countryFeature) {
                    const countryName = countryFeature.text;
                    const foundCountry = countries?.find(c =>
                        c.name?.toLowerCase() === countryName.toLowerCase(),
                    );

                    if (foundCountry) {
                        setValue('location.countryId', foundCountry.id);

                        setShouldRefetchCities(true);
                        const cityFeature = geo.features.find((feature: I_MapTilerFeature) =>
                            feature.place_type?.includes('place') || feature.place_type?.includes('locality'),
                        );

                        if (cityFeature) {
                            const cityName = cityFeature.text;
                            setTimeout(() => {
                                const foundCity = cities?.find(c =>
                                    c.countryId === foundCountry.id && c.name?.toLowerCase() === cityName.toLowerCase(),
                                );
                                if (foundCity) {
                                    setValue('location.cityId', foundCity.id);
                                }
                            }, 1000);
                        }
                    }
                }
            }
        }
        catch (error) {
            console.error('Reverse geocoding failed:', error);
            setValue('location.address', `${lat.toFixed(6)}, ${lng.toFixed(6)}`);
        }
    }, [setValue, env.VITE_MAPTILER_KEY, countries, cities, setShouldRefetchCities]);

    const _handleHotelMapLocationSelect = (hotelIndex: number, data: { lng: number; lat: number; address: string; countryId: string; cityId?: string }) => {
        setValue(`nearbyHotels.${hotelIndex}.location.address`, data.address);
        setValue(`nearbyHotels.${hotelIndex}.location.countryId`, data.countryId);
        setValue(`nearbyHotels.${hotelIndex}.location.cityId`, data.cityId || '');
        setValue(`nearbyHotels.${hotelIndex}.location.map.latitude`, data.lat);
        setValue(`nearbyHotels.${hotelIndex}.location.map.longitude`, data.lng);

        setShowHotelMapPicker(null);
    };

    const _handleHotelCoordinatePaste = useCallback(async (hotelIndex: number, lat: number, lng: number) => {
        setValue(`nearbyHotels.${hotelIndex}.location.map.latitude`, lat, { shouldDirty: true });
        setValue(`nearbyHotels.${hotelIndex}.location.map.longitude`, lng, { shouldDirty: true });
        try {
            const response = await fetch(`https://api.maptiler.com/geocoding/${lng},${lat}.json?key=${env.VITE_MAPTILER_KEY}`);
            const geo = await response.json();

            if (geo?.features && geo.features.length > 0) {
                let bestAddress = '';

                const addressFeature = geo.features.find((feature: I_MapTilerFeature) =>
                    feature.place_type?.includes('address')
                    || feature.place_type?.includes('poi')
                    || feature.place_type?.includes('postcode'),
                );

                if (addressFeature) {
                    bestAddress = addressFeature.place_name || addressFeature.text;
                }

                if (!bestAddress) {
                    const detailedFeature = geo.features.reduce((prev: I_MapTilerFeature, curr: I_MapTilerFeature) => {
                        const prevLength = prev?.place_name?.length || 0;
                        const currLength = curr?.place_name?.length || 0;
                        return currLength > prevLength ? curr : prev;
                    });
                    bestAddress = detailedFeature?.place_name || detailedFeature?.text;
                }

                if (!bestAddress) {
                    bestAddress = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
                }

                setValue(`nearbyHotels.${hotelIndex}.location.address`, bestAddress);
                const countryFeature = geo.features.find((feature: I_MapTilerFeature) =>
                    feature.place_type?.includes('country'),
                );

                if (countryFeature) {
                    const countryName = countryFeature.text;
                    const foundCountry = countries?.find(c =>
                        c.name?.toLowerCase() === countryName.toLowerCase(),
                    );

                    if (foundCountry) {
                        setValue(`nearbyHotels.${hotelIndex}.location.countryId`, foundCountry.id);
                        const cityFeature = geo.features.find((feature: I_MapTilerFeature) =>
                            feature.place_type?.includes('place') || feature.place_type?.includes('locality'),
                        );

                        if (cityFeature) {
                            const cityName = cityFeature.text;
                            const hotelCities = hotelCitiesCache[foundCountry.id] || [];
                            const foundCity = hotelCities.find(c =>
                                c.name?.toLowerCase() === cityName.toLowerCase(),
                            );

                            if (foundCity) {
                                setValue(`nearbyHotels.${hotelIndex}.location.cityId`, foundCity.id);
                            }
                        }
                    }
                }
            }
        }
        catch (error) {
            console.error('Hotel reverse geocoding failed:', error);
            setValue(`nearbyHotels.${hotelIndex}.location.address`, `${lat.toFixed(6)}, ${lng.toFixed(6)}`);
        }
    }, [setValue, env.VITE_MAPTILER_KEY, countries, hotelCitiesCache]);

    const _scrollToTop = () => {
        if (headerRef.current) {
            headerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
            return;
        }

        const drawerContent = document.querySelector('.max-h-screen.overflow-y-auto');
        if (drawerContent) {
            drawerContent.scrollTo({ top: 0, behavior: 'smooth' });
        }
        else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const hasMapCoordinates = watch('location.map.latitude') && watch('location.map.longitude');
    // eslint-disable-next-line unused-imports/no-unused-vars
    const isAddressFromMap = hasMapCoordinates;

    const _toggleHighlight = (category: keyof Pick<I_DestinationFormData, 'highlightSex' | 'highlightWellness' | 'highlightBar' | 'highlightDance'>) => {
        setEnabledHighlights((prev) => {
            const enabled = !prev[category];
            if (prev[category]) {
                _handleHighlightChange(category, '');
            }
            return {
                ...prev,
                [category]: enabled,
            };
        });
    };

    const _renderStarRating = (category: keyof Pick<I_DestinationFormData, 'atmosphereRating' | 'guestsRating' | 'facilitiesRating' | 'serviceRating' | 'xFactorRating'>) => {
        return (
            <div className="flex items-center space-x-1">
                {[1, 2, 3, 4, 5].map(star => (
                    <Button
                        type="button"
                        variant="ghost"
                        key={star}
                        onClick={(e) => {
                            e.preventDefault();
                            _handleRatingChange(category, star);
                        }}
                        className={cn(
                            'focus:outline-none cursor-pointer',
                            { 'text-yellow-400': star <= (watch(category)?.rate || 0), 'text-gray-300': star > (watch(category)?.rate || 0) },
                        )}
                    >
                        <Star size={24} fill={star <= (watch(category)?.rate || 0) ? 'currentColor' : 'none'} />
                    </Button>
                ))}
            </div>
        );
    };

    const _handleSubmit = (data: I_DestinationFormData) => {
        const { location, nearbyHotels, ...rest } = data;
        const submitData = {
            ...rest,
            location: location?.map?.latitude && location?.map?.longitude
                ? {
                        countryId: location?.countryId || '',
                        cityId: location?.cityId || '',
                        address: location?.address || '',
                        map: {
                            latitude: location.map.latitude,
                            longitude: location.map.longitude,
                        },
                    }
                : {
                        countryId: location?.countryId || '',
                        cityId: location?.cityId || '',
                        address: location?.address || '',
                    },
            nearbyHotels: (nearbyHotels || []).map(hotel => ({
                name: hotel?.name || '',
                location: hotel?.location?.map?.latitude && hotel?.location?.map?.longitude
                    ? {
                            address: hotel.location.address || '',
                            countryId: hotel.location.countryId || '',
                            cityId: hotel.location.cityId || '',
                            map: {
                                latitude: hotel.location.map.latitude,
                                longitude: hotel.location.map.longitude,
                            },
                        }
                    : {
                            address: hotel?.location?.address || '',
                            countryId: hotel?.location?.countryId || '',
                            cityId: hotel?.location?.cityId || '',
                        },
                url: hotel?.url || '',
                description: hotel?.description || '',
                image: hotel?.image || '',
            })),
            logo: data.logo || '',
            images: data.images || [],
            seo: {
                ...data.seo,
                socialImage: socialShareImage || '',
            },
        };

        if (mode === E_FormMode.Update && currentDestination?.id) {
            onUpdateSubmit(currentDestination.id, submitData);
        }
        else {
            onCreateSubmit(submitData);
        }

        setCurrentDestination(undefined);
        ref?.current?.close();
    };

    const _handlePublishStatusChange = (checked: boolean) => {
        const newStatus = checked ? 'published' : 'draft';
        setPublishStatus(newStatus);
        setValue('isActive', checked);
    };

    const cardVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: 30 },
    };

    return (
        <Drawer open={isOpen} onOpenChange={_handleCancel} direction="right">
            <DrawerContent className="max-h-screen overflow-y-auto !max-w-5xl">
                <DrawerHeader className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/50 dark:to-blue-950/50 border-b border-purple-100 dark:border-purple-800" ref={headerRef}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg">
                                <Globe className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <DrawerTitle className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                                    {mode === E_FormMode.Create ? t('create-destination') : t('update-destination')}
                                    {refreshingDestination && (
                                        <span className="ml-2 text-sm text-gray-500">
                                            <Loader2 className="h-4 w-4 animate-spin inline" />
                                        </span>
                                    )}
                                </DrawerTitle>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                    {mode === E_FormMode.Create ? t('create-destination-description') : t('update-destination-description')}
                                </p>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={_handleCancel}
                            className="h-8 w-8 p-0 hover:bg-white/50 dark:hover:bg-gray-800/50 cursor-pointer"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </DrawerHeader>

                <form ref={formRef} onSubmit={handleSubmit(_handleSubmit)} className="w-full space-y-4 p-6">
                    {/* Form Sections - Two columns layout */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* Left Column */}
                        <div className="space-y-4">
                            {/* Basic Information */}
                            <AnimatePresence>
                                <motion.div
                                    variants={cardVariants}
                                    initial="hidden"
                                    animate="visible"
                                    exit="exit"
                                    transition={{ duration: 0.4 }}
                                    className="rounded-2xl border bg-gradient-to-br from-white/80 to-purple-50 dark:from-gray-900/80 dark:to-purple-900/40 shadow-xl p-4 glassmorphism"
                                >
                                    <h3 className="text-base font-semibold mb-4 text-gray-800 dark:text-gray-100 flex items-center gap-2">
                                        <Building className="w-4 h-4 text-purple-500 animate-pulse" />
                                        {t('basic-information')}
                                    </h3>
                                    <div className="space-y-4">
                                        <FloatLabel label={t('destination-type')} error={errors.type?.message}>
                                            <Controller
                                                name="type"
                                                control={control}
                                                rules={{ required: t('error-select-type') }}
                                                render={({ field }) => (
                                                    <Select value={field.value} onValueChange={field.onChange}>
                                                        <SelectTrigger
                                                            aria-invalid={!!errors.type}
                                                            className={`h-12 text-lg ${errors.type ? 'border-red-500 focus:border-red-500 focus:ring-red-500 dark:border-red-400 dark:focus:border-red-400 dark:focus:ring-red-400' : 'border-gray-300 dark:border-gray-600 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-purple-500 dark:focus:ring-purple-400'} bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100`}
                                                        >
                                                            <SelectValue placeholder={t('select-type')} />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value={E_DestinationType.CLUB}>{t('club')}</SelectItem>
                                                            <SelectItem value={E_DestinationType.RESORT}>{t('resort')}</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                )}
                                            />
                                        </FloatLabel>
                                        <FloatLabel label={t('destination-name')} error={errors.name?.message}>
                                            <Input
                                                {...register('name', {
                                                    required: t('enter-destination-name'),
                                                    minLength: { value: 2, message: t('destination-name-min-length') },
                                                    maxLength: { value: 100, message: t('destination-name-max-length') },
                                                })}
                                                placeholder={t('enter-destination-name')}
                                                aria-invalid={!!errors.name}
                                                value={watch('name') ?? ''}
                                                className={`h-12 text-lg ${errors.name ? 'border-red-500 focus:border-red-500 focus:ring-red-500 dark:border-red-400 dark:focus:border-red-400 dark:focus:ring-red-400' : 'border-gray-300 dark:border-gray-600 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-purple-500 dark:focus:ring-purple-400'} bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100`}
                                            />
                                        </FloatLabel>
                                        <FloatLabel label={t('main-age-group')} error={errors.ageGroup?.message}>
                                            <Controller
                                                name="ageGroup"
                                                control={control}
                                                rules={{ required: t('error-age-group') }}
                                                render={({ field }) => (
                                                    <Select value={field.value} onValueChange={field.onChange}>
                                                        <SelectTrigger
                                                            aria-invalid={!!errors.ageGroup}
                                                            className={`h-12 text-lg ${errors.ageGroup ? 'border-red-500 focus:border-red-500 focus:ring-red-500 dark:border-red-400 dark:focus:border-red-400 dark:focus:ring-red-400' : 'border-gray-300 dark:border-gray-600 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-purple-500 dark:focus:ring-purple-400'} bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100`}
                                                        >
                                                            <SelectValue placeholder={t('select-age-group')} />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value={E_DestinationAgeGroup.A18_25}>18-25</SelectItem>
                                                            <SelectItem value={E_DestinationAgeGroup.A26_35}>26-35</SelectItem>
                                                            <SelectItem value={E_DestinationAgeGroup.A36_45}>36-45</SelectItem>
                                                            <SelectItem value={E_DestinationAgeGroup.A45_PLUS}>45+</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                )}
                                            />
                                        </FloatLabel>
                                        <FloatLabel label={t('destination-star-rating')} error={errors.rating?.message}>
                                            <Controller
                                                name="rating"
                                                control={control}
                                                rules={{ required: t('error-select-rating') }}
                                                render={({ field }) => (
                                                    <Select value={field.value} onValueChange={field.onChange}>
                                                        <SelectTrigger
                                                            aria-invalid={!!errors.rating}
                                                            className={`h-12 text-lg ${errors.rating ? 'border-red-500 focus:border-red-500 focus:ring-red-500 dark:border-red-400 dark:focus:border-red-400 dark:focus:ring-red-400' : 'border-gray-300 dark:border-gray-600 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-purple-500 dark:focus:ring-purple-400'} bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100`}
                                                        >
                                                            <SelectValue placeholder={t('select-rating')} />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value={E_DestinationRating.BRONZE}>{t('bronze')}</SelectItem>
                                                            <SelectItem value={E_DestinationRating.SILVER}>{t('silver')}</SelectItem>
                                                            <SelectItem value={E_DestinationRating.GOLD}>{t('gold')}</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                )}
                                            />
                                        </FloatLabel>
                                    </div>
                                </motion.div>
                            </AnimatePresence>

                            {/* Location Information */}
                            <AnimatePresence>
                                <motion.div
                                    variants={cardVariants}
                                    initial="hidden"
                                    animate="visible"
                                    exit="exit"
                                    transition={{ duration: 0.4, delay: 0.1 }}
                                    className="rounded-2xl border bg-gradient-to-br from-white/80 to-blue-50 dark:from-gray-900/80 dark:to-blue-900/40 shadow-xl p-4 glassmorphism"
                                >
                                    <h3 className="text-base font-semibold mb-4 text-gray-800 dark:text-gray-100 flex items-center gap-2">
                                        <MapPin className="w-4 h-4 text-blue-500 animate-pulse" />
                                        {t('location-information')}
                                    </h3>
                                    <div className="space-y-4">
                                        <FloatLabel label={t('country')} error={errors.location?.countryId as string | undefined}>
                                            <Controller
                                                name="location.countryId"
                                                control={control}
                                                rules={{ required: t('error-select-country') }}
                                                render={({ field }) => (
                                                    <AutocompleteSelect
                                                        options={countries
                                                            ?.filter(country => country !== null && country !== undefined)
                                                            ?.map(country => ({
                                                                id: country.id!,
                                                                name: country.name!,
                                                            })) || []}
                                                        value={field.value ?? ''}
                                                        onChange={(value) => {
                                                            field.onChange(value);
                                                            setValue('location.cityId', '');
                                                            setShouldRefetchCities(true);
                                                        }}
                                                        placeholder={t('select-country')}
                                                        className={`h-12 text-lg ${errors.location?.countryId ? 'border-red-500 focus:border-red-500 focus:ring-red-500 dark:border-red-400 dark:focus:border-red-400 dark:focus:ring-red-400' : 'border-gray-300 dark:border-gray-600 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-purple-500 dark:focus:ring-purple-400'} bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100`}
                                                        error={!!errors.location?.countryId}
                                                    />
                                                )}
                                            />
                                        </FloatLabel>

                                        {/* City Dropdown */}
                                        {selectedCountryId && (
                                            <FloatLabel label="City" error={errors.location?.cityId as string | undefined}>
                                                <Controller
                                                    name="location.cityId"
                                                    control={control}
                                                    render={({ field }) => (
                                                        <AutocompleteSelect
                                                            options={cities
                                                                ?.filter(city => city !== null && city !== undefined)
                                                                ?.map(city => ({
                                                                    id: city.id!,
                                                                    name: city.name!,
                                                                })) || []}
                                                            value={field.value ?? ''}
                                                            onChange={(value) => {
                                                                field.onChange(value);
                                                            }}
                                                            placeholder={citiesLoading ? 'Loading city....' : 'Select city '}
                                                            className="h-12 text-lg border-gray-300 dark:border-gray-600 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-purple-500 dark:focus:ring-purple-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                                            disabled={citiesLoading}
                                                            error={!!errors.location?.cityId}
                                                        />
                                                    )}
                                                />
                                            </FloatLabel>
                                        )}

                                        <FloatLabel label={t('address')} error={errors.location?.address as string | undefined}>
                                            <Controller
                                                name="location.address"
                                                control={control}
                                                rules={{ required: t('error-enter-address') }}
                                                render={({ field }) => (
                                                    <div className="relative">
                                                        <Input
                                                            {...field}
                                                            placeholder={hasMapCoordinates ? t('edit-address-keep-coordinates') : t('enter-address')}
                                                            aria-invalid={!!errors.location?.address}
                                                            value={field.value ?? ''}
                                                            // Old logic - commented out for future restoration
                                                            // onClick={!hasMapCoordinates ? () => setShowMapPicker(true) : undefined}
                                                            // onChange={hasMapCoordinates ? field.onChange : undefined}
                                                            // className={`h-12 text-lg ${!hasMapCoordinates ? 'cursor-pointer' : ''} ${errors.location?.address ? 'border-red-500 focus:border-red-500 focus:ring-red-500 dark:border-red-400 dark:focus:border-red-400 dark:focus:ring-red-400' : 'border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400'} bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100`}
                                                            // readOnly={!hasMapCoordinates}

                                                            // New logic - always allow typing
                                                            onChange={field.onChange}
                                                            className={`h-12 text-lg ${errors.location?.address ? 'border-red-500 focus:border-red-500 focus:ring-red-500 dark:border-red-400 dark:focus:border-red-400 dark:focus:ring-red-400' : 'border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400'} bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100`}
                                                        />
                                                        <div className="absolute right-3 top-2.5 flex items-center gap-2">
                                                            <MapPin
                                                                className="text-gray-400 cursor-pointer hover:text-blue-500"
                                                                size={20}
                                                                onClick={() => {
                                                                    setShowMapPicker(true);
                                                                    _scrollToTop();
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            />
                                        </FloatLabel>
                                        {hasMapCoordinates && (
                                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
                                                <MapPin size={12} className="text-green-500" />
                                                <span>
                                                    {t('coordinates')}
                                                    :
                                                    {Number(watch('location.map.latitude')).toFixed(6)}
                                                    ,
                                                    {Number(watch('location.map.longitude')).toFixed(6)}
                                                </span>
                                            </div>
                                        )}

                                        {/* Google Maps Helper */}
                                        <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                                            <div className="flex items-start gap-2">
                                                <div className="text-blue-500 mt-0.5">💡</div>
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-1">
                                                        Quick coordinates from Google Maps
                                                    </p>
                                                    <p className="text-xs text-blue-600 dark:text-blue-400 leading-relaxed">
                                                        1. Open Google Maps → Search address
                                                        <br />
                                                        2. Right-click on location → Copy coordinates
                                                        <br />
                                                        3. Paste below (format: "10.762622, 106.660172")
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="mt-3 flex gap-2">
                                                <Input
                                                    placeholder="Paste Google Maps coordinates (lat, lng)"
                                                    className="text-sm h-9 flex-1"
                                                    id="coordinates-input-main"
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            e.preventDefault();
                                                            const value = e.currentTarget.value.trim();
                                                            let coords: number[] = [];

                                                            if (value.includes(',')) {
                                                                coords = value.split(',').map(c => Number.parseFloat(c.trim()));
                                                            }
                                                            else if (value.includes(' ')) {
                                                                coords = value.split(' ').filter(c => c.trim()).map(c => Number.parseFloat(c.trim()));
                                                            }

                                                            if (coords.length === 2 && !Number.isNaN(coords[0]) && !Number.isNaN(coords[1])) {
                                                                if (coords[0] >= -90 && coords[0] <= 90 && coords[1] >= -180 && coords[1] <= 180) {
                                                                    _handleCoordinatePaste(coords[0], coords[1]);
                                                                    e.currentTarget.value = '';
                                                                }
                                                                else {
                                                                    console.error('Coordinates out of valid range');
                                                                }
                                                            }
                                                            else {
                                                                console.error('Invalid coordinates format');
                                                            }
                                                        }
                                                    }}
                                                />
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="outline"
                                                    className="h-9 px-3 text-xs"
                                                    onClick={() => {
                                                        const input = document.getElementById('coordinates-input-main') as HTMLInputElement;
                                                        if (input) {
                                                            const value = input.value.trim();
                                                            let coords: number[] = [];

                                                            if (value.includes(',')) {
                                                                coords = value.split(',').map(c => Number.parseFloat(c.trim()));
                                                            }
                                                            else if (value.includes(' ')) {
                                                                coords = value.split(' ').filter(c => c.trim()).map(c => Number.parseFloat(c.trim()));
                                                            }

                                                            if (coords.length === 2 && !Number.isNaN(coords[0]) && !Number.isNaN(coords[1])) {
                                                                if (coords[0] >= -90 && coords[0] <= 90 && coords[1] >= -180 && coords[1] <= 180) {
                                                                    _handleCoordinatePaste(coords[0], coords[1]);
                                                                    input.value = '';
                                                                    input.style.borderColor = 'green';
                                                                    setTimeout(() => {
                                                                        input.style.borderColor = '';
                                                                    }, 1000);
                                                                }
                                                            }
                                                        }
                                                    }}
                                                >
                                                    Set
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Selected Location Info */}
                                        {(watch('location.countryId') || watch('location.cityId')) && (
                                            <div className="flex items-center gap-2 flex-wrap">
                                                {watch('location.countryId') && (
                                                    <Badge variant="outline" className="text-blue-600 border-blue-300 dark:text-blue-400 dark:border-blue-600">
                                                        {countries?.find(c => c.id === watch('location.countryId'))?.name || 'Unknown Country'}
                                                    </Badge>
                                                )}
                                                {watch('location.cityId') && (
                                                    <Badge variant="outline" className="text-green-600 border-green-300 dark:text-green-400 dark:border-green-600">
                                                        {cities?.find(c => c.id === watch('location.cityId'))?.name || 'Unknown City'}
                                                    </Badge>
                                                )}
                                            </div>
                                        )}
                                        <FloatLabel label={t('website-url')} error={errors.websiteURL?.message}>
                                            <Controller
                                                name="websiteURL"
                                                control={control}
                                                rules={{ required: t('error-enter-website-url') }}
                                                render={({ field }) => (
                                                    <div className="relative">
                                                        <Input
                                                            {...field}
                                                            type="url"
                                                            placeholder="https://"
                                                            aria-invalid={!!errors.websiteURL}
                                                            value={field.value ?? ''}
                                                            className={`h-12 text-lg ${errors.websiteURL ? 'border-red-500 focus:border-red-500 focus:ring-red-500 dark:border-red-400 dark:focus:border-red-400 dark:focus:ring-red-400' : 'border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400'} bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100`}
                                                        />
                                                    </div>
                                                )}
                                            />
                                        </FloatLabel>
                                    </div>
                                </motion.div>
                            </AnimatePresence>

                            {/* Content & Introduction */}
                            <AnimatePresence>
                                <motion.div
                                    variants={cardVariants}
                                    initial="hidden"
                                    animate="visible"
                                    exit="exit"
                                    transition={{ duration: 0.4, delay: 0.3 }}
                                    className="rounded-2xl border bg-gradient-to-br from-white/80 to-orange-50 dark:from-gray-900/80 dark:to-orange-900/40 shadow-xl p-4 glassmorphism"
                                >
                                    <h3 className="text-base font-semibold mb-4 text-gray-800 dark:text-gray-100 flex items-center gap-2">
                                        <Sparkles className="w-4 h-4 text-orange-500 animate-pulse" />
                                        {t('content-introduction')}
                                    </h3>
                                    <div className="space-y-4">
                                        <FloatLabel label={t('headline')} error={errors.introductionHeadline?.message}>
                                            <Controller
                                                name="introductionHeadline"
                                                control={control}
                                                rules={{ required: t('error-introduction-headline-required') }}
                                                render={({ field }) => (
                                                    <Input
                                                        {...field}
                                                        type="text"
                                                        placeholder={t('headline')}
                                                        aria-invalid={!!errors.introductionHeadline}
                                                        value={field.value ?? ''}
                                                        className={`h-12 text-lg ${errors.introductionHeadline ? 'border-red-500 focus:border-red-500 focus:ring-red-500 dark:border-red-400 dark:focus:border-red-400 dark:focus:ring-red-400' : 'border-gray-300 dark:border-gray-600 focus:border-orange-500 dark:focus:border-orange-400 focus:ring-orange-500 dark:focus:ring-orange-400'} bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100`}
                                                    />
                                                )}
                                            />
                                        </FloatLabel>
                                        <div className="space-y-2">
                                            <label className="block text-sm font-medium text-orange-700 dark:text-orange-300">
                                                {t('introduction-content')}
                                                {' '}
                                                *
                                            </label>
                                            <Editor
                                                value={watch('introductionContent') || ''}
                                                onChange={(value) => {
                                                    setValue('introductionContent', value, { shouldValidate: true });
                                                }}
                                                placeholder={t('write-destination-introduction')}
                                                showToolbar={true}
                                                className="border border-gray-300 dark:border-gray-600 rounded-xl"
                                                contentClassName="min-h-[200px] outline-none p-4 text-gray-900 dark:text-gray-100"
                                            />
                                            <input type="hidden" {...register('introductionContent', { required: t('error-introduction-content-required') })} />
                                            {errors.introductionContent && (
                                                <p className="text-red-500 text-xs mt-1">
                                                    {typeof errors.introductionContent.message === 'string' ? errors.introductionContent.message : t('error-introduction-content-required')}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            </AnimatePresence>

                            {/* SEO Settings */}
                            <AnimatePresence>
                                <motion.div
                                    variants={cardVariants}
                                    initial="hidden"
                                    animate="visible"
                                    exit="exit"
                                    transition={{ duration: 0.4, delay: 0.6 }}
                                    className="rounded-2xl border bg-gradient-to-br from-white/80 to-teal-50 dark:from-gray-900/80 dark:to-teal-900/40 shadow-xl p-4 glassmorphism"
                                >
                                    <h3 className="text-base font-semibold mb-4 text-gray-800 dark:text-gray-100 flex items-center gap-2">
                                        <Search className="w-4 h-4 text-teal-500 animate-pulse" />
                                        {t('seo-settings')}
                                    </h3>
                                    <div className="space-y-4">
                                        <FloatLabel label={t('seo-title')} error={errors.seo?.title as string | undefined}>
                                            <Controller
                                                name="seo.title"
                                                control={control}
                                                render={({ field }) => (
                                                    <Input
                                                        {...field}
                                                        type="text"
                                                        placeholder={t('enter-seo-title')}
                                                        aria-invalid={!!errors.seo?.title}
                                                        value={field.value ?? ''}
                                                        className={`h-12 text-lg ${errors.seo?.title ? 'border-red-500 focus:border-red-500 focus:ring-red-500 dark:border-red-400 dark:focus:border-red-400 dark:focus:ring-red-400' : 'border-gray-300 dark:border-gray-600 focus:border-teal-500 dark:focus:border-teal-400 focus:ring-teal-500 dark:focus:ring-teal-400'} bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100`}
                                                    />
                                                )}
                                            />
                                        </FloatLabel>

                                        {/* SEO Social Image Upload */}
                                        <div className="mb-4">
                                            <Label className="mb-2 text-sm text-gray-700 dark:text-gray-200">
                                                {t('social-share-image')}
                                            </Label>
                                            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4">
                                                {socialShareImage
                                                    ? (
                                                            <div className="relative">
                                                                <img
                                                                    src={socialShareImage}
                                                                    alt="SEO social image preview"
                                                                    className="max-w-xs mx-auto rounded"
                                                                />
                                                                <Button
                                                                    type="button"
                                                                    size={null}
                                                                    variant="ghost"
                                                                    onClick={() => {
                                                                        setSocialShareImage(null);
                                                                        setValue('seo.socialImage', '');
                                                                    }}
                                                                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 cursor-pointer"
                                                                >
                                                                    <X size={16} />
                                                                </Button>
                                                            </div>
                                                        )
                                                    : (
                                                            <div {...seoImageDropzone.getRootProps()} className="cursor-pointer text-center">
                                                                <input {...seoImageDropzone.getInputProps()} />
                                                                <Camera className="mx-auto text-gray-400 mb-2" size={32} />
                                                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                                                    {t('upload-social-share-image')}
                                                                </p>
                                                            </div>
                                                        )}
                                            </div>
                                            {uploadLoading && (
                                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                    {t('uploading')}
                                                    ...
                                                </div>
                                            )}
                                        </div>
                                        <FloatLabel label={t('seo-description')} error={errors.seo?.description as string | undefined}>
                                            <Controller
                                                name="seo.description"
                                                control={control}
                                                render={({ field }) => (
                                                    <textarea
                                                        {...field}
                                                        placeholder={t('enter-seo-description')}
                                                        rows={3}
                                                        aria-invalid={!!errors.seo?.description}
                                                        value={field.value ?? ''}
                                                        className={`w-full px-4 py-2 border rounded-lg font-sans text-base ${errors.seo?.description ? 'border-red-500 focus:border-red-500 focus:ring-red-500 dark:border-red-400 dark:focus:border-red-400 dark:focus:ring-red-400' : 'border-gray-300 dark:border-gray-600 focus:border-teal-500 dark:focus:border-teal-400 focus:ring-teal-500 dark:focus:ring-teal-400'} bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100`}
                                                    />
                                                )}
                                            />
                                        </FloatLabel>

                                        <FloatLabel label={t('seo-keywords')} error={errors.seo?.keywords as string | undefined}>
                                            <Controller
                                                name="seo.keywords"
                                                control={control}
                                                render={({ field }) => (
                                                    <Input
                                                        {...field}
                                                        type="text"
                                                        placeholder={t('enter-keywords')}
                                                        aria-invalid={!!errors.seo?.keywords}
                                                        value={Array.isArray(field.value) ? field.value.filter(Boolean).join(', ') : ''}
                                                        onChange={e => field.onChange(e.target.value.split(',').map(k => k.trim()).filter(Boolean))}
                                                        className={`h-12 text-lg ${errors.seo?.keywords ? 'border-red-500 focus:border-red-500 focus:ring-red-500 dark:border-red-400 dark:focus:border-red-400 dark:focus:ring-red-400' : 'border-gray-300 dark:border-gray-600 focus:border-teal-500 dark:focus:border-teal-400 focus:ring-teal-500 dark:focus:ring-teal-400'} bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100`}
                                                    />
                                                )}
                                            />
                                        </FloatLabel>
                                    </div>
                                </motion.div>
                            </AnimatePresence>
                        </div>

                        {/* Right Column */}
                        <div className="space-y-4">
                            {/* Media & Images */}
                            <AnimatePresence>
                                <motion.div
                                    variants={cardVariants}
                                    initial="hidden"
                                    animate="visible"
                                    exit="exit"
                                    transition={{ duration: 0.4, delay: 0.2 }}
                                    className="rounded-2xl border bg-gradient-to-br from-white/80 to-green-50 dark:from-gray-900/80 dark:to-green-900/40 shadow-xl p-4 glassmorphism"
                                >
                                    <h3 className="text-base font-semibold mb-4 text-gray-800 dark:text-gray-100 flex items-center gap-2">
                                        <Camera className="w-4 h-4 text-green-500 animate-pulse" />
                                        {t('media-images')}
                                    </h3>

                                    {/* Destination Logo */}
                                    <div className="mb-4">
                                        <Label className="mb-2 text-sm text-gray-700 dark:text-gray-200">{t('destination-logo')}</Label>
                                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                                            {watch('logo')
                                                ? (
                                                        <div className="relative">
                                                            <img
                                                                src={watch('logo')}
                                                                alt={t('destination-logo-alt')}
                                                                className="max-w-xs mx-auto rounded"
                                                            />
                                                            <Button
                                                                type="button"
                                                                size={null}
                                                                variant="ghost"
                                                                onClick={() => {
                                                                    setValue('logo', '');
                                                                }}
                                                                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 cursor-pointer"
                                                            >
                                                                <X size={16} />
                                                            </Button>
                                                        </div>
                                                    )
                                                : (
                                                        <div {...logoDropzone.getRootProps()} className="cursor-pointer text-center">
                                                            <input {...logoDropzone.getInputProps()} />
                                                            <Camera className="mx-auto text-gray-400 mb-2" size={32} />
                                                            <p className="text-sm text-gray-500">{t('drag-drop-logo')}</p>
                                                        </div>
                                                    )}
                                        </div>
                                    </div>

                                    {/* Destination Images */}
                                    <div>
                                        <Label className="mb-2 text-sm text-gray-700 dark:text-gray-200">
                                            {t('destination-images')}
                                            <span className="text-red-500 ml-1">*</span>
                                        </Label>
                                        {errors.images && (
                                            <p className="text-red-500 text-sm mt-1">{errors.images.message}</p>
                                        )}
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                            {(watch('images') || []).slice(0, 10).map(url => (
                                                <div key={url} className="relative">
                                                    <img
                                                        src={url}
                                                        alt={t('destination-image-alt', { name: url })}
                                                        className="w-full h-32 object-cover rounded-lg"
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size={null}
                                                        onClick={() => {
                                                            const prev = watch('images') || [];
                                                            const newImages = prev.filter(img => img !== url);
                                                            setValue('images', newImages);
                                                        }}
                                                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 cursor-pointer"
                                                    >
                                                        <X size={8} />
                                                    </Button>
                                                </div>
                                            ))}
                                            {(watch('images') || []).length < 10 && (
                                                <div {...imagesDropzone.getRootProps()} className="border-2 border-dashed border-gray-300 rounded-lg p-4 flex items-center justify-center cursor-pointer hover:border-green-500">
                                                    <input {...imagesDropzone.getInputProps()} />
                                                    <div className="text-center">
                                                        <Upload className="mx-auto text-gray-400 mb-2" size={24} />
                                                        <p className="text-sm text-gray-500">{t('upload-image')}</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            </AnimatePresence>

                            {/* Dress Code & Additional Info */}
                            <AnimatePresence>
                                <motion.div
                                    variants={cardVariants}
                                    initial="hidden"
                                    animate="visible"
                                    exit="exit"
                                    transition={{ duration: 0.4, delay: 0.35 }}
                                    className="rounded-2xl border bg-gradient-to-br from-white/80 to-red-50 dark:from-gray-900/80 dark:to-red-900/40 shadow-xl p-4 glassmorphism"
                                >
                                    <h3 className="text-base font-semibold mb-4 text-gray-800 dark:text-gray-100 flex items-center gap-2">
                                        <Palette className="w-4 h-4 text-red-500 animate-pulse" />
                                        {t('dress-code-additional')}
                                    </h3>
                                    <div className="space-y-4">
                                        {/* Wear Image Upload */}
                                        <div className="mb-4">
                                            <Label className="mb-2 text-sm text-gray-700 dark:text-gray-200">
                                                {t('what-to-wear')}
                                            </Label>
                                            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4">
                                                {watch('wearImage')
                                                    ? (
                                                            <div className="relative">
                                                                <img
                                                                    src={watch('wearImage')}
                                                                    alt="Wear image preview"
                                                                    className="max-w-xs mx-auto rounded"
                                                                />
                                                                <Button
                                                                    type="button"
                                                                    size={null}
                                                                    variant="ghost"
                                                                    onClick={() => setValue('wearImage', '')}
                                                                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 cursor-pointer"
                                                                >
                                                                    <X size={16} />
                                                                </Button>
                                                            </div>
                                                        )
                                                    : (
                                                            <div {...wearImageDropzone.getRootProps()} className="cursor-pointer text-center">
                                                                <input {...wearImageDropzone.getInputProps()} />
                                                                <Camera className="mx-auto text-gray-400 mb-2" size={32} />
                                                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                                                    {t('upload-dress-code-image')}
                                                                </p>
                                                            </div>
                                                        )}
                                            </div>
                                            {uploadLoading && (
                                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                    {t('uploading')}
                                                    ...
                                                </div>
                                            )}
                                        </div>
                                        <FloatLabel label={t('womens-dress-code')} error={errors.womenDressCode as string | undefined}>
                                            <Controller
                                                name="womenDressCode"
                                                control={control}
                                                render={({ field }) => (
                                                    <textarea
                                                        {...field}
                                                        placeholder={t('enter-dress-code-description')}
                                                        rows={3}
                                                        aria-invalid={!!errors.womenDressCode}
                                                        value={field.value ?? ''}
                                                        className={`w-full px-4 py-2 border rounded-lg font-sans text-base ${errors.womenDressCode ? 'border-red-500 focus:border-red-500 focus:ring-red-500 dark:border-red-400 dark:focus:border-red-400 dark:focus:ring-red-400' : 'border-gray-300 dark:border-gray-600 focus:border-red-500 dark:focus:border-red-400 focus:ring-red-500 dark:focus:ring-red-400'} bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100`}
                                                    />
                                                )}
                                            />
                                        </FloatLabel>
                                        <FloatLabel label={t('mens-dress-code')} error={errors.menDressCode as string | undefined}>
                                            <Controller
                                                name="menDressCode"
                                                control={control}
                                                render={({ field }) => (
                                                    <textarea
                                                        {...field}
                                                        placeholder={t('enter-dress-code-description')}
                                                        rows={3}
                                                        aria-invalid={!!errors.menDressCode}
                                                        value={field.value ?? ''}
                                                        className={`w-full px-4 py-2 border rounded-lg font-sans text-base ${errors.menDressCode ? 'border-red-500 focus:border-red-500 focus:ring-red-500 dark:border-red-400 dark:focus:border-red-400 dark:focus:ring-red-400' : 'border-gray-300 dark:border-gray-600 focus:border-red-500 dark:focus:border-red-400 focus:ring-red-500 dark:focus:ring-red-400'} bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100`}
                                                    />
                                                )}
                                            />
                                        </FloatLabel>
                                        <div className="flex items-center gap-2">
                                            <Switch
                                                id="useDefaultText"
                                                checked={watch('useDefaultText')}
                                                onCheckedChange={checked => setValue('useDefaultText', checked)}
                                            />
                                            <Label htmlFor="useDefaultText" className="text-sm text-gray-700 dark:text-gray-200">
                                                {t('use-default-text')}
                                            </Label>
                                        </div>
                                        {watch('useDefaultText') && (
                                            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                                    {t('default-dress-code-text')}
                                                </p>
                                            </div>
                                        )}
                                        <FloatLabel label={t('link-to')} error={errors.linkTo as string | undefined}>
                                            <Controller
                                                name="linkTo"
                                                control={control}
                                                render={({ field }) => (
                                                    <Input
                                                        {...field}
                                                        type="url"
                                                        placeholder={t('enter-link-to')}
                                                        aria-invalid={!!errors.linkTo}
                                                        value={field.value ?? ''}
                                                        className={`h-12 text-lg ${errors.linkTo ? 'border-red-500 focus:border-red-500 focus:ring-red-500 dark:border-red-400 dark:focus:border-red-400 dark:focus:ring-red-400' : 'border-gray-300 dark:border-gray-600 focus:border-red-500 dark:focus:border-red-400 focus:ring-red-500 dark:focus:ring-red-400'} bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100`}
                                                    />
                                                )}
                                            />
                                        </FloatLabel>
                                    </div>
                                </motion.div>
                            </AnimatePresence>

                            {/* Ratings */}
                            <AnimatePresence>
                                <motion.div
                                    variants={cardVariants}
                                    initial="hidden"
                                    animate="visible"
                                    exit="exit"
                                    transition={{ duration: 0.4, delay: 0.4 }}
                                    className="rounded-2xl border bg-gradient-to-br from-white/80 to-yellow-50 dark:from-gray-900/80 dark:to-yellow-900/40 shadow-xl p-4 glassmorphism"
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-base font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                                            <Star className="w-4 h-4 text-yellow-500 animate-pulse" />
                                            {t('destination-ratings')}
                                        </h3>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                setShowRatings(!showRatings);
                                            }}
                                            className="text-yellow-600 hover:text-yellow-700 cursor-pointer"
                                        >
                                            {t(showRatings ? 'hide-ratings' : 'add-ratings')}
                                        </Button>
                                    </div>

                                    {showRatings && (
                                        <div className="space-y-6">
                                            {([
                                                { key: 'atmosphereRating', icon: Palette, label: 'atmosphere-rating' },
                                                { key: 'guestsRating', icon: Users, label: 'guests-rating' },
                                                { key: 'facilitiesRating', icon: Building, label: 'facilities-rating' },
                                                { key: 'serviceRating', icon: Heart, label: 'service-rating' },
                                                { key: 'xFactorRating', icon: Zap, label: 'x-factor-rating' },
                                            ] as const).map(({ key, icon: Icon, label }) => (
                                                <div key={key} className="bg-white/50 dark:bg-gray-800/50 p-4 rounded-lg">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Icon className="w-4 h-4 text-yellow-500" />
                                                        <Label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                                                            {t(label)}
                                                        </Label>
                                                    </div>
                                                    {_renderStarRating(key)}
                                                    <div className="mt-3">
                                                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                                                            {t(`describe-${label}`)}
                                                        </label>
                                                        <Editor
                                                            value={(watch(key)?.reason) || ''}
                                                            onChange={(value) => {
                                                                setValue(key, { ...watch(key), reason: value }, { shouldValidate: true });
                                                            }}
                                                            placeholder={t(`describe-${label}`)}
                                                            showToolbar={true}
                                                            className="border border-gray-300 dark:border-gray-600 rounded-lg"
                                                            contentClassName="min-h-[120px] outline-none p-3 text-gray-900 dark:text-gray-100 text-sm"
                                                        />
                                                        <input type="hidden" {...register(`${key}.reason` as FieldPath<I_DestinationFormData>)} />
                                                        {errors[key]?.reason && (
                                                            <p className="text-red-500 text-xs mt-1">
                                                                {errors[key]?.reason as string}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </motion.div>
                            </AnimatePresence>

                            {/* Highlights */}
                            <AnimatePresence>
                                <motion.div
                                    variants={cardVariants}
                                    initial="hidden"
                                    animate="visible"
                                    exit="exit"
                                    transition={{ duration: 0.4, delay: 0.5 }}
                                    className="rounded-2xl border bg-gradient-to-br from-white/80 to-pink-50 dark:from-gray-900/80 dark:to-pink-900/40 shadow-xl p-4 glassmorphism"
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-base font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                                            <Zap className="w-4 h-4 text-pink-500 animate-pulse" />
                                            {t('destination-highlights')}
                                        </h3>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                setShowHighlights(!showHighlights);
                                            }}
                                            className="text-pink-600 hover:text-pink-700 cursor-pointer"
                                        >
                                            {t(showHighlights ? 'hide-highlights' : 'add-highlights')}
                                        </Button>
                                    </div>

                                    {showHighlights && (
                                        <div className="space-y-4">
                                            {([
                                                { key: 'highlightSex', icon: Heart, label: 'sex' },
                                                { key: 'highlightWellness', icon: Coffee, label: 'wellness' },
                                                { key: 'highlightBar', icon: Music, label: 'bar' },
                                                { key: 'highlightDance', icon: Zap, label: 'dance' },
                                            ] as const).map(({ key, icon: Icon, label }) => (
                                                <div key={key} className="bg-white/50 dark:bg-gray-800/50 p-4 rounded-lg">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <div className="flex items-center gap-2">
                                                            <Icon className="w-4 h-4 text-pink-500" />
                                                            <Label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                                                                {t(label)}
                                                            </Label>
                                                        </div>
                                                        <Switch
                                                            checked={enabledHighlights[key]}
                                                            onCheckedChange={() => _toggleHighlight(key)}
                                                        />
                                                    </div>
                                                    {enabledHighlights[key] && (
                                                        <div className="mt-3">
                                                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                                                                {t(`describe-${label}-highlights`)}
                                                            </label>
                                                            <Editor
                                                                value={watch(key) || ''}
                                                                onChange={(value) => {
                                                                    setValue(key, value, { shouldValidate: true });
                                                                }}
                                                                placeholder={t(`describe-${label}-highlights`)}
                                                                showToolbar={true}
                                                                className="border border-gray-300 dark:border-gray-600 rounded-lg"
                                                                contentClassName="min-h-[120px] outline-none p-3 text-gray-900 dark:text-gray-100 text-sm"
                                                            />
                                                            <input type="hidden" {...register(key)} />
                                                            {errors[key] && (
                                                                <p className="text-red-500 text-xs mt-1">
                                                                    {errors[key] as string}
                                                                </p>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </motion.div>
                            </AnimatePresence>

                            {/* Nearby Hotels */}
                            <AnimatePresence>
                                <motion.div
                                    variants={cardVariants}
                                    initial="hidden"
                                    animate="visible"
                                    exit="exit"
                                    transition={{ duration: 0.4, delay: 0.55 }}
                                    className="rounded-2xl border bg-gradient-to-br from-white/80 to-amber-50 dark:from-gray-900/80 dark:to-amber-900/40 shadow-xl p-4 glassmorphism"
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-base font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                                            <Building className="w-4 h-4 text-amber-500 animate-pulse" />
                                            {t('nearby-hotels')}
                                        </h3>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                const currentHotels = watch('nearbyHotels') || [];
                                                const newHotel: T_Hotel = {
                                                    name: '',
                                                    location: {
                                                        address: '',
                                                        countryId: '',
                                                        map: { latitude: undefined, longitude: undefined },
                                                    },
                                                    url: '',
                                                    description: '',
                                                    image: '',
                                                };
                                                setValue('nearbyHotels', [...currentHotels, newHotel]);
                                            }}
                                            className="text-amber-600 hover:text-amber-700 cursor-pointer"
                                        >
                                            {t('add-hotel')}
                                        </Button>
                                    </div>

                                    <div className="space-y-4">
                                        {(watch('nearbyHotels') || []).map((hotel, index) => (
                                            <motion.div
                                                // eslint-disable-next-line react/no-array-index-key
                                                key={index}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -20 }}
                                                transition={{ duration: 0.3 }}
                                                className="bg-white/50 dark:bg-gray-800/50 p-4 rounded-lg border border-amber-200 dark:border-amber-700"
                                            >
                                                <div className="flex items-center justify-between mb-3">
                                                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-200">
                                                        {t('hotel')}
                                                        {' '}
                                                        #
                                                        {index + 1}
                                                    </h4>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            const currentHotels = watch('nearbyHotels') || [];
                                                            const newHotels = currentHotels.filter((_, i) => i !== index);
                                                            setValue('nearbyHotels', newHotels);
                                                        }}
                                                        className="text-red-500 hover:text-red-700 p-1"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </Button>
                                                </div>

                                                <div className="space-y-3">
                                                    <FloatLabel label={t('hotel-name')} error={errors.nearbyHotels?.[index]?.name as string | undefined}>
                                                        <Controller
                                                            name={`nearbyHotels.${index}.name`}
                                                            control={control}
                                                            rules={{ required: t('error-hotel-name-required') }}
                                                            render={({ field }) => (
                                                                <Input
                                                                    {...field}
                                                                    placeholder={t('enter-hotel-name')}
                                                                    aria-invalid={!!errors.nearbyHotels?.[index]?.name}
                                                                    value={field.value ?? ''}
                                                                    className={`h-10 text-sm ${errors.nearbyHotels?.[index]?.name ? 'border-red-500 focus:border-red-500 focus:ring-red-500 dark:border-red-400 dark:focus:border-red-400 dark:focus:ring-red-400' : 'border-gray-300 dark:border-gray-600 focus:border-amber-500 dark:focus:border-amber-400 focus:ring-amber-500 dark:focus:ring-amber-400'} bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100`}
                                                                />
                                                            )}
                                                        />
                                                    </FloatLabel>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                        <FloatLabel label={t('country')} error={errors.nearbyHotels?.[index]?.location?.countryId as string | undefined}>
                                                            <Controller
                                                                name={`nearbyHotels.${index}.location.countryId`}
                                                                control={control}
                                                                rules={{ required: t('error-select-country') }}
                                                                render={({ field }) => (
                                                                    <AutocompleteSelect
                                                                        options={countries
                                                                            ?.filter(country => country !== null && country !== undefined)
                                                                            ?.map(country => ({
                                                                                id: country.id!,
                                                                                name: country.name!,
                                                                            })) || []}
                                                                        value={field.value ?? ''}
                                                                        onChange={(value) => {
                                                                            field.onChange(value);
                                                                            setValue(`nearbyHotels.${index}.location.cityId`, '');
                                                                        }}
                                                                        placeholder={t('select-country')}
                                                                        className={`h-10 text-sm ${errors.nearbyHotels?.[index]?.location?.countryId ? 'border-red-500 focus:border-red-500 focus:ring-red-500 dark:border-red-400 dark:focus:border-red-400 dark:focus:ring-red-400' : 'border-gray-300 dark:border-gray-600 focus:border-amber-500 dark:focus:border-amber-400 focus:ring-amber-500 dark:focus:ring-amber-400'} bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100`}
                                                                        error={!!errors.nearbyHotels?.[index]?.location?.countryId}
                                                                    />
                                                                )}
                                                            />
                                                        </FloatLabel>

                                                        {watch(`nearbyHotels.${index}.location.countryId`) && (
                                                            <FloatLabel label="City" error={errors.nearbyHotels?.[index]?.location?.cityId as string | undefined}>
                                                                <Controller
                                                                    name={`nearbyHotels.${index}.location.cityId`}
                                                                    control={control}
                                                                    render={({ field }) => {
                                                                        const hotelCountryId = watch(`nearbyHotels.${index}.location.countryId`);
                                                                        const hotelCities = hotelCitiesCache[hotelCountryId] || [];
                                                                        return (
                                                                            <AutocompleteSelect
                                                                                options={hotelCities
                                                                                    ?.filter(city => city !== null && city !== undefined)
                                                                                    ?.map(city => ({
                                                                                        id: city.id!,
                                                                                        name: city.name!,
                                                                                    })) || []}
                                                                                value={field.value ?? ''}
                                                                                onChange={value => field.onChange(value)}
                                                                                placeholder={citiesLoading ? 'Loading city....' : 'Select city '}
                                                                                className={`h-10 text-sm ${errors.nearbyHotels?.[index]?.location?.cityId ? 'border-red-500 focus:border-red-500 focus:ring-red-500 dark:border-red-400 dark:focus:border-red-400 dark:focus:ring-red-400' : 'border-gray-300 dark:border-gray-600 focus:border-amber-500 dark:focus:border-amber-400 focus:ring-amber-500 dark:focus:ring-amber-400'} bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100`}
                                                                                error={!!errors.nearbyHotels?.[index]?.location?.cityId}
                                                                                loading={false}
                                                                            />
                                                                        );
                                                                    }}
                                                                />
                                                            </FloatLabel>
                                                        )}
                                                    </div>

                                                    <FloatLabel label={t('address')} error={errors.nearbyHotels?.[index]?.location?.address as string | undefined}>
                                                        <Controller
                                                            name={`nearbyHotels.${index}.location.address`}
                                                            control={control}
                                                            rules={{ required: t('error-enter-address') }}
                                                            render={({ field }) => {
                                                                const hotelHasMapCoordinates = watch(`nearbyHotels.${index}.location.map.latitude`) && watch(`nearbyHotels.${index}.location.map.longitude`);
                                                                return (
                                                                    <div className="relative">
                                                                        <Input
                                                                            {...field}
                                                                            placeholder={hotelHasMapCoordinates ? t('edit-address-keep-coordinates') : t('enter-address')}
                                                                            aria-invalid={!!errors.nearbyHotels?.[index]?.location?.address}
                                                                            value={field.value ?? ''}
                                                                            // Old logic - commented out for future restoration
                                                                            // onClick={!hotelHasMapCoordinates ? () => setShowHotelMapPicker(index) : undefined}
                                                                            // onChange={hotelHasMapCoordinates ? field.onChange : undefined}
                                                                            // className={`h-10 text-sm ${!hotelHasMapCoordinates ? 'cursor-pointer' : ''} ${errors.nearbyHotels?.[index]?.location?.address ? 'border-red-500 focus:border-red-500 focus:ring-red-500 dark:border-red-400 dark:focus:border-red-400 dark:focus:ring-red-400' : 'border-gray-300 dark:border-gray-600 focus:border-amber-500 dark:focus:border-amber-400 focus:ring-amber-500 dark:focus:ring-amber-400'} bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100`}
                                                                            // readOnly={!hotelHasMapCoordinates}

                                                                            // New logic - always allow typing
                                                                            onChange={field.onChange}
                                                                            className={`h-10 text-sm ${errors.nearbyHotels?.[index]?.location?.address ? 'border-red-500 focus:border-red-500 focus:ring-red-500 dark:border-red-400 dark:focus:border-red-400 dark:focus:ring-red-400' : 'border-gray-300 dark:border-gray-600 focus:border-amber-500 dark:focus:border-amber-400 focus:ring-amber-500 dark:focus:ring-amber-400'} bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100`}
                                                                        />
                                                                        <div className="absolute right-3 top-2.5 flex items-center gap-2">
                                                                            {hotelHasMapCoordinates && (
                                                                                <div className="flex items-center text-green-500" title={t('coordinates-from-map')}>
                                                                                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                                                                </div>
                                                                            )}
                                                                            <MapPin
                                                                                className="text-gray-400 cursor-pointer hover:text-amber-500"
                                                                                size={16}
                                                                                onClick={() => {
                                                                                    setShowHotelMapPicker(index);
                                                                                    _scrollToTop();
                                                                                }}
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                );
                                                            }}
                                                        />
                                                    </FloatLabel>
                                                </div>

                                                {/* Google Maps Helper for Hotel */}
                                                <div className="mt-2 p-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                                                    <div className="flex items-start gap-2">
                                                        <div className="text-amber-500 mt-0.5 text-xs">💡</div>
                                                        <div className="flex-1">
                                                            <p className="text-xs font-medium text-amber-700 dark:text-amber-300">
                                                                Quick coordinates
                                                            </p>
                                                            <div className="flex gap-1 mt-1">
                                                                <Input
                                                                    placeholder="Paste Google Maps coordinates"
                                                                    className="text-xs h-8 flex-1"
                                                                    id={`coordinates-input-hotel-${index}`}
                                                                    onKeyDown={(e) => {
                                                                        if (e.key === 'Enter') {
                                                                            e.preventDefault();
                                                                            const value = e.currentTarget.value.trim();
                                                                            let coords: number[] = [];

                                                                            if (value.includes(',')) {
                                                                                coords = value.split(',').map(c => Number.parseFloat(c.trim()));
                                                                            }
                                                                            else if (value.includes(' ')) {
                                                                                coords = value.split(' ').filter(c => c.trim()).map(c => Number.parseFloat(c.trim()));
                                                                            }

                                                                            if (coords.length === 2 && !Number.isNaN(coords[0]) && !Number.isNaN(coords[1])) {
                                                                                if (coords[0] >= -90 && coords[0] <= 90 && coords[1] >= -180 && coords[1] <= 180) {
                                                                                    _handleHotelCoordinatePaste(index, coords[0], coords[1]);
                                                                                    e.currentTarget.value = '';
                                                                                }
                                                                                else {
                                                                                    console.error('Hotel coordinates out of valid range');
                                                                                }
                                                                            }
                                                                            else {
                                                                                console.error('Invalid hotel coordinates format');
                                                                            }
                                                                        }
                                                                    }}
                                                                />
                                                                <Button
                                                                    type="button"
                                                                    size="sm"
                                                                    variant="outline"
                                                                    className="h-8 px-2 text-xs"
                                                                    onClick={() => {
                                                                        const input = document.getElementById(`coordinates-input-hotel-${index}`) as HTMLInputElement;
                                                                        if (input) {
                                                                            const value = input.value.trim();
                                                                            let coords: number[] = [];

                                                                            if (value.includes(',')) {
                                                                                coords = value.split(',').map(c => Number.parseFloat(c.trim()));
                                                                            }
                                                                            else if (value.includes(' ')) {
                                                                                coords = value.split(' ').filter(c => c.trim()).map(c => Number.parseFloat(c.trim()));
                                                                            }

                                                                            if (coords.length === 2 && !Number.isNaN(coords[0]) && !Number.isNaN(coords[1])) {
                                                                                if (coords[0] >= -90 && coords[0] <= 90 && coords[1] >= -180 && coords[1] <= 180) {
                                                                                    _handleHotelCoordinatePaste(index, coords[0], coords[1]);
                                                                                    input.value = '';
                                                                                    input.style.borderColor = 'green';
                                                                                    setTimeout(() => {
                                                                                        input.style.borderColor = '';
                                                                                    }, 1000);
                                                                                }
                                                                            }
                                                                        }
                                                                    }}
                                                                >
                                                                    Set
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Selected Hotel Location Info */}
                                                {/* {(watch(`nearbyHotels.${index}.location.countryId`) || watch(`nearbyHotels.${index}.location.cityId`)) && (
                                                        <div className="flex items-center gap-2 flex-wrap mt-2">
                                                            {watch(`nearbyHotels.${index}.location.countryId`) && (
                                                                <Badge variant="outline" className="text-blue-600 border-blue-300 dark:text-blue-400 dark:border-blue-600">
                                                                    {countries?.find(c => c.id === watch(`nearbyHotels.${index}.location.countryId`))?.name || 'Unknown Country'}
                                                                </Badge>
                                                            )}
                                                            {watch(`nearbyHotels.${index}.location.cityId`) && (
                                                                <Badge variant="outline" className="text-green-600 border-green-300 dark:text-green-400 dark:border-green-600">
                                                                    {(hotelCitiesCache[watch(`nearbyHotels.${index}.location.countryId`)] || [])?.find((c) => c.id === watch(`nearbyHotels.${index}.location.cityId`))?.name || 'Unknown City'}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    )} */}

                                                <FloatLabel label={t('website-url')} error={errors.nearbyHotels?.[index]?.url as string | undefined}>
                                                    <Controller
                                                        name={`nearbyHotels.${index}.url`}
                                                        control={control}
                                                        rules={{ required: t('error-enter-website-url') }}
                                                        render={({ field }) => (
                                                            <div className="relative">
                                                                <Input
                                                                    {...field}
                                                                    type="url"
                                                                    placeholder="https://"
                                                                    aria-invalid={!!errors.nearbyHotels?.[index]?.url}
                                                                    value={field.value ?? ''}
                                                                    className={`h-10 text-sm ${errors.nearbyHotels?.[index]?.url ? 'border-red-500 focus:border-red-500 focus:ring-red-500 dark:border-red-400 dark:focus:border-red-400 dark:focus:ring-red-400' : 'border-gray-300 dark:border-gray-600 focus:border-amber-500 dark:focus:border-amber-400 focus:ring-amber-500 dark:focus:ring-amber-400'} bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100`}
                                                                />
                                                                <LinkIcon className="absolute right-3 top-2.5 text-gray-400" size={16} />
                                                            </div>
                                                        )}
                                                    />
                                                </FloatLabel>

                                                <FloatLabel label={t('hotel-description')} error={errors.nearbyHotels?.[index]?.description as string | undefined}>
                                                    <Controller
                                                        name={`nearbyHotels.${index}.description`}
                                                        control={control}
                                                        render={({ field }) => (
                                                            <textarea
                                                                {...field}
                                                                placeholder={t('enter-hotel-description')}
                                                                rows={3}
                                                                aria-invalid={!!errors.nearbyHotels?.[index]?.description}
                                                                value={field.value ?? ''}
                                                                className={`w-full px-3 py-2 border rounded-lg font-sans text-sm ${errors.nearbyHotels?.[index]?.description ? 'border-red-500 focus:border-red-500 focus:ring-red-500 dark:border-red-400 dark:focus:border-red-400 dark:focus:ring-red-400' : 'border-gray-300 dark:border-gray-600 focus:border-amber-500 dark:focus:border-amber-400 focus:ring-amber-500 dark:focus:ring-amber-400'} bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100`}
                                                            />
                                                        )}
                                                    />
                                                </FloatLabel>

                                                <div>
                                                    <Label className="mb-2 text-sm text-gray-700 dark:text-gray-200">
                                                        {t('hotel-image')}
                                                    </Label>
                                                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-3">
                                                        {watch(`nearbyHotels.${index}.image`)
                                                            ? (
                                                                    <div className="relative">
                                                                        <img
                                                                            src={watch(`nearbyHotels.${index}.image`)}
                                                                            alt={t('hotel-image-alt')}
                                                                            className="max-w-full mx-auto rounded max-h-32"
                                                                        />
                                                                        <Button
                                                                            type="button"
                                                                            size={null}
                                                                            variant="ghost"
                                                                            onClick={() => {
                                                                                setValue(`nearbyHotels.${index}.image`, '');
                                                                            }}
                                                                            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 cursor-pointer"
                                                                        >
                                                                            <X size={12} />
                                                                        </Button>
                                                                    </div>
                                                                )
                                                            : (
                                                                    <div
                                                                        onClick={async () => {
                                                                            const input = document.createElement('input');
                                                                            input.type = 'file';
                                                                            input.accept = 'image/*';
                                                                            input.onchange = async (e) => {
                                                                                const file = (e.target as HTMLInputElement).files?.[0];
                                                                                if (file) {
                                                                                    const url = await _handleFileUpload(file);
                                                                                    if (url) {
                                                                                        setValue(`nearbyHotels.${index}.image`, url);
                                                                                    }
                                                                                }
                                                                            };
                                                                            input.click();
                                                                        }}
                                                                        className="cursor-pointer text-center"
                                                                    >
                                                                        <Camera className="mx-auto text-gray-400 mb-2" size={24} />
                                                                        <p className="text-sm text-gray-500">{t('upload-hotel-image')}</p>
                                                                    </div>
                                                                )}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}

                                        {(watch('nearbyHotels') || []).length === 0 && (
                                            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                                <Building className="mx-auto mb-2 text-gray-400" size={32} />
                                                <p className="text-sm">{t('no-nearby-hotels')}</p>
                                                <p className="text-xs mt-1">{t('add-nearby-hotels-description')}</p>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            </AnimatePresence>

                            {/* Status & Actions */}
                            <AnimatePresence>
                                <motion.div
                                    variants={cardVariants}
                                    initial="hidden"
                                    animate="visible"
                                    exit="exit"
                                    transition={{ duration: 0.4, delay: 0.7 }}
                                    className="rounded-2xl border bg-gradient-to-br from-white/80 to-indigo-50 dark:from-gray-900/80 dark:to-indigo-900/40 shadow-xl p-4 glassmorphism space-y-3"
                                >
                                    <h3 className="text-base font-semibold mb-2 text-gray-800 dark:text-gray-100 flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-indigo-500 animate-pulse" />
                                        {t('status')}
                                    </h3>
                                    <div className="flex items-center gap-2">
                                        <Switch
                                            id="isActive"
                                            checked={publishStatus === 'published'}
                                            onCheckedChange={_handlePublishStatusChange}
                                        />
                                        <Label htmlFor="isActive" className="flex items-center gap-2">
                                            <Sun className="w-4 h-4 text-yellow-500 dark:hidden animate-spin-slow" />
                                            <Moon className="w-4 h-4 text-blue-500 hidden dark:inline animate-spin-slow" />
                                            {t('published')}
                                        </Label>
                                    </div>
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Action Buttons - Full width at bottom */}
                    <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <Button type="button" variant="outline" onClick={_handleCancel}>
                            {t('cancel')}
                        </Button>
                        <Button
                            type="submit"
                            disabled={creating || updating || uploadLoading || !watch('name') || !watch('type')}
                            className="font-semibold"
                        >
                            {creating || updating || uploadLoading
                                ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            {t('saving')}
                                        </>
                                    )
                                : (
                                        <>
                                            <Save className="h-4 w-4 mr-2" />
                                            {t('save')}
                                        </>
                                    )}
                        </Button>
                    </div>
                </form>

                {/* MapTiler Picker */}
                {showMapPicker && env.VITE_MAPTILER_KEY && (
                    <MapTilerPicker
                        apiKey={env.VITE_MAPTILER_KEY}
                        countries={countries?.map(country => ({
                            id: country.id!,
                            name: country.name!,
                            latitude: country.latitude || undefined,
                            longitude: country.longitude || undefined,
                        })) || []}
                        cities={cities?.map(city => ({
                            id: city.id!,
                            name: city.name!,
                            latitude: city.latitude || undefined,
                            longitude: city.longitude || undefined,
                            countryId: city.countryId!,
                        })) || []}
                        currentLng={watch('location.map.longitude')}
                        currentLat={watch('location.map.latitude')}
                        defaultLng={106.6297}
                        defaultLat={10.8231}
                        selectedCountryId={watch('location.countryId') || ''}
                        selectedCityId={watch('location.cityId') || ''}
                        onSelect={_handleMapLocationSelect}
                        onClose={() => setShowMapPicker(false)}
                        onCountryChange={countryId => setValue('location.countryId', countryId)}
                        onCityChange={cityId => setValue('location.cityId', cityId)}
                    />
                )}

                {/* Hotel MapTiler Picker */}
                {showHotelMapPicker !== null && env.VITE_MAPTILER_KEY && (
                    <MapTilerPicker
                        apiKey={env.VITE_MAPTILER_KEY}
                        countries={countries?.map(country => ({
                            id: country.id!,
                            name: country.name!,
                            latitude: country.latitude || undefined,
                            longitude: country.longitude || undefined,
                        })) || []}
                        cities={cities?.map(city => ({
                            id: city.id!,
                            name: city.name!,
                            latitude: city.latitude || undefined,
                            longitude: city.longitude || undefined,
                            countryId: city.countryId!,
                        })) || []}
                        currentLng={watch(`nearbyHotels.${showHotelMapPicker}.location.map.longitude`)}
                        currentLat={watch(`nearbyHotels.${showHotelMapPicker}.location.map.latitude`)}
                        defaultLng={106.6297}
                        defaultLat={10.8231}
                        selectedCountryId={watch(`nearbyHotels.${showHotelMapPicker}.location.countryId`) || ''}
                        selectedCityId={watch(`nearbyHotels.${showHotelMapPicker}.location.cityId`) || ''}
                        onSelect={data => _handleHotelMapLocationSelect(showHotelMapPicker, data)}
                        onClose={() => setShowHotelMapPicker(null)}
                        onCountryChange={countryId => setValue(`nearbyHotels.${showHotelMapPicker}.location.countryId`, countryId)}
                        onCityChange={cityId => setValue(`nearbyHotels.${showHotelMapPicker}.location.cityId`, cityId)}
                    />
                )}
            </DrawerContent>
        </Drawer>
    );
}
