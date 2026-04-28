import * as maptilersdk from '@maptiler/sdk';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import '@maptiler/sdk/dist/maptiler-sdk.css';

interface Country {
    id: string;
    name: string;
    latitude?: number;
    longitude?: number;
}

interface City {
    id: string;
    name: string;
    latitude?: number;
    longitude?: number;
    countryId: string;
}

const DEFAULT_CITIES: City[] = [];

function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(timer);
        };
    }, [value, delay]);

    return debouncedValue;
}

interface MapTilerPickerProps {
    apiKey: string;
    countries: Country[];
    cities?: City[];
    defaultLng?: number;
    defaultLat?: number;
    currentLng?: number;
    currentLat?: number;
    onSelect: (data: {
        lng: number;
        lat: number;
        address: string;
        countryId: string;
        cityId?: string;
    }) => void;
    onClose: () => void;
    selectedCountryId?: string;
    selectedCityId?: string;
    onCountryChange?: (countryId: string) => void;
    onCityChange?: (cityId: string) => void;
}

export function MapTilerPicker({
    apiKey,
    countries,
    cities = DEFAULT_CITIES,
    defaultLng = 106.6297,
    defaultLat = 10.8231,
    currentLng,
    currentLat,
    onSelect,
    onClose,
    selectedCountryId,
    selectedCityId,
    onCountryChange,
    onCityChange,
}: MapTilerPickerProps) {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const markerRef = useRef<maptilersdk.Marker | null>(null);
    const mapRef = useRef<maptilersdk.Map | null>(null);
    const [selectedCountry, setSelectedCountry] = useState<string>(() => selectedCountryId || '');
    const [selectedCity, setSelectedCity] = useState<string>(() => selectedCityId || '');
    const [countrySearchTerm, setCountrySearchTerm] = useState<string>(() => {
        const country = countries.find(c => c.id === selectedCountryId);
        return country?.name || '';
    });
    const [citySearchTerm, setCitySearchTerm] = useState<string>(() => {
        const city = cities.find(c => c.id === selectedCityId);
        return city?.name || '';
    });
    const [showCountryDropdown, setShowCountryDropdown] = useState<boolean>(false);
    const [showCityDropdown, setShowCityDropdown] = useState<boolean>(false);
    const [clearMessage, setClearMessage] = useState<string>('');
    const countryInputRef = useRef<HTMLInputElement>(null);
    const cityInputRef = useRef<HTMLInputElement>(null);
    const isFirstRenderRef = useRef<boolean>(true);

    const debouncedCountrySearch = useDebounce(countrySearchTerm, 200);
    const debouncedCitySearch = useDebounce(citySearchTerm, 200);

    const filteredCities = useMemo(
        () => cities.filter(city => !selectedCountry || city.countryId === selectedCountry),
        [cities, selectedCountry],
    );

    const filteredCountries = useMemo(
        () => countries.filter(country =>
            country.name.toLowerCase().includes(debouncedCountrySearch.toLowerCase()),
        ),
        [countries, debouncedCountrySearch],
    );

    const searchFilteredCities = useMemo(
        () => filteredCities.filter(city =>
            city.name.toLowerCase().includes(debouncedCitySearch.toLowerCase()),
        ),
        [filteredCities, debouncedCitySearch],
    );

    const limitedCountries = useMemo(
        () => filteredCountries.slice(0, 50),
        [filteredCountries],
    );

    const limitedCities = useMemo(
        () => searchFilteredCities.slice(0, 50),
        [searchFilteredCities],
    );

    const isCountrySearching = countrySearchTerm !== debouncedCountrySearch;
    const isCitySearching = citySearchTerm !== debouncedCitySearch;

    const selectedCountryName = countries.find(c => c.id === selectedCountry)?.name || '';
    const selectedCityName = cities.find(c => c.id === selectedCity)?.name || '';

    useEffect(() => {
        maptilersdk.config.apiKey = apiKey;

        let initialLng = defaultLng;
        let initialLat = defaultLat;
        let initialZoom = 10;

        // Priority 1: Use specific coordinates if available (previously selected location)
        if (currentLng && currentLat) {
            initialLng = currentLng;
            initialLat = currentLat;
            initialZoom = 15;
            console.warn('Using specific coordinates for initial position:', currentLat, currentLng);
        }
        // Priority 2: Use city coordinates if no specific coordinates but city is selected
        else if (selectedCity) {
            const city = cities.find(c => c.id === selectedCity);
            if (city && city.latitude && city.longitude) {
                initialLng = city.longitude;
                initialLat = city.latitude;
                initialZoom = 12;
                console.warn('Using city coordinates for initial position:', city.name, city.latitude, city.longitude);
            }
        }
        // Priority 3: Use country coordinates if no specific coordinates or city but country is selected
        else if (selectedCountry) {
            const country = countries.find(c => c.id === selectedCountry);
            if (country && country.latitude && country.longitude) {
                initialLng = country.longitude;
                initialLat = country.latitude;
                initialZoom = 6;
                console.warn('Using country coordinates for initial position:', country.name, country.latitude, country.longitude);
            }
        }

        const map = new maptilersdk.Map({
            container: mapContainerRef.current!,
            style: maptilersdk.MapStyle.STREETS,
            center: [initialLng, initialLat],
            zoom: initialZoom,
        });
        mapRef.current = map;

        markerRef.current = new maptilersdk.Marker().setLngLat([initialLng, initialLat]).addTo(map);

        map.on('click', async (e) => {
            const { lng, lat } = e.lngLat;
            markerRef.current?.setLngLat([lng, lat]);

            try {
                const res = await fetch(`https://api.maptiler.com/geocoding/${lng},${lat}.json?key=${apiKey}`);
                const geo = await res.json();

                const address = geo?.features?.[0]?.place_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;

                let countryId = selectedCountryId || '';
                let cityId = selectedCityId || '';

                const countryFeature = geo?.features?.find((feature: any) =>
                    feature.place_type?.includes('country'),
                );

                if (countryFeature) {
                    const countryName = countryFeature.text;
                    console.warn('Found country from geocoding:', countryName);
                    console.warn('Available countries:', countries.map(c => c.name));

                    const countryNameMappings: Record<string, string[]> = {
                        'vietnam': ['viet nam', 'vietnam'],
                        'viet nam': ['viet nam', 'vietnam'],
                        'united states': ['usa', 'united states', 'america'],
                        'usa': ['usa', 'united states', 'america'],
                        'united kingdom': ['uk', 'britain', 'england'],
                        'uk': ['uk', 'britain', 'england'],
                    };

                    const getCountryVariants = (name: string): string[] => {
                        const normalized = name.toLowerCase().trim();
                        return countryNameMappings[normalized] || [normalized];
                    };

                    let foundCountry = countries.find(c =>
                        c.name?.toLowerCase() === countryName.toLowerCase(),
                    );

                    if (!foundCountry) {
                        const geocodingVariants = getCountryVariants(countryName);
                        foundCountry = countries.find((c) => {
                            const dbVariants = getCountryVariants(c.name || '');
                            return geocodingVariants.some(geoVar =>
                                dbVariants.some(dbVar =>
                                    geoVar === dbVar || geoVar.includes(dbVar) || dbVar.includes(geoVar),
                                ),
                            );
                        });
                    }

                    if (!foundCountry) {
                        foundCountry = countries.find(c =>
                            c.name?.toLowerCase().includes(countryName.toLowerCase())
                            || countryName.toLowerCase().includes(c.name?.toLowerCase() || ''),
                        );
                    }

                    if (foundCountry) {
                        countryId = foundCountry.id;
                        console.warn('Matched country:', foundCountry);
                        setSelectedCountry(foundCountry.id);
                        setSelectedCity('');
                    }
                    else {
                        console.warn('No matching country found in database');
                    }
                }

                const cityFeature = geo?.features?.find((feature: any) =>
                    feature.place_type?.includes('place') || feature.place_type?.includes('locality'),
                );

                if (cityFeature && countryId) {
                    const cityName = cityFeature.text;
                    console.warn('Found city from geocoding:', cityName);
                    console.warn('Available cities for country:', cities.filter(c => c.countryId === countryId).map(c => c.name));

                    let foundCity = cities.find(c =>
                        c.countryId === countryId && c.name?.toLowerCase() === cityName.toLowerCase(),
                    );

                    if (!foundCity) {
                        foundCity = cities.find(c =>
                            c.countryId === countryId && (
                                c.name?.toLowerCase().includes(cityName.toLowerCase())
                                || cityName.toLowerCase().includes(c.name?.toLowerCase() || '')
                            ),
                        );
                    }

                    if (foundCity) {
                        cityId = foundCity.id;
                        console.warn('Matched city:', foundCity);
                        setSelectedCity(foundCity.id);
                    }
                    else {
                        console.warn('No matching city found in database');
                    }
                }

                onSelect({ lng, lat, address, countryId, cityId });
                onClose();
            }
            catch (error) {
                console.error('Geocoding error:', error);
                const address = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
                onSelect({ lng, lat, address, countryId: selectedCountryId || '', cityId: selectedCityId });
                onClose();
            }
        });

        return () => {
            map.remove();
        };
    }, [apiKey, currentLng, currentLat, defaultLng, defaultLat, onSelect, onClose, countries, cities, selectedCountryId, selectedCityId, selectedCity, selectedCountry]);

    const flyToCountryOrCity = useCallback((countryId?: string, cityId?: string) => {
        if (!mapRef.current) {
            console.warn('Map not initialized');
            return;
        }

        // Priority: City first, then country
        if (cityId) {
            const city = cities.find(c => c.id === cityId);
            if (city && city.latitude && city.longitude) {
                console.warn('Flying to city:', city.name, city.latitude, city.longitude);
                mapRef.current.flyTo({
                    center: [city.longitude, city.latitude],
                    zoom: 12,
                    essential: true,
                });
                markerRef.current?.setLngLat([city.longitude, city.latitude]);
                return;
            }
            else {
                console.warn('City not found or missing coordinates:', cityId);
            }
        }

        if (countryId) {
            const country = countries.find(c => c.id === countryId);
            if (country && country.latitude && country.longitude) {
                console.warn('Flying to country:', country.name, country.latitude, country.longitude);
                mapRef.current.flyTo({
                    center: [country.longitude, country.latitude],
                    zoom: 6,
                    essential: true,
                });
                markerRef.current?.setLngLat([country.longitude, country.latitude]);
                return;
            }
            else {
                console.warn('Country not found or missing coordinates:', countryId);
            }
        }

        // If no city or country coordinates found, don't move the map or marker
        console.warn('No valid coordinates found for country/city navigation');
    }, [cities, countries]);
    useEffect(() => {
        if (mapRef.current) {
            const timer = setTimeout(() => {
                // Only fly to country/city after first render (when user actively changes selection)
                // Skip if it's the first render and we have specific coordinates
                if (!isFirstRenderRef.current || (!currentLng || !currentLat)) {
                    flyToCountryOrCity(selectedCountry, selectedCity);
                }
                isFirstRenderRef.current = false;
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [selectedCountry, selectedCity, flyToCountryOrCity, currentLng, currentLat]);

    const clearCountry = useCallback(() => {
        setSelectedCountry('');
        setSelectedCity('');
        setCountrySearchTerm('');
        setCitySearchTerm('');
        onCountryChange?.('');
        onCityChange?.('');
        setClearMessage('Country cleared. Please select another country.');

        setTimeout(() => {
            setClearMessage('');
        }, 3000);

        setTimeout(() => {
            countryInputRef.current?.focus();
        }, 100);
    }, [onCountryChange, onCityChange]);

    const clearCity = useCallback(() => {
        setSelectedCity('');
        setCitySearchTerm('');
        onCityChange?.('');
        setClearMessage('City cleared. Please select another city.');

        setTimeout(() => {
            setClearMessage('');
        }, 3000);

        setTimeout(() => {
            cityInputRef.current?.focus();
        }, 100);
    }, [onCityChange]);

    useEffect(() => {
        const original = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = original;
        };
    }, []);

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-lg shadow-lg p-4 relative w-[90vw] max-w-2xl h-[90vh] flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                <button type="button" className="absolute top-2 right-2 text-lg cursor-pointer" onClick={onClose}>✕</button>

                {/* Clear Message */}
                {clearMessage && (
                    <div className="mb-2 p-2 bg-blue-100 border border-blue-300 rounded text-blue-700 text-sm">
                        {clearMessage}
                    </div>
                )}

                <div className="mb-2 space-y-2">
                    {/* Country Autocomplete */}
                    <div className="relative">
                        <div className="relative">
                            <input
                                ref={countryInputRef}
                                type="text"
                                className="border rounded px-3 py-2 w-full pr-8"
                                placeholder="Type to search country..."
                                value={countrySearchTerm}
                                onFocus={() => {
                                    setShowCountryDropdown(true);
                                    if (!countrySearchTerm && selectedCountryName) {
                                        setCountrySearchTerm(selectedCountryName);
                                    }
                                }}
                                onBlur={() => {
                                    setTimeout(() => {
                                        setShowCountryDropdown(false);
                                        const matchedCountry = countries.find(c =>
                                            c.name.toLowerCase() === countrySearchTerm.toLowerCase(),
                                        );
                                        if (matchedCountry) {
                                            setSelectedCountry(matchedCountry.id);
                                            onCountryChange?.(matchedCountry.id);
                                        }
                                        else if (!countrySearchTerm) {
                                            setSelectedCountry('');
                                            setSelectedCity('');
                                            onCountryChange?.('');
                                            onCityChange?.('');
                                        }
                                    }, 150);
                                }}
                                onChange={(e) => {
                                    setCountrySearchTerm(e.target.value);
                                    setShowCountryDropdown(true);
                                    if (e.target.value !== selectedCountryName) {
                                        setSelectedCountry('');
                                        setSelectedCity('');
                                        onCountryChange?.('');
                                        onCityChange?.('');
                                    }
                                }}
                            />
                            {(selectedCountry || selectedCountryName) && (
                                <button
                                    type="button"
                                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 cursor-pointer"
                                    onClick={clearCountry}
                                    title="Clear country"
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                        {showCountryDropdown && (
                            <div className="absolute top-full left-0 right-0 bg-white border border-t-0 rounded-b max-h-48 overflow-y-auto z-10">
                                {isCountrySearching
                                    ? (
                                            <div className="px-3 py-2 text-gray-500 text-sm">
                                                <div className="flex items-center gap-2">
                                                    <div className="animate-spin w-3 h-3 border border-gray-300 border-t-blue-500 rounded-full"></div>
                                                    Searching...
                                                </div>
                                            </div>
                                        )
                                    : limitedCountries.length > 0
                                        ? (
                                                <>
                                                    {limitedCountries.map(country => (
                                                        <div
                                                            key={country.id}
                                                            className="px-3 py-2 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
                                                            onMouseDown={(e) => {
                                                                e.preventDefault();
                                                                setSelectedCountry(country.id);
                                                                setSelectedCity('');
                                                                setCountrySearchTerm(country.name);
                                                                setCitySearchTerm('');
                                                                setShowCountryDropdown(false);
                                                                onCountryChange?.(country.id);
                                                                onCityChange?.('');
                                                                flyToCountryOrCity(country.id);
                                                            }}
                                                        >
                                                            {country.name}
                                                        </div>
                                                    ))}
                                                    {filteredCountries.length > 50 && (
                                                        <div className="px-3 py-2 text-gray-500 text-xs border-t">
                                                            Showing first 50 results. Type more to refine search.
                                                        </div>
                                                    )}
                                                </>
                                            )
                                        : (
                                                <div className="px-3 py-2 text-gray-500 text-sm">
                                                    No countries found matching &quot;
                                                    {countrySearchTerm}
                                                    &quot;
                                                </div>
                                            )}
                            </div>
                        )}
                    </div>

                    {/* City Autocomplete */}
                    {filteredCities.length > 0 && (
                        <div className="relative">
                            <div className="relative">
                                <input
                                    ref={cityInputRef}
                                    type="text"
                                    className="border rounded px-3 py-2 w-full pr-8"
                                    placeholder="Type to search city (optional)..."
                                    value={citySearchTerm}
                                    onFocus={() => {
                                        setShowCityDropdown(true);
                                        if (!citySearchTerm && selectedCityName) {
                                            setCitySearchTerm(selectedCityName);
                                        }
                                    }}
                                    onBlur={() => {
                                        setTimeout(() => {
                                            setShowCityDropdown(false);
                                            const matchedCity = filteredCities.find(c =>
                                                c.name.toLowerCase() === citySearchTerm.toLowerCase(),
                                            );
                                            if (matchedCity) {
                                                setSelectedCity(matchedCity.id);
                                                onCityChange?.(matchedCity.id);
                                            }
                                            else if (!citySearchTerm) {
                                                setSelectedCity('');
                                                onCityChange?.('');
                                            }
                                        }, 150);
                                    }}
                                    onChange={(e) => {
                                        setCitySearchTerm(e.target.value);
                                        setShowCityDropdown(true);
                                        if (e.target.value !== selectedCityName) {
                                            setSelectedCity('');
                                            onCityChange?.('');
                                        }
                                    }}
                                />
                                {(selectedCity || selectedCityName) && (
                                    <button
                                        type="button"
                                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 cursor-pointer"
                                        onClick={clearCity}
                                        title="Clear city"
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>
                            {showCityDropdown && (
                                <div className="absolute top-full left-0 right-0 bg-white border border-t-0 rounded-b max-h-48 overflow-y-auto z-10">
                                    {isCitySearching
                                        ? (
                                                <div className="px-3 py-2 text-gray-500 text-sm">
                                                    <div className="flex items-center gap-2">
                                                        <div className="animate-spin w-3 h-3 border border-gray-300 border-t-blue-500 rounded-full"></div>
                                                        Searching...
                                                    </div>
                                                </div>
                                            )
                                        : limitedCities.length > 0
                                            ? (
                                                    <>
                                                        {limitedCities.map(city => (
                                                            <div
                                                                key={city.id}
                                                                className="px-3 py-2 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
                                                                onMouseDown={(e) => {
                                                                    e.preventDefault();
                                                                    setSelectedCity(city.id);
                                                                    setCitySearchTerm(city.name);
                                                                    setShowCityDropdown(false);
                                                                    onCityChange?.(city.id);
                                                                    flyToCountryOrCity(selectedCountry, city.id);
                                                                }}
                                                            >
                                                                {city.name}
                                                            </div>
                                                        ))}
                                                        {searchFilteredCities.length > 50 && (
                                                            <div className="px-3 py-2 text-gray-500 text-xs border-t">
                                                                Showing first 50 results. Type more to refine search.
                                                            </div>
                                                        )}
                                                    </>
                                                )
                                            : (
                                                    <div className="px-3 py-2 text-gray-500 text-sm">
                                                        No cities found matching &quot;
                                                        {citySearchTerm}
                                                        &quot;
                                                    </div>
                                                )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
                <div
                    ref={mapContainerRef}
                    className="flex-1 min-h-[400px] rounded"
                    onPointerDown={e => e.stopPropagation()}
                    onTouchStart={e => e.stopPropagation()}
                    onMouseDown={e => e.stopPropagation()}
                />
                <div className="text-center text-gray-500 text-sm mt-2">Click on the map to select location</div>
            </div>
        </div>
    );
}
